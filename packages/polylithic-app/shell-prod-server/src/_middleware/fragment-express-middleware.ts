import {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FragmentConfig, FragmentGateway } from 'web-fragments/gateway';

import trumpet from '@gofunky/trumpet';

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
    // Construct the full URL
    const protocol = request.protocol || 'http';
    const host = request.get('host');

    if (!host) {
      console.error('[Middleware] Missing Host header.');
      return response.status(400).send('Bad Request: Missing Host header.');
    }

    let fullUrl: string;
    try {
      fullUrl = new URL(request.url, `${protocol}://${host}`).toString();
    } catch (error) {
      console.error('[Middleware] Invalid URL:', error);
      return response.status(400).send('Bad Request: Invalid URL.');
    }

    console.log(`[Middleware] Full URL: ${fullUrl}`);

    const matchedFragment = gateway.matchRequestToFragment(fullUrl);

    if (!matchedFragment) {
      return next(); // No fragment matched; pass control to the next middleware
    }

    try {
      // Handle requests based on the `sec-fetch-dest` header
      if (request.headers['sec-fetch-dest'] === 'iframe') {
        response.setHeader('content-type', 'text/html');
        return response.end('<!doctype html><title>'); // Respond with a minimal document
      }

      const fragmentResponse = await fetchFragment(
        new Request(fullUrl, {
          method: request.method,
          body:
            request.method !== 'GET' && request.method !== 'HEAD'
              ? JSON.stringify(request.body)
              : undefined,
        }),
        matchedFragment,
      );

      if (request.headers['sec-fetch-dest'] === 'document') {
        // Embed fragment in the original HTML page
        return handleDocumentRequest(
          response,
          fragmentResponse,
          matchedFragment,
        );
      }

      // Otherwise, let the request proceed
      return next();
    } catch (err) {
      console.error('Error in middleware:', err);
      response.status(500).send('Internal Server Error');
    }
  };

  async function fetchFragment(
    request: Request,
    fragmentConfig: FragmentConfig,
  ): Promise<Response> {
    const { upstream } = fragmentConfig;
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(
      `${requestUrl.pathname}${requestUrl.search}`,
      upstream,
    );

    const fragmentReq = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        ...Object.fromEntries(new Headers(additionalHeaders).entries()),
        'sec-fetch-dest': 'empty',
        'x-fragment-mode': 'embedded',
        ...(mode === 'development' ? { 'Accept-Encoding': 'gzip' } : {}),
      },
      body:
        request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
    });

    const response = await fetch(fragmentReq);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch fragment from upstream: ${response.status}`);
    }

    return response;
  }

  async function handleDocumentRequest(
    response: ExpressResponse,
    fragmentResponse: Response,
    fragmentConfig: FragmentConfig,
  ) {
    const { fragmentId, prePiercingClassNames } = fragmentConfig;

    // Convert the fragment response body to a string
    const fragmentContent = await fragmentResponse.text();

    // Create a stream to modify the response HTML
    const htmlModifier = trumpet();

    // Inject pre-piercing styles into the `<head>`
    htmlModifier.select('head', (element: any) => {
      element.createWriteStream().end(gateway.prePiercingStyles);
    });

    // Embed the fragment HTML into the `<body>`
    htmlModifier.select('body', (element: any) => {
      const bodyStream = element.createWriteStream();
      bodyStream.end(
        fragmentHostInitialization({
          fragmentId,
          content: fragmentContent,
          classNames: prePiercingClassNames.join(' '),
        }),
      );
    });

    // Pipe the modified HTML stream to the response
    response.setHeader('content-type', 'text/html');
    response.writeHead(200);

    htmlModifier.pipe(response);
  }
}
