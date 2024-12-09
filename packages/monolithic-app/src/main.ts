import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('waiting 2 seconds to simulate a slow CSR app');
wait(2000).then(() => {
  console.log('done waiting, bootstraping the app shell');
  bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
});
