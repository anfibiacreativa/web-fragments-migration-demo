import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  import('web-fragments/elements').then(({ register }) => {
    register();
  }).catch((error) => {
    console.error('Error registering custom elements for web-fragments outlet and host:', error);
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
