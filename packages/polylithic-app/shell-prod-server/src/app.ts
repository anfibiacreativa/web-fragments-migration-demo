import express from 'express';
import fs from 'fs';
import path from 'path';
import { getMiddleware } from './_middleware/fragment-express-middleware.js';
import { FragmentGateway } from 'web-fragments/gateway';

// start the gateway
const gateway = new FragmentGateway({
  prePiercingStyles: `<style id="fragment-piercing-styles" type="text/css">
      fragment-host[data-piercing="true"] {
        position: absolute;
        z-index: 9999999999999999999999999999999;

        &.remix {
            bottom: 16%;
            left: 15%;
        }
      }
    </style>`,
});

// register fragment: analog
gateway.registerFragment({
  fragmentId: 'analog',
  prePiercingClassNames: ['analog'],
  routePatterns: ['/analog-page/:_*', '/ecommerce-page/:_*'],
  upstream: 'http://localhost:4200',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id="analog-fragment-not-found">
         <style>#analog-fragment-not-found { color: red; font-size: 2rem; }</style>
         Analog fragment not found
       </p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

// register fragment: qwik
gateway.registerFragment({
  fragmentId: 'qwik',
  prePiercingClassNames: ['qwik'],
  routePatterns: ['/qwik-page/:_*', '/_fragment/qwik/:_*', '/ecommerce-page/:_*'],
  upstream: 'http://localhost:4173',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id="qwik-fragment-not-found">
         <style>#qwik-fragment-not-found { color: red; font-size: 2rem; }</style>
         Qwik fragment not found
       </p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

export function app(): express.Express {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const browserDistFolder = path.resolve(__dirname, './angular-shell-app/browser');
  const staticAngularIndexHtmlPath = path.resolve(browserDistFolder, 'index.html');

  const server = express();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // serve static files
  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    })
  );

  // add the fragment middleware
  server.use(getMiddleware(gateway));

  // serve Angular app for unmatched routes
  server.get(/(.*)/, (req, res) => {
    res.sendFile(staticAngularIndexHtmlPath);
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
