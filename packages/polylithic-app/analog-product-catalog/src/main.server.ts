import 'zone.js/node';
import '@angular/platform-server/init';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { provideServerContext } from '@analogjs/router/server';
import { ServerContext } from '@analogjs/router/tokens';

import App from './app/app-root.ag';
import { config } from './app/app.config.server';

if (import.meta.env.PROD) {
  enableProdMode();
}

export function bootstrap() {
  return bootstrapApplication(App, config);
}

export default async function render(
  url: string,
  document: string,
  serverContext: ServerContext
) {
  const html = await renderApplication(bootstrap, {
    document,
    url,
    platformProviders: [provideServerContext(serverContext)],
  });

  // TODO: move to express middleware
  return html.replace(/\<html lang="en"\>/, '<wf-html>').replace(/\<\/html>/, '</wf-html>').
              replace(/\<head\>/, '<wf-head>').replace(/\<\/head\>/, '</wf-head>').
              replace(/\<body\>/, '<wf-body>').replace(/\<\/body\>/, '</wf-body>');
}
