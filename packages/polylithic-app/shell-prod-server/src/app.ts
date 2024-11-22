import express from 'express';
import path from 'path';
import { ServerFragmentGateway } from './_middleware/middleware';
import { Readable } from 'stream';

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
  routePatterns: [
    '/qwik-page/?',
    '/_fragment/qwik/?'
  ],
  upstream: 'http://localhost:5173',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='qwik-fragment-not-found'>Fragment not found</p><a href="/">Go back</a>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

// register Fragment - analog
fragmentGateway.registerFragment({
  fragmentId: 'analog',
  prePiercingClassNames: ['analog'],
  routePatterns: [
    '/analog-page/?'
  ],
  upstream: 'http://localhost:4200',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='analog-fragment-not-found'>Fragment not found</p><a href="/">Go back</a>`,
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

  // handle fragments with streaming
  server.get('**', (req, res, next) => {
    const url = req.originalUrl;

    // iterate over registered fragments
    const registeredFragments = fragmentGateway.getAllFragments();
    for (const fragment of registeredFragments.values()) {
      console.log(`# FRAGMENT-${fragment.fragmentId}: `, fragment);

      let matched = false;
      // check the routePatterns
      for (const pattern of fragment.routePatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(url)) {
          matched = true;
          break;
        }
      }

      if (matched) {
        // fetch from upstream and stream the response to the client
        const upstreamUrl = fragment.upstream;
        console.log('### upstream', upstreamUrl);
        const fetchOptions = { method: 'GET' };

        fetch(upstreamUrl, fetchOptions)
          .then((fetchResponse) => {
            if (!fetchResponse.ok) {
              throw new Error('Upstream fetch failed');
            }

            const readableStream = fetchResponse.body as ReadableStream<Uint8Array>;

            if (readableStream) {
              const stream = Readable.fromWeb(readableStream as any);
              stream.pipe(res);
            }
          })
          .catch(() => {
            const errorResponse = fragment.onSsrFetchError();
            errorResponse.response.text().then((html) => {
              res.write(html);
              res.end();
            });
          });

        return;
      }
    }

    // fallback to static Angular response
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
