import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { ProductService } from '../../shared/services/product.service';
import { CountdownBannerComponent } from "../countdown-banner/countdown-banner.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, ShoppingCartComponent, CountdownBannerComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomePageComponent {
  constructor(private productService: ProductService) {}

  isCartOpen = false;

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  products = this.productService.getProducts();

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const viewportWidth = window.innerWidth;

    if (this.isCartOpen && viewportWidth >= 900) {
      this.toggleCart();
    }
  }
}
