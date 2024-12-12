import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShoppingCartService } from '../../shared/services/shopping-cart.service';
import { PaymentService } from '../../shared/services/payment.service';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'],
})
export class ShoppingCartComponent {
  constructor(
    private cartService: ShoppingCartService,
    private paymentService: PaymentService
  ) {}

  items = this.cartService.getItems();
  total = this.cartService.total;
  isError = false;
  messageError = '';
  progress = 0;
  message = '';

  updateQuantity(productId: number, change: number) {
    this.cartService.updateQuantity(productId, change);
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  showErrorNotification(error: string): void {
    this.isError = true;
    this.messageError = error;
  }

  async checkout() {
    const totalAmount = this.total();
    const currency = 'EUR';
    const userId = 'user_123';

    console.log('Attempting payment with total:', totalAmount);

    try {
      const response = await this.paymentService.createPaymentIntent(totalAmount, currency, userId);
      console.log('Payment successful:', response);

      this.cartService.clearCart();

      this.message = 'Payment completed. Processing the order. You will get your swag soon!';
      this.progress = 0;

      let progressComplete = false;

      const interval = setInterval(() => {
        this.progress += 5;
        if (this.progress >= 100) {
          clearInterval(interval);
          progressComplete = true;
          this.message = '';
        }
      }, 1000);

      const waitForProgress = new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (progressComplete) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await waitForProgress;
    } catch (error) {
      if (error instanceof Error) {
        this.showErrorNotification(error.message);
      }
    }
  }
}
