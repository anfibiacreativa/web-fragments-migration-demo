# Debugging instructions

1 - Fork or clone
2 - Switch to branch `chore/add-shell-app`
3 - Install all dependencies with `pnpm i`
4 - Start the Qwik app

```bash
$ cd packages/polylithic-app/qwik-shopping-cart
$ pnpm build && pnpm start
```

5 - Start the Analog.js app

```bash
$ cd packages/polylithic-app/analog-product-catalog
$ pnpm build && pnpm start
```

6 - Build the prod version of the shell app

```bash
$ cd packages/polylithic-app/angular-shell-app
$ pnpm build:prod
```

7 - Build and start the server

```bash
$ cd packages/polylithic-app/shell-prod-server
$ pnpm build && pnpm start:server
```

8 - Go to `http://localhost:4000`

Click in the `Go to Qwik app` or `Go to Analog app`
The apps are rendered but not the Angular shell page due to:

`client:1  Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.`
Probably Vite bundling issue

The apps are rendered but the outlet, host and iframe not in place.

The `ecommerce-page` view only renders the `shopping cart`

Have fun fixing this. :D


