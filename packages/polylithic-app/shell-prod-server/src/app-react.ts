import express from 'express';
import path from 'path';
import { FragmentGateway } from 'web-fragments/gateway';
import { getNodeMiddleware } from 'web-fragments/gateway/node';

const PORT = process.env.PORT || 3008;

// start the gateway
const gateway = new FragmentGateway({
  prePiercingStyles: `<style id="fragment-piercing-styles" type="text/css">
      fragment-host[data-piercing="true"] {
        z-index: 1;

        &.store {
          width: calc(100% - 40px);
          position: relative;
          top: 253px;
          left: 0;
          z-index: 0;

          @media (min-width: 900px) and (max-width: 1023px) {
            width: 497px;
            left: -185px;
          }

          @media (min-width: 1024px) {
            width: 535px;
            left: -182px;
          }
        }
      }
    </style>`,
});

// register fragment: analog
// gateway.registerFragment({
//   fragmentId: 'store',
//   prePiercingClassNames: ['store'],
//   routePatterns: ['/store/:_*','/_fragment/analog/:_*'],
//   endpoint: 'http://localhost:4174',
//   onSsrFetchError: () => ({
//     response: new Response(
//       `<p id="store-fragment-not-found">
//          <style>#store-fragment-not-found { color: red; font-size: 2rem; }</style>
//          Store fragment could not be loaded
//        </p>`,
//       { headers: [['content-type', 'text/html']] }
//     ),
//   }),
// });

// register fragment: nuxt
gateway.registerFragment({
  fragmentId: 'store',
  prePiercingClassNames: ['store'],
  routePatterns: ['/store/:_*','/_fragment/nuxt/:_*'],
  endpoint: 'http://localhost:4175',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id="store-fragment-not-found">
         <style>#store-fragment-not-found { color: red; font-size: 2rem; }</style>
         Store fragment could not be loaded
       </p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

// register fragment: qwik
gateway.registerFragment({
  fragmentId: 'cart',
  prePiercingClassNames: ['cart'],
  routePatterns: ['/cart/:_*', '/_fragment/qwik/:_*'],
  endpoint: 'http://localhost:4173',
  onSsrFetchError: () => ({
    response: new Response(
      `<p id="cart-fragment-not-found">
         <style>#cart-fragment-not-found { color: red; font-size: 2rem; }</style>
         Cart fragment could not be loaded
       </p>`,
      { headers: [['content-type', 'text/html']] }
    ),
  }),
});

export function app(): express.Express {
  const app = express();

  app.use(getNodeMiddleware(gateway, { mode: 'development' }));

  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const reactAppDistFolder = path.resolve(__dirname, './react-shell-app');
  const staticReactIndexHtmlPath = path.resolve(reactAppDistFolder, 'index.html');

  app.set('view engine', 'html');
  app.set('views', reactAppDistFolder);

  // serve static files
  app.use(
    express.static(reactAppDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    })
  );
  console.log('Serving static files from:', staticReactIndexHtmlPath);

   // serve Angular app for unmatched routes
  app.get(/(.*)/, (req, res) => {
    res.sendFile(staticReactIndexHtmlPath);
  });

  return app;
}

function run(): void {
  app().listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

run();
