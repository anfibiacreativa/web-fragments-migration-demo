import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { ServerFragmentGateway, FragmentConfig } from './server-gateway';

const fragmentGateway = new ServerFragmentGateway();

fragmentGateway.initialize({
  prePiercingStyles: `
    <style id="fragment-piercing-styles" type="text/css">
      fragment-host[data-piercing="true"] {
        position: absolute;
        z-index: 9999999999999999999999999999999;
      }
    </style>
  `,
});

// register fragment qwik
fragmentGateway.registerFragment({
  fragmentId: 'qwik',
  prePiercingClassNames: ['qwik'],
  routePatterns: ["/qwik-page/:_*", "/_fragment/qwik/:_*"],
  upstream: 'http://localhost:5173',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='qwik-fragment-not-found'>Fragment not found</p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

// register fragment analog
fragmentGateway.registerFragment({
  fragmentId: 'analog',
  prePiercingClassNames: ['analog'],
  routePatterns: ['/analog-page/.*'],
  upstream: 'http://localhost:4201',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='analog-fragment-not-found'>Fragment not found</p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // middleware to handle fragments
  server.get('**', (req, res, next) => {
    const url = req.originalUrl;

    // iterate over all registered fragments to find a match
    for (const fragment of fragmentGateway.getAllFragments().values()) {
      console.log(fragment, ' ####fragment ');
      if (fragment.routePatterns.some((pattern) => new RegExp(pattern).test(url))) {
        fetch(fragment.upstream + url)
          .then((fetchResponse) => {
            if (!fetchResponse.ok) throw new Error('Upstream fetch failed');
            return fetchResponse.text();
          })
          .then((html) => res.send(html))
          .catch(() => {
            const errorResponse = fragment.onSsrFetchError();
            errorResponse.response.text().then((html) => res.send(html));
          });

        return;
      }
    }

    // fall back to Angular server-side rendering
    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${req.protocol}://${req.headers.host}${url}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
