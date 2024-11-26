import express from 'express';
import fs from 'fs';
import path from 'path';
import { getMiddleware } from './_middleware/fragment-express-middleware.js';
import { FragmentGateway, FragmentConfig } from 'web-fragments/gateway';
import { Readable, Writable } from 'stream';
import trumpet from '@gofunky/trumpet';

const gateway = new FragmentGateway({
  prePiercingStyles: `<style id="fragment-piercing-styles" type="text/css">
    fragment-host[data-piercing="true"] {
      position: absolute;
      z-index: 9999999999999999999999999999999;
    }
  </style>`,
});

// register analog fragment
gateway.registerFragment({
  fragmentId: 'analog',
  prePiercingClassNames: ['analog'],
  routePatterns: ['/analog-page/:_*', 'ecommerce-page/:_*'],
  upstream: 'http://localhost:4200',
  onSsrFetchError: () => {
    return {
      response: new Response(
        `<p id="analog-fragment-not-found">
          <style>#analog-fragment-not-found { color: red; font-size: 2rem; }</style>
          Analog fragment not found
        </p>`,
        { headers: [['content-type', 'text/html']] }
      ),
    };
  },
});

// register qwik fragment
gateway.registerFragment({
  fragmentId: 'qwik',
  prePiercingClassNames: ['qwik'],
  routePatterns: ['/qwik-page/:_*', '/_fragment/qwik/:_*', 'ecommerce-page/:_*'],
  upstream: 'http://localhost:4173',
  onSsrFetchError: () => {
    return {
      response: new Response(
        `<p id="qwik-fragment-not-found">
          <style>#qwik-fragment-not-found { color: red; font-size: 2rem; }</style>
          Qwik fragment not found
        </p>`,
        { headers: [['content-type', 'text/html']] }
      ),
    };
  },
});

export function app(): express.Express {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const browserDistFolder = path.resolve(__dirname, './angular-shell-app/browser');
  const staticAngularIndexHtmlPath = path.resolve(browserDistFolder, 'index.html');

  // Create the Express server
  const server = express();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve Angular static assets
  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    })
  );

  // use the fragment middleware
  server.use(getMiddleware(gateway));

  server.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // Respond with No Content
  });

  // handle all requests
  server.get(/(.*)/, async (req, res, next) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = new URL(req.url, baseUrl); // Ensures URL is absolute

    console.log(`[Middleware] Full URL: ${fullUrl}`);

    const matchedFragment = gateway.matchRequestToFragment(fullUrl.toString());

    if (matchedFragment) {
      console.log(`Matched Fragment: ${matchedFragment.fragmentId}`);
      try {
        const fragmentResponse = await fetchFragment(req, matchedFragment);

        if (req.headers['sec-fetch-dest'] === 'document') {
          const angularIndexHtml = fs
            .readFileSync(staticAngularIndexHtmlPath)
            .toString()
            .split('</body>')[0];
          res.setHeader('Content-Type', 'text/html');
          res.write(angularIndexHtml);

          const stream = Readable.fromWeb(fragmentResponse.body as any);
          stream.pipe(res, { end: false });

          stream.on('end', () => res.end('</body></html>'));
        } else {
          res.writeHead(fragmentResponse.status, Object.fromEntries(fragmentResponse.headers));
          fragmentResponse.body?.pipeTo(Writable.toWeb(res));
        }
      } catch (error) {
        console.error('Error serving fragment:', error);
        let errorResponse = matchedFragment.onSsrFetchError?.(req.url, error);

        if (errorResponse instanceof Promise) {
          errorResponse = await errorResponse;
        }

        res.writeHead(errorResponse?.response.status || 500);
        res.end(errorResponse?.response.body || 'Internal Server Error');
      }
    } else {
      console.log(`No fragment matched. Serving Angular app for: ${fullUrl}`);
      res.sendFile(staticAngularIndexHtmlPath);
    }
  });

  return server;
}

async function fetchFragment(req: express.Request, fragmentConfig: FragmentConfig) {
  const { upstream } = fragmentConfig;


  console.log(`[fetchFragment] Using upstream URL: ${upstream}`);

  const upstreamUrl = new URL(upstream);

  const headers = new Headers(req.headers as any);
  headers.set('sec-fetch-dest', 'empty');
  headers.set('x-fragment-mode', 'embedded');

  const fragmentRequest = new Request(upstreamUrl.toString(), {
    method: req.method,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    headers,
  });

  console.log(`[fetchFragment] Request details: Method=${req.method}, URL=${upstreamUrl.toString()}, Headers=${JSON.stringify(headers)}`);

  try {
    const response = await fetch(fragmentRequest);

    console.log(`[fetchFragment] Response Status: ${response.status}`);
    console.log(`[fetchFragment] Response Headers: ${JSON.stringify([...response.headers.entries()])}`);

    return response;
  } catch (error) {
    console.error(`[fetchFragment] Error fetching fragment: ${error}`);
    throw error;
  }
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
