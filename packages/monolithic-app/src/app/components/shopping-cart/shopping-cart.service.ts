import { Injectable, signal } from '@angular/core';
import { computed } from '@angular/core';
import { Product } from '../../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  private cartItems = signal<CartItem[]>([]);

  total = computed(() => {
    return this.cartItems().reduce((sum, item) => 
      sum + item.product.price * item.quantity, 0
    );
  });

  getItems() {
    return this.cartItems;
  }

  addToCart(product: Product) {
    const items = this.cartItems();
    const existingItem = items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      this.cartItems.update(items => 
        items.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      this.cartItems.update(items => [...items, { product, quantity: 1 }]);
    }
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => 
      items.filter(item => item.product.id !== productId)
    );
  }

  updateQuantity(productId: number, change: number) {
    this.cartItems.update(items => 
      items.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 
            ? null 
            : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item): item is CartItem => item !== null)
    );
  }

  clearCart() {
    this.cartItems.set([]);
  }
}