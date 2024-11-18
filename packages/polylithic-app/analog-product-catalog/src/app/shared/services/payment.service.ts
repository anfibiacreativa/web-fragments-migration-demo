import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  async createPaymentIntent(amount: number, currency: string, userId: string): Promise<any> {
    try {
      const response = await this.http
        .post(`${this.apiUrl}/create-payment`, {
          amount,
          currency,
          userId,
        })
        .toPromise();
      return response;
    } catch (error) {
      throw new Error(`Payment failed: ${(error as any).message}`);
    }
  }
}
