import React from 'react';
import { useCart, updateQuantity, removeFromCart } from '../utils/cartState';
import { processPayment, PaymentRequest } from '../utils/paymentService';
import styles from '../styles/ShoppingCart.module.css';
import { useCartToggle } from '../utils/cartState';

const ShoppingCart: React.FC = () => {
  const cart = useCart();
  const { isCartOpen, toggleCart } = useCartToggle();

  const handleProceedToPayment = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add items to proceed.');
      return;
    }

    try {
      // fake payment request
      const paymentData: PaymentRequest = {
        amount: cart.reduce((total, item) => total + item.price * item.quantity, 0),
        currency: 'EUR',
        userId: 'someUserId12345'
      };

      // Call the payment service
      const response = await processPayment(paymentData);

      if (response.success) {
        if (response.paymentUrl) {
          // Redirect to the payment URL if provided
          window.location.href = response.paymentUrl;
        } else {
          alert('Payment successful!');
        }
      } else {
        alert(`Payment failed: ${response.message}`);
      }
    } catch (error) {
      console.error('Error during payment:', error);
      alert('An error occurred while processing the payment. Please try again.');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <aside className={isCartOpen ? 'cartSidebar open' : 'cartSidebar'}>
      <button className='btn-toggle-cart close' onClick={toggleCart}>
        <i className='fa-solid fa-circle-xmark'></i>
      </button>
      <div className={styles.cart}>
        <h3>Your Shopping Cart</h3>
        {cart.length === 0 ? (
          <p>Your cart is empty. Add some products to get started!</p>
        ) : (
          <>
            <ul className={styles.cartItems}>
              {cart.map((item) => (
                <li key={item.id} className={styles.cartItem}>
                  <img src={item.image} className={styles.cartImage} alt={item.name} />
                  <div className={styles.itemDetails}>
                    <h4>{item.name}</h4>
                    <p>${item.price}</p>
                  </div>
                  <div className={styles.cartItemsFooter}>
                    <div className={styles.quantityControls}>
                      <button className="btn" onClick={() => updateQuantity(item.id, -1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button className="btn" onClick={() => updateQuantity(item.id, 1)}>
                        +
                      </button>
                    </div>
                    <button className="btn remove-btn" onClick={() => removeFromCart(item.id)}>
                    x
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.cartSummary}>
              <p className={styles.total}>Total: ${total.toFixed(2)}</p>
            </div>
            <button className="btn btn-primary" onClick={handleProceedToPayment}>
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default ShoppingCart;
