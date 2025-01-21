import { sharedPost } from '../lib/api'; // Import your sharedPost function

// Define the API endpoint
const PAYMENT_API_URL = 'http://localhost:3000/create-payment'; // Replace with your actual backend endpoint

// Define the request structure for the payment API
export interface PaymentRequest {
  amount: number;
  currency: string;
  userId: string;
}

export const processPayment = async (paymentData: PaymentRequest): Promise<any> => {
  try {
    const response: PaymentResponse = await sharedPost(PAYMENT_API_URL, paymentData);
    return response;
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw new Error(`Failed to process the payment due to ${error}. Please try again.`);
  }
};
