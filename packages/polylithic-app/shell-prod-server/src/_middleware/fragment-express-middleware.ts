import type {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FragmentConfig, FragmentGateway } from 'web-fragments/gateway';
import trumpet, { TrumpetElement } from '@gofunky/trumpet';
import { Readable as NodeReadable } from 'node:stream';

const fragmentHostInitialization = ({
  fragmentId,
  content,
  classNames,
}: {
  fragmentId: string;
  content: string;
  classNames: string;
}) => `
<fragment-host class="${classNames}" fragment-id="${fragmentId}" data-piercing="true">
  <template shadowrootmode="open">${content}</template>
</fragment-host>
`;

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
          next();
          // await processFragmentForEmbedding(fragmentResponse, response, matchedFragment);
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

  // process the fragment response for embedding into the host document
  async function processFragmentForEmbedding(
    fragmentResponse: Response,
    res: ExpressResponse,
    fragmentConfig: FragmentConfig,
  ) {
    const tr = trumpet();
    const { fragmentId, prePiercingClassNames } = fragmentConfig;

    // inject the fragment's content into the host document head
    // TODO: fix this. the piercing Styles are not embedded
    tr.select('head', (element) => {
      element.createWriteStream().end(gateway.prePiercingStyles);
    });

    const fragmentContent = await fragmentResponse.text();

    tr.select('body', (element) => {
      const bodyWriteStream = element.createWriteStream();
      bodyWriteStream.end(
        fragmentHostInitialization({
          fragmentId,
          content: fragmentContent,
          classNames: prePiercingClassNames.join(' '),
        }),
      );

      // pipe the fragment's body content through trumpet
      const fragmentStream = NodeReadable.fromWeb(fragmentResponse.body as any);
      tr.pipe(fragmentStream as any);
    });
  }

  // process the fragment response for embedding into the host document
  function processFragmentForReframing(
    fragmentResponseReadable: NodeReadable,
  ): NodeReadable {
    console.log('[Debug Info | processFragmentForReframing]');

    const tr = trumpet() as any;

    // inject the fragment's content into the host document head
    tr.selectAll('script', (element: TrumpetElement) => {
      const scriptType = element.getAttribute('type', (scriptType: string) => {
        element.setAttribute('data-script-type', scriptType);
      });
      element.setAttribute('type', 'inert');
    });

    // pipe the fragment's body content through trumpet
    return fragmentResponseReadable.pipe(tr);
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
