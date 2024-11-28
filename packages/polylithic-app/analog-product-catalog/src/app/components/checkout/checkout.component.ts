import { Component, OnInit } from '@angular/core';
import { CartService } from '../../shared/services/cart.service';
import { PaymentService } from '../../shared/services/payment.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: true
})
export class CheckoutComponent implements OnInit {
  itemCount = signal(0);
  zoomAnimation = signal(false);
  totalAmount = signal(0);

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.updateCartInfo();
  }

  updateCartInfo() {
    this.itemCount.set(this.cartService.getTotalItems());
    this.totalAmount.set(this.cartService.getTotalAmount());
  }

  triggerZoomAnimation() {
    this.zoomAnimation.set(true);
    setTimeout(() => this.zoomAnimation.set(false), 1000);  // Reset animation after 1 second
  }

  handleCheckout(): void {
    // this is a mock, hence the hardcoded fake id
    const total = this.totalAmount();
    const currency = 'EUR';
    const fakeUserId = 'user_fake_id';
    this.paymentService.createPaymentIntent(total, currency, fakeUserId);
    console.log(`[Payment Service]: Payment intent made for user ${fakeUserId}, of ${currency} ${total}`);
  }
}
