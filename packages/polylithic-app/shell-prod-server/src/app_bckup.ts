/* I'm not really sure at this point whether the fragment url intercepted should entirely
replace the server response. That's what it looks like from the piercing react sample.
However, consider the document is broken and missing the <head>, which also occurs for
the piercing react example.

In this server version, the fragment is fetched and streamed but not replacing the response.
 */

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
    '/ecommerce-page/?',
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
    '/analog-page/?',
    '/ecommerce-page/?',
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

  // serve Angular static entry point
  server.use(express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // handle fragments asynchronously
  server.use(async (req, res, next) => {
    const url = req.originalUrl;

    // iterate over registered fragments
    const registeredFragments = fragmentGateway.getAllFragments();
    for (const fragment of registeredFragments.values()) {
      console.log(`# FRAGMENT-${fragment.fragmentId}: `, fragment);

      // Match URL with routePatterns
      for (const pattern of fragment.routePatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(url)) {
          console.log(`### Matching Fragment Found: ${fragment.fragmentId}`);

          // fetch from upstream, but do not affect the Angular fallback
          const upstreamUrl = fragment.upstream + url;
          const fetchOptions = { method: 'GET' };

          fetch(upstreamUrl, fetchOptions)
            .then((fetchResponse) => {
              if (!fetchResponse.ok) {
                throw new Error('Upstream fetch failed');
              }

              const readableStream = fetchResponse.body as ReadableStream<Uint8Array>;
              console.log(`### Upstream Response Stream for ${fragment.fragmentId}: `, readableStream);

              // get the fragment chunks
              if (readableStream) {
                const stream = Readable.fromWeb(readableStream as any);
                const dataChunks: Buffer[] = [];
                stream.on('data', (chunk) => dataChunks.push(chunk));
                stream.on('end', () => {
                  const fragmentData = Buffer.concat(dataChunks).toString('utf8');
                  console.log(`### Fragment Content (${fragment.fragmentId}):\n`, fragmentData);
                });
              }
            })
            .catch((error) => {
              console.error(`### Error fetching fragment (${fragment.fragmentId}):`, error);
            });

          break;
        }
      }
    }

    next();
  });

  // serve Angular fallback
  server.get('**', (req, res) => {
    console.log(`### Serving Angular app for: ${req.originalUrl}`);
    res.sendFile(path.resolve(browserDistFolder, 'index.html'));
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
