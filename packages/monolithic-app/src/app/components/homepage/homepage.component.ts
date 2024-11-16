import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { ProductService } from '../productpage/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, ShoppingCartComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomePageComponent {
  constructor(private productService: ProductService) {}
  
  products = this.productService.getProducts();
}