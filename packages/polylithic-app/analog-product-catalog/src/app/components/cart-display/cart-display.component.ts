import { Component, OnInit } from '@angular/core';
import { CartService } from '../../shared/services/cart.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-cart-display',
  templateUrl: './cart-display.component.html',
  styleUrls: ['./cart-display.component.css'],
  standalone: true
})
export class CartDisplayComponent implements OnInit {
  itemCount = signal(0);
  zoomAnimation = signal(false);
  totalAmount = signal(0);

  constructor(
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.updateCartInfo();
  }

  updateCartInfo() {
    this.triggerZoomAnimation();
    this.itemCount.set(this.cartService.getTotalItems());
    this.totalAmount.set(this.cartService.getTotalAmount());
  }

  triggerZoomAnimation() {
    this.zoomAnimation.set(true);
    setTimeout(() => this.zoomAnimation.set(false), 1000);
  }
}
