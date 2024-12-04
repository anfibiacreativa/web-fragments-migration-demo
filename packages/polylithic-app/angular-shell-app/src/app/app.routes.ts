import { Routes, UrlMatchResult } from '@angular/router';
import { HomepageComponent } from './components/homepage-component/homepage.component';
import { QwikPageComponent } from './components/qwik-page-component/qwik-page.component';
import { AnalogPageComponent } from './components/analog-page-component/analog-page.component';
import { EcommercePageComponent } from './components/ecommerce-component/ecommerce-page.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'qwik-page', component: QwikPageComponent },
  { matcher: (segments) => {
    return segments[0].path === 'store' ? {consumed: segments} : null;
  }, component: AnalogPageComponent },
  { path: 'ecommerce-page', component: EcommercePageComponent }
];
