import express from 'express';
import path from 'path';
import { ServerFragmentGateway } from './_middleware/middleware';

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

// register Fragment - qwik
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

// register Fragment - analog
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
  const serverDistFolder = path.dirname(__dirname);
  const browserDistFolder = path.resolve(serverDistFolder, './dist/angular-shell-app/browser');

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // serve angular static entry point
  server.use(express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // handle fragments
  server.get('**', (req, res, next) => {
    const url = req.originalUrl;

    // interate over registered fragments
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

    // fallback to static angular response
    res.sendFile(path.resolve(browserDistFolder, 'index.html'));
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
