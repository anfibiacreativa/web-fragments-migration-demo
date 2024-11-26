import {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FragmentConfig, FragmentGateway } from 'web-fragments/gateway';
import trumpet from '@gofunky/trumpet';
import { Readable, Writable } from 'stream';
import fs from 'fs';
import path from 'path';

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
      return next();
    }

    console.log(`[Middleware] Matched Fragment: ${matchedFragment.fragmentId}`);
    console.log(`[Middleware] Fragment Configuration:`, matchedFragment);

    try {
      const fragmentResponse = await fetchFragment(matchedFragment);

      if (!fragmentResponse.ok) {
        console.error(
          `[Middleware] Failed to fetch fragment. Upstream responded with status: ${fragmentResponse.status}`,
        );
        return response
          .status(500)
          .send('Internal Server Error: Fragment fetch failed.');
      }

      console.log('[Middleware] Fragment fetched successfully from upstream.');

      return embedFragmentIntoHtml(response, fragmentResponse, matchedFragment);
    } catch (err) {
      console.error('[Middleware] Error:', err);
      response.status(500).send('Internal Server Error');
    }
  };

  async function fetchFragment(fragmentConfig: FragmentConfig): Promise<Response> {
    const { upstream } = fragmentConfig;

    console.log(`[fetchFragment] Using upstream URL: ${upstream}`);

    const headers = new Headers();
    headers.set('sec-fetch-dest', 'empty');
    headers.set('x-fragment-mode', 'embedded');

    const fragmentRequest = new Request(upstream, {
      method: 'GET',
      headers,
    });

    const response = await fetch(fragmentRequest);

    console.log(`[fetchFragment] Fragment response status: ${response.status}`);
    return response;
  }

  function embedFragmentIntoHtml(
    response: ExpressResponse,
    fragmentResponse: Response,
    fragmentConfig: FragmentConfig,
  ) {
    const { fragmentId, prePiercingClassNames } = fragmentConfig;
    const angularShellPath = path.resolve('./dist/angular-shell-app/browser/index.html');
    console.log('### Angular Shell Path', angularShellPath);
    if (!fs.existsSync(angularShellPath)) {
      console.error('[embedFragmentIntoHtml] Angular shell file not found.');
      return response
        .status(500)
        .send('Internal Server Error: Angular shell not found.');
    }

    const htmlModifier = trumpet();

    htmlModifier.select('head', (element: any) => {
      const headReadStream = element.createReadStream();
      console.log('[Debug] Head Stream Selected:', !!headReadStream);

      const headWriteStream = element.createWriteStream();
      let headLegacyContent = '';

      headReadStream.on('data', (chunk: any) => {
        console.log('[Debug] Received chunk:', chunk.toString());
        headLegacyContent += chunk.toString();
      });

      headReadStream.on('end', () => {
        console.log('[Debug] Completed reading head content.');
        const modifiedHeadContent = headLegacyContent + gateway.prePiercingStyles;

        console.log(
          `[embedFragmentIntoHtml] Modified Head Content: ${modifiedHeadContent}`
        );

        headWriteStream.end(modifiedHeadContent);
      });

      headReadStream.on('error', (err: Error) => {
        console.error('[Debug] Error while reading head content:', err);
        headWriteStream.end();
      });
    });

    htmlModifier.select('body', async (element: any) => {
      const bodyReadStream = element.createReadStream();
      const bodyWriteStream = element.createWriteStream();

      let bodyLegacyContent = '';

      bodyReadStream.on('data', (chunk: any) => {
        console.log('[Debug] Received body chunk:', chunk.toString());
        bodyLegacyContent += chunk.toString();
      });

      bodyReadStream.on('end', async () => {
        console.log('[Debug] Completed reading body content.');

        const fragmentContent = await fragmentResponse.text();
        console.log(
          `[embedFragmentIntoHtml] Embedding fragment content into body. Fragment Length: ${fragmentContent.length}`
        );

        const modifiedBodyContent =
          bodyLegacyContent +
          fragmentHostInitialization({
            fragmentId,
            content: fragmentContent,
            classNames: prePiercingClassNames.join(' '),
          });

        console.log(
          `[embedFragmentIntoHtml] Final Modified Body Content Length: ${modifiedBodyContent.length}`
        );

        bodyWriteStream.end(modifiedBodyContent);
      });

      bodyReadStream.on('error', (err: Error) => {
        console.error('[Debug] Error while reading body content:', err);
        bodyWriteStream.end();
      });
    });

    console.log('[embedFragmentIntoHtml] Serving modified Angular shell.');
    response.setHeader('content-type', 'text/html');
    fs.createReadStream(angularShellPath).pipe(htmlModifier as unknown as Writable).pipe(response);
  }
}
