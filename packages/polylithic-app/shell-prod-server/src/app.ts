import express from 'express';
import fs from 'fs';
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
    //'/qwik-page/?',
    '/ecommerce-page/?',
    '/_fragment/qwik/?',
  ],
  upstream: 'http://localhost:4173',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='qwik-fragment-not-found'>Fragment not found</p><a href="/">Go back</a>`,
      { headers: [['content-type', 'text/html']] },
    ),
  }),
});

// register Fragment - analog
fragmentGateway.registerFragment({
  fragmentId: 'analog',
  prePiercingClassNames: ['analog'],
  routePatterns: [
    //'/analog-page/?',
    //'/ecommerce-page/?',
  ],
  upstream: 'http://localhost:4200',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id='analog-fragment-not-found'>Fragment not found</p><a href="/">Go back</a>`,
      { headers: [['content-type', 'text/html']] },
    ),
  }),
});

export function app(): express.Express {
  const server = express();
  const serverDistFolder = path.dirname(__dirname);
  const browserDistFolder = path.resolve(serverDistFolder, './dist/angular-shell-app/browser');
  const staticAngularIndexHtmlPath = path.resolve(browserDistFolder, 'index.html')

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // serve Angular static entry point
  server.use(express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // handle fragments with streaming
  server.get('**', async (req, res) => {
    const url = req.originalUrl;

    // find all matching fragments for this route
    const registeredFragments = fragmentGateway.getAllFragments();
    const matchingFragments = Array.from(registeredFragments.values()).filter(fragment =>
      fragment.routePatterns.some(pattern => new RegExp(pattern).test(url))
    );

    if (matchingFragments.length > 0) {
      console.log(`### Matched Fragments: ${matchingFragments.map(f => f.fragmentId).join(', ')}`);

      // stream fragments sequentially
      for (const fragment of matchingFragments) {
        const upstreamUrl = fragment.upstream;
        console.log(`### Fetching Fragment: ${fragment.fragmentId}, Upstream: ${upstreamUrl}`);

        console.log("Request sec-fetch-dest: ", req.headers["sec-fetch-dest"]);

        // if fragment request from iframe initialization then return empty response
        if (req.headers["sec-fetch-dest"] === "iframe") {
            res.setHeader("Content-Type", "text/html");
            res.write("<!doctype html><title>");
            res.end();
            return;
        }

        const fetchResponse = await fetch(upstreamUrl, { method: 'GET' });

        if (!fetchResponse.ok || !fetchResponse.body) {
          console.error(`Upstream fetch failed for fragment ${fragment.fragmentId}, response: ${fetchResponse.status}`);
          const errorResponse = fragment.onSsrFetchError();
          const errorHtml = await errorResponse.response.text();
          res.write(errorHtml);
          res.end();
          return;
        }

        const header = fetchResponse.headers.get("Content-Type") || 'missing/headers';
        res.setHeader("Content-Type", header);
        const stream = Readable.fromWeb(fetchResponse.body as any);

        if (req.headers["sec-fetch-dest"] === "document") {
          console.log(`### Serving mixture of legacy app and pierced fragment for: ${req.originalUrl}`);

          const angularIndexPreamble = fs.readFileSync(staticAngularIndexHtmlPath).toString().split('</body>')[0];
          const angularIndexEpilog = '</body></html>';


          res.setHeader("Content-Type", "text/html");
          res.write(angularIndexPreamble);

          console.log(`### Streaming fragment: ${fragment.fragmentId}`);
          await new Promise((resolve) => {
            stream.pipe(res, { end: false });
            stream.on('end', () => {
              console.log('xxxx end of fragment stream');
              res.end(angularIndexEpilog);
              console.log('ended the stream');
              resolve(null);
            });
          });

          res.end();
          return;

        } else {
          await new Promise((resolve) => {
            stream.pipe(res, { end: false }).on('end', () => {
              resolve(null);
              res.end();
            });
          });
        }
      }

      // end the response after all fragments
      return res.end();
    }

    // fallback to Angular response if no fragments match
    console.log(`### Serving Angular app for: ${req.originalUrl}`);
    // TODO: why do we need this and also expres.static higher up??
    res.sendFile(staticAngularIndexHtmlPath);
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



/* import express from 'express';
import path from 'path';
import { ServerFragmentGateway } from './_middleware/middleware';
import { Readable } from 'stream';
import { read } from 'fs';

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
            console.log('### Fragment stream: ', readableStream);

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
 */
