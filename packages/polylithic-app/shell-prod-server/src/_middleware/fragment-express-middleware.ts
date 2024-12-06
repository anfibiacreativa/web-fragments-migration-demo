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
          //next();
          if (!fragmentResponse.ok) throw new Error(`Fragment response not ok: ${fragmentResponse.status}`);

          //const fragmentResponseBody = await fragmentResponse.text();
          
          expressResponse.setHeader('content-type', 'text/html');
          fs.createReadStream(path.resolve(__dirname, '../angular-shell-app/browser/index.html'))
            .pipe(embedFragmentSSR(fragmentResponse, matchedFragment))
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


  function embedFragmentSSR(fragmentResponse: Response, fragmentConfig: FragmentConfig): Trumpet {

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
    const {prefix: fragmentHostPrefix, suffix: fragmentHostSuffix} = fragmentHostInitialization({
      fragmentId,
      fragmentSrc: "/store/catalog",
      classNames: prePiercingClassNames.join(" "),
    });


    tr.select('body', async (body: TrumpetElement) => {
      const bodyStreamR = body.createReadStream();
      const bodyStreamW = body.createWriteStream();
      
      
      // bodyStreamR.pipe(bodyStreamW, {end: false});
      // NodeReadable.from(fragmentHostPrefix).pipe(bodyStreamW, {end: false});
      // NodeReadable.from('<!-- 12 -->').pipe(bodyStreamW, {end: false});
      // //fragmentResponseNode.pipe(bodyStreamW, {end: true});
      // NodeReadable.from(fragmentResponseBody).pipe(bodyStreamW, {end: true});
      // NodeReadable.from('<!-- 22 -->').pipe(bodyStreamW, {end: false});
      // NodeReadable.from(fragmentHostSuffix).pipe(bodyStreamW, {end: true});
      const processedBody = await processFragmentForReframing(fragmentResponse).text();
      mergeStreams(
        bodyStreamR,
        NodeReadable.from(fragmentHostPrefix),
        NodeReadable.from('<!-- 1 -->'),
        NodeReadable.from(processedBody),
        //NodeReadable.fromWeb(processFragmentForReframing(fragmentResponse).body as any),
        //NodeReadable.from(fragmentResponseBody).pipe(()),
        NodeReadable.from('<!-- 2 -->'),
        NodeReadable.from(fragmentHostSuffix),
      ).pipe(bodyStreamW);
    });

    // console.log(fragmentResponse.status, fragmentResponse.headers, fragmentResponse.body)
    // mergeStreams(
    //   bodyStream,
    //   NodeReadable.from(fragmentHostPrefix),
    //   NodeReadable.fromWeb(fragmentResponse.body as any),
    //   NodeReadable.from(fragmentHostSuffix),
    //     //.pipe(processFragmentForReframing()),
      
    // ).pipe(bodyStream)

    // pipe the fragment's body content through trumpet
    return tr;
}

  // process the fragment response for embedding into the host document
  function processFragmentForReframing(fragmentResponse: Response) {
    console.log('[Debug Info | processFragmentForReframing]');

    return new HTMLRewriter()
			.on("script", {
				element(element: any) {
          console.log('asdfasdf -----');
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