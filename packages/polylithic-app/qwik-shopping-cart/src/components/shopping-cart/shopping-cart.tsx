import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { initialProducts } from '../../data/data'; // Assuming initial products are defined here
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
  const cart = useStore<{ items: CartItem[] }>({ items: [] });

  // Save cart to localStorage
  const saveCartToLocalStorage = $(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart.items));
  });

  // Load cart from localStorage or fallback to initial products
  useVisibleTask$(() => {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        cart.items = parsedCart;
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        cart.items = [...initialProducts];  // Fallback to initial products
        saveCartToLocalStorage();  // Save fallback products to localStorage
      }
    } else {
      cart.items = [...initialProducts];  // Fallback to initial products if nothing in localStorage
      saveCartToLocalStorage();  // Save initial products to localStorage
    }
  });

  // Handle add to cart via postMessage
  useVisibleTask$(() => {
    console.log('registering BC /cart from qwik');
    const handleMessage = (event: MessageEvent) => {
      console.log('received add_to_cart message in /cart channel', event);
      if (event.origin !== window.origin) return;

      if (event.data && event.data.type === 'add_to_cart') {

          const product: Product = event.data.product;

          const existingItemIndex = cart.items.findIndex((item) => item.product.id === product.id);
          if (existingItemIndex !== -1) {
            cart.items[existingItemIndex].quantity += 1;
          } else {
            cart.items.push({ product, quantity: 1 });
          }

          saveCartToLocalStorage();
      }
    };

    const bc = new BroadcastChannel("/cart");
    bc.addEventListener('message', handleMessage);
    
    //window.addEventListener('message', handleMessage);

    return () => {
      //window.removeEventListener('message', handleMessage);
      bc.removeEventListener('message', handleMessage);
    };
  });

  // Remove all instances of a product
  const removeItems = $((id: number) => {
    cart.items = cart.items.filter((item) => item.product.id !== id);
    saveCartToLocalStorage();
  });

  // Remove one instance of a product
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

  // Add one more instance of a product
  const addItem = $((id: number) => {
    const itemIndex = cart.items.findIndex((item) => item.product.id === id);
    if (itemIndex !== -1) {
      const item = cart.items[itemIndex];
      cart.items[itemIndex] = { ...item, quantity: item.quantity + 1 };
    }
    saveCartToLocalStorage();
  });

  // Update product quantity
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

        {cart.items.length === 0 ? (
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
          </>
        )}
      </div>
    </>
  );
});
