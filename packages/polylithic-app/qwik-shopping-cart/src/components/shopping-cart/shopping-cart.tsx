import { component$, useStore, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { initialProducts } from '../../data/data';
import './shopping-cart.css';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  color: string;
  size: string;
  imageUrl: string;
  rating: number;
}

export const ShoppingCart = component$(() => {
  const cart = useStore<{ items: CartItem[]; message: string }>({ items: [], message: '' });

  const saveCartToLocalStorage = $(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart.items));
  });

  const clearCart = $(() => {
    cart.items = [];
    saveCartToLocalStorage();

    const bc = new BroadcastChannel('/cart');
    bc.postMessage({ type: 'cart_cleared' });
    bc.close();
  });

  // load cart from localStorage or fallback to initial products
  useVisibleTask$(() => {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        cart.items = parsedCart;
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        cart.items = [...initialProducts];
        saveCartToLocalStorage();
      }
    } else {
      cart.items = [...initialProducts];
      saveCartToLocalStorage();
    }
  });

  const progress = useSignal(0);

  // proceed to checkout
  const checkout = $(async () => {
    const userId = 'fake_user_id';
    const currency = 'EUR';
    const totalAmount = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    try {
      const response = await fetch('http://localhost:3000/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Payment intent created:', data);


      cart.message = 'Payment complete. You will get your order soon!';
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 5;
        progress.value = currentProgress;

        if (currentProgress >= 100) {
          clearInterval(interval);
          clearCart();
        }
      }, 1000);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  });

  // remove all instances of a product
  const removeItems = $((id: number) => {
    cart.items = cart.items.filter((item) => item.product.id !== id);
    saveCartToLocalStorage();
  });

  // remove one instance of a product
  const removeItem = $((id: number) => {
    const itemIndex = cart.items.findIndex((item) => item.product.id === id);
    if (itemIndex !== -1) {
      const item = cart.items[itemIndex];
      if (item.quantity > 1) {
        cart.items[itemIndex] = { ...item, quantity: item.quantity - 1 };
      } else {
        cart.items = cart.items.filter((item) => item.product.id !== id);
      }
    }
    saveCartToLocalStorage();
  });

  // add one more instance of a product
  const addItem = $((id: number) => {
    const itemIndex = cart.items.findIndex((item) => item.product.id === id);
    if (itemIndex !== -1) {
      const item = cart.items[itemIndex];
      cart.items[itemIndex] = { ...item, quantity: item.quantity + 1 };
    }
    saveCartToLocalStorage();
  });

  // update product quantity
  const updateQuantity = $((id: number, quantity: number) => {
    const itemIndex = cart.items.findIndex((item) => item.product.id === id);
    if (itemIndex !== -1) {
      if (quantity > 0) {
        cart.items[itemIndex] = { ...cart.items[itemIndex], quantity };
      } else {
        cart.items = cart.items.filter((item) => item.product.id !== id);
      }
    }
    saveCartToLocalStorage();
  });

  const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      <div class="cart">
        <h2>Shopping Cart</h2>

        {cart.message ? (
           <>
           <p class="success-message">{cart.message}</p>
           <div class="progress-bar">
             <div class="progress" style={{ width: `${progress.value}%` }}></div>
           </div>
         </>
        ) : cart.items.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            <ul class="cart-items">
              {cart.items.map((item) => (
                <li key={item.product.id} class="cart-item">
                  <img src={item.product.imageUrl} alt={item.product.name} width="80" height="80" />
                  <div class="item-details">
                    <h3>{item.product.name}</h3>
                    <p>${item.product.price.toFixed(2)}</p>
                  </div>
                  <div class="cart-items-footer">
                    <div class="quantity-controls">
                      <button class="btn" onClick$={() => removeItem(item.product.id)}>-</button>
                      <input
                        class="quantity-input"
                        type="number"
                        value={item.quantity}
                        min="1"
                        onInput$={(e) =>
                          updateQuantity(item.product.id, parseInt((e.target as HTMLInputElement).value, 10))
                        }
                      />
                      <button class="btn" onClick$={() => addItem(item.product.id)}>+</button>
                    </div>
                  </div>
                  <button class="btn remove-btn" onClick$={() => removeItems(item.product.id)}>
                    x
                  </button>
                </li>
              ))}
            </ul>
            <div class="cart-summary">
              <p class="total">Total: ${total.toFixed(2)}</p>
            </div>
            <button class="btn btn-primary" onClick$={checkout}>
              Proceed to checkout
            </button>
          </>
        )}
      </div>
    </>
  );
});
