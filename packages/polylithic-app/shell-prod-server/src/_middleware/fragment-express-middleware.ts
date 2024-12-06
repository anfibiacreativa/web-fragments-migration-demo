import type {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FragmentConfig, FragmentGateway } from 'web-fragments/gateway';
import trumpet, { Trumpet, TrumpetElement } from '@gofunky/trumpet';
import { HTMLRewriter } from 'htmlrewriter';
import fs from 'node:fs';
import path from 'node:path';
import { Readable as NodeReadable, Writable as NodeWritable, Duplex as NodeDuplex, PassThrough as NodePassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type FragmentMiddlewareOptions = {
  additionalHeaders?: HeadersInit;
  mode?: 'production' | 'development';
};

type ExpressMiddleware = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction,
) => void;


/**
 * Creates an instance of ExpressMiddleware to be used in an Express server powering a Fragment Gateway
 * 
 * @param gateway instance of a FragmentGateway
 * @param options FragmentMiddlewareOptions
 * @returns 
 */
export function getMiddleware(
  gateway: FragmentGateway,
  options: FragmentMiddlewareOptions = {},
): ExpressMiddleware {
  const { additionalHeaders = {}, mode = 'development' } = options;

  return async (
    expressRequest: ExpressRequest,
    expressResponse: ExpressResponse,
    next: NextFunction,
  ) => {
    const reqUrl = new URL('http://foo.bar' + expressRequest.url);
    console.log('[Debug Info | Local request]:', reqUrl.href);

    if (expressRequest.headers['sec-fetch-dest'] === 'script') {
      console.log('[Debug Info | Dynamic script request]', expressRequest.url);
      expressResponse.setHeader('content-type', 'text/javascript');
      // Fallback logic if needed
      console.log("Sec-Fetch-Dest indicates a script");
    }

    const matchedFragment = gateway.matchRequestToFragment(reqUrl.href);

    if (matchedFragment) {
      console.log('[Debug Info | Matched Fragment]:' + JSON.stringify(matchedFragment));

      if (expressRequest.headers['sec-fetch-dest'] === 'iframe') {
        console.log(`[Debug Info]: Request Iframe for: ` + JSON.stringify(matchedFragment));
        expressResponse.setHeader('content-type', 'text/html');
        return expressResponse.end('<!doctype html><title>');
      }

      // fetch the fragment only after ensuring route is processed
      const fragmentResponse = await fetchFragment(expressRequest, matchedFragment);

      // process fragment embedding only if it's a document request
      if (expressRequest.headers['sec-fetch-dest'] === 'document') {
        console.log('[Debug Info | Document request]');
        try {
          if (!fragmentResponse.ok) throw new Error(`Fragment response not ok: ${fragmentResponse.status}`);

          expressResponse.setHeader('content-type', 'text/html');

          // TODO: we should really be calling (next) here to allow all express middleware's to execute
          //       instead of reading the file directly from the system. But next() is sync and doesn't
          //       allow for easy composition of responses so we're doing this for now.
          fs.createReadStream(path.resolve(__dirname, '../angular-shell-app/browser/index.html'))
            .pipe(embedFragmentSSR(fragmentResponse, matchedFragment, expressRequest.path))
            .pipe(expressResponse);
        } catch (err) {
          console.error('[Error] Error during fragment embedding:', err);
          return renderErrorResponse(err, expressResponse);
        }
      } else {
        // for non-document requests, just pipe the fragment directly
        if (fragmentResponse.body) {
          expressResponse.setHeader('content-type', fragmentResponse.headers.get('content-type') || "text/plain");
          const fragmentResponseReadable = NodeReadable.fromWeb(fragmentResponse.body as any);

          // otherwise just pipe the response back to the client
          fragmentResponseReadable.pipe(expressResponse);

        } else {
          console.error('[Error] No body in fragment response');
          expressResponse.status(500).send('<p>Fragment response body is empty.</p>');
        }
      }
    } else {
      // if no fragment is matched, default to server handling
      return next();
    }
  };

  // fetch the fragment
  async function fetchFragment(
    request: ExpressRequest,
    fragmentConfig: FragmentConfig,
  ): Promise<Response> {
    const { upstream } = fragmentConfig;
    const protocol = request.protocol;
    const host = request.host;
    const pathname = request.path;

    const fetchUrl = new URL(`${protocol}://${host}${pathname}`);
    console.log('[Debug Info | Browser Fetch URL]: ' + fetchUrl);

    const headers = new Headers();

    // copy headers from the original request
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
          value.forEach(val => headers.append(key, val));
        } else if (value) {
          headers.append(key, value);
        }
      }
    }

    headers.append('sec-fetch-dest', 'empty');
    headers.append('x-fragment-mode', 'embedded');

    // handle local development mode
    // TODO: validate we still need this?
    if (mode === 'development') {
      headers.append('Accept-Encoding', 'gzip');
    }

    // prepare the fragment request
    const fragmentReqUrl = new URL(request.url, upstream);
    const fragmentReq = new Request(fragmentReqUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
    });

    // forward additional headers
    Object.entries(additionalHeaders).forEach(([name, value]) => {
      fragmentReq.headers.set(name, value as string);
    });

    const fragmentResponse = await fetch(fragmentReq);

    console.log(`[Debug Info | Gateway Fetch Response]: status=${fragmentResponse.status}, content-type=${fragmentResponse.headers.get('content-type')}, url=${fragmentReq.url}`);
    return fragmentResponse;
  }


  /**
   * Embeds the fragment SSR stream into the final response.
   * 
   * This implementation uses Trumpet, which works for this use-case but is not reliable for other html rewriting needs
   * so we should just switch to HTMLRewriter as started in embedFragmentSSR2.
   */
  function embedFragmentSSR(fragmentResponse: Response, fragmentConfig: FragmentConfig, fragmentSrc: string): Trumpet {

    const { fragmentId, prePiercingClassNames } = fragmentConfig;

    console.log('[Debug Info | embedFragmentSSR]');

    const tr = trumpet();

    // inject the fragment's styles into the host document head
    tr.select('head', (head: TrumpetElement) => {
      const headStreamR = head.createReadStream();
      const headStreamW = head.createWriteStream();
      mergeStreams(
        headStreamR,
        NodeReadable.from(gateway.prePiercingStyles)
      ).pipe(headStreamW);
    });


    // inject the fragment's SSR into the host document body
    const { prefix: fragmentHostPrefix, suffix: fragmentHostSuffix } = fragmentHostInitialization({
      fragmentId,
      fragmentSrc: fragmentSrc,
      classNames: prePiercingClassNames.join(" "),
    });


    tr.select('body', async (body: TrumpetElement) => {
      const bodyStreamR = body.createReadStream();
      const bodyStreamW = body.createWriteStream();

      const processedBody = await processFragmentForReframing(fragmentResponse).text();
      mergeStreams(
        bodyStreamR,
        NodeReadable.from(fragmentHostPrefix),
        NodeReadable.from(processedBody),
        NodeReadable.from(fragmentHostSuffix),
      ).pipe(bodyStreamW);
    });

    // pipe the fragment's body content through trumpet
    return tr;
  }

  // TODO: clean this up and get rid of embedFragmentSSR and dependency on Trumpet which seems too unreliable
  function embedFragmentSSR2(
    fragmentResponse: Response,
    fragmentConfig: FragmentConfig,
    fragmentSrc: string
  ) {
    const { fragmentId, prePiercingClassNames } = fragmentConfig;

    const { prefix: fragmentHostPrefix, suffix: fragmentHostSuffix } = fragmentHostInitialization({
      fragmentId,
      fragmentSrc: fragmentSrc,
      classNames: prePiercingClassNames.join(" "),
    })

    const transform = new NodePassThrough();

    const rewrittenResponseBody = new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append(gateway.prePiercingStyles, { html: true });
        },
      })
      .on("body", {
        async element(element) {
          element.append(fragmentHostPrefix, { html: true });
          // TODO: this should be a stream append rather than buffer to text & append
          //       update once HTMLRewriter is updated
          element.append(await fragmentResponse.text(), { html: true });
          element.append(fragmentHostSuffix, { html: true });
        },
      })
      .transform(new Response(NodeReadable.toWeb(transform) as any)).body;

    NodeReadable.fromWeb(rewrittenResponseBody as any).pipe(transform);

    return transform;
  }

  // process the fragment response for embedding into the host document
  function processFragmentForReframing(fragmentResponse: Response) {
    console.log('[Debug Info | processFragmentForReframing]');

    return new HTMLRewriter()
      .on("script", {
        element(element: any) {
          const scriptType = element.getAttribute("type");
          if (scriptType) {
            element.setAttribute("data-script-type", scriptType);
          }
          element.setAttribute("type", "inert");
        },
      })
      .transform(fragmentResponse);
  }

  // render an error response if something goes wrong
  function renderErrorResponse(err: unknown, response: ExpressResponse) {
    if (err instanceof Error) {
      response.status(500).send(`<p>Error: ${err.message}</p>`);
    } else {
      response.status(500).send('<p>Unknown error occurred.</p>');
    }
  }
}

function mergeStreams(...streams: NodeReadable[]) {
  let combined = new NodePassThrough()
  for (let stream of streams) {
    const end = stream === streams.at(-1);
    combined = stream.pipe(combined, { end })
  }
  return combined;
}

function fragmentHostInitialization({
  fragmentId,
  fragmentSrc,
  classNames,
}: {
  fragmentId: string;
  fragmentSrc: string;
  classNames: string;
}) {
  return {
    prefix: `<fragment-host class="${classNames}" fragment-id="${fragmentId}" src="${fragmentSrc}" data-piercing="true"><template shadowrootmode="open">`,
    suffix: `</template></fragment-host>`
  }
};