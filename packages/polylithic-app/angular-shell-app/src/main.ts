import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// register web fragment custom elements (fragment-outlet and fragment-host)
import('web-fragments/elements').then(({ register }) => {
  register();
}).catch((error) => {
  console.error('Error registering custom elements for web-fragments outlet and host:', error);
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
