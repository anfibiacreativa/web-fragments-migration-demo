import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage-component/homepage.component';
import { QwikPageComponent } from './components/qwik-page-component/qwik-page.component';
import { AnalogPageComponent } from './components/analog-page-component/analog-page.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'qwik-page', component: QwikPageComponent },
  { path: 'analog-page', component: AnalogPageComponent }
];
