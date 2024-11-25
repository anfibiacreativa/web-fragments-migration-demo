import express from 'express';
import fs from 'fs';
import path from 'path';
import { getMiddleware } from './_middleware/fragment-express-middleware.js';
import { FragmentGateway, FragmentConfig } from 'web-fragments/gateway';
import { Readable, Writable } from 'stream';

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
  routePatterns: ['/analog-page/:_?'],
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
  routePatterns: ['/qwik-page/:_*', '/_fragment/qwik/:_*'],
  upstream: 'http://localhost:4173',
  forwardFragmentHeaders: ['x-fragment-name'],
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
  const browserDistFolder = path.resolve(__dirname, './dist/angular-shell-app/browser');
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

  // get the gateway from the express-server-middleware
  server.use(getMiddleware(gateway));

  // handle all requests
  server.get('**', async (req, res, next) => {
    const url = req.originalUrl;

    // match the request to a fragment using `matchRequestToFragment`, instead of the previous
    // class imported locally
    const matchedFragment = gateway.matchRequestToFragment(req.url);

    if (matchedFragment) {
      console.log(`Matched Fragment: ${matchedFragment.fragmentId}`);
      try {
        const fragmentResponse = await fetchFragment(req, matchedFragment);

        // stream the fragment response if it matches the current route
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
      console.log(`No fragment matched. Serving Angular app for: ${url}`);
      res.sendFile(staticAngularIndexHtmlPath);
    }
  });

  return server;
}

async function fetchFragment(req: express.Request, fragmentConfig: FragmentConfig) {
  const { upstream } = fragmentConfig;
  const upstreamUrl = new URL(req.url, upstream);
  const headers = new Headers(req.headers as any);
  headers.set('sec-fetch-dest', 'empty');
  headers.set('x-fragment-mode', 'embedded');

  const fragmentRequest = new Request(upstreamUrl.toString(), {
    method: req.method,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    headers,
  });

  return fetch(fragmentRequest);
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
