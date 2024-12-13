import { Injectable } from '@angular/core';
import { Product } from '../../models/product.model';
import { CartItem } from 'src/app/models/cartItem.model';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  cartUpdated = signal(false);

  constructor() {
    this.loadCart();
  }

  addToCart(product: Product): void {
    const bc = new BroadcastChannel("/cart");
    console.log('broadcasting add_to_cart to /cart channel', product);
    bc.postMessage({ type: 'add_to_cart', product });

    // todo: probably remove?
    const productIndex = this.cartItems.findIndex(item => item.product.id === product.id);
    if (productIndex === -1) {
      this.cartItems.push({ product, quantity: 1 });
      console.log('##### product', JSON.stringify(product));
    } else {
      this.cartItems[productIndex].quantity += 1;
    }
    this.saveCart();
    this.cartUpdated.set(true);
  }

  // Get current cart
  getCart(): CartItem[] {
    return this.cartItems;
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalAmount(): number {
    return this.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }

  private saveCart(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('shoppingCart', JSON.stringify(this.cartItems));
    }
  }

  private loadCart(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedCart = localStorage.getItem('shoppingCart');
      if (savedCart) {
        try {
          this.cartItems = JSON.parse(savedCart);
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
          this.cartItems = [];
        }
      }
    } else {
      this.cartItems = [];
    }
  }
}
