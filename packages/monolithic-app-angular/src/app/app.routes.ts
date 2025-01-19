import { Routes } from '@angular/router';
import { HomePageComponent } from './components/homepage/homepage.component';
import { ProductPageComponent } from './components/productpage/productpage.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'product/:id', component: ProductPageComponent },
];