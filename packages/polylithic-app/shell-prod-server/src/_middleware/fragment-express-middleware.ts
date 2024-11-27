import type {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FragmentConfig, FragmentGateway } from 'web-fragments/gateway';
import trumpet from '@gofunky/trumpet';
import { Readable as NodeReadableStream } from 'node:stream';

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
    request: ExpressRequest,
    response: ExpressResponse,
    next: NextFunction,
  ) => {
    const reqUrl = new URL('http://foo.bar' + request.url);
    console.log('[Debug Info | Local request]:', reqUrl.href);

    const matchedFragment = gateway.matchRequestToFragment(reqUrl.href);

    if (matchedFragment) {
      console.log('[Debug Info | Matched Fragment]:' + JSON.stringify(matchedFragment));

      if (request.headers['sec-fetch-dest'] === 'iframe') {
        console.log(`[Debug Info]: Request Iframe for: ` + JSON.stringify(matchedFragment));
        response.setHeader('content-type', 'text/html');
        return response.end('<!doctype html><title>');
      }

      // fetch the fragment only after ensuring route is processed
      const fragmentResponse = await fetchFragment(request, matchedFragment);

      // process fragment embedding only if it's a document request
      if (request.headers['sec-fetch-dest'] === 'document') {
        console.log('[Debug Info | Document request]');
        try {
          next();
          //await processFragmentForEmbedding(fragmentResponse, response, matchedFragment);
        } catch (err) {
          console.error('[Error] Error during fragment embedding:', err);
          return renderErrorResponse(err, response);
        }
      } else {
        // for non-document requests, just pipe the fragment directly
        if (fragmentResponse.body) {
          const nodeReadableStream = NodeReadableStream.fromWeb(fragmentResponse.body as any);
          nodeReadableStream.pipe(response);
        } else {
          console.error('[Error] No body in fragment response');
          response.status(500).send('<p>Fragment response body is empty.</p>');
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
    const host = request.host;
    const pathname = request.path;

    const fetchUrl = new URL(`${host}${pathname}`);
    console.log('[Debug Info | Fetch URL]: ' + fetchUrl);

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
    const fragmentReq = new Request(upstream, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
    });

    // forward additional headers
    Object.entries(additionalHeaders).forEach(([name, value]) => {
      fragmentReq.headers.set(name, value as string);
    });

    const fragmentResponse = await fetch(fragmentReq);
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
      const fragmentStream = NodeReadableStream.fromWeb(fragmentResponse.body as any);
      tr.pipe(fragmentStream as any);
    });
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
