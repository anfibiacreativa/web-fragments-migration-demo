import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { ServerFragmentGateway } from './server-gateway';

ServerFragmentGateway.initialize({
  prePiercingStyles: `
    <style id="fragment-piercing-styles" type="text/css">
      fragment-host[data-piercing="true"] {
        position: absolute;
        z-index: 9999999999999999999999999999999;
      }
    </style>
  `,
});

ServerFragmentGateway.registerFragment({
  fragmentId: 'qwik',
  prePiercingClassNames: ['qwik'],
  routePatterns: ['/qwik-page/*'],
  upstream: 'http://localhost:5173',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='qwik-fragment-not-found'>Fragment not found</p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

ServerFragmentGateway.registerFragment({
  fragmentId: 'analog',
  prePiercingClassNames: ['analog'],
  routePatterns: ['/analog-page/*'],
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

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
