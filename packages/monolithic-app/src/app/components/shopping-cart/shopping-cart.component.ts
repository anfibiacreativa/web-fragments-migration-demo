import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShoppingCartService } from './shopping-cart.service';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css'
})
export class ShoppingCartComponent {
  constructor(private cartService: ShoppingCartService) {}

  items = this.cartService.getItems();
  total = this.cartService.total;

  updateQuantity(productId: number, change: number) {
    this.cartService.updateQuantity(productId, change);
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  checkout() {
    // strip imp
    console.log('Proceeding to checkout with total:', this.total());
  }
}