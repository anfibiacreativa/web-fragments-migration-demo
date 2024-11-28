import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { CheckoutComponent } from '../components/checkout/checkout.component';
import { ProductService } from '../shared/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    ProductCardComponent,
    CheckoutComponent
  ],
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.css']
})
export default class HomePageComponent {
  constructor(private productService: ProductService) {}

  products = this.productService.getProducts();
}
