import React from 'react';
import { useCart, updateQuantity, removeFromCart } from '../utils/cartState';
import styles from '../styles/ShoppingCart.module.css';

const ShoppingCart: React.FC = () => {
  const cart = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={styles.cartSidebar}>
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
                    <h3>{item.name}</h3>
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
            <button className="btn btn-primary">Proceed to Checkout</button>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
