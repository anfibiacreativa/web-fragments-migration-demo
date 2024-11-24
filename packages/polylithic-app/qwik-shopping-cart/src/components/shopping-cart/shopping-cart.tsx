import { component$, useStore, $ } from '@builder.io/qwik';
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
  const cart = useStore<{ items: CartItem[] }>({
    // TODO: consume from state coming from catalog in another fragment
    items: [
      {
        product: {
          id: 1,
          name: 'Angular Developer Tee',
          description: 'Perfect for Angular developers who love type-safety!',
          price: 29.99,
          color: 'Red',
          size: 'M',
          imageUrl: 'https://placehold.co/300x400',
          rating: 4.5,
        },
        quantity: 1,
      },
      {
        product: {
          id: 2,
          name: 'TypeScript Enthusiast Shirt',
          description: 'Show your love for interfaces and decorators!',
          price: 24.99,
          color: 'Blue',
          size: 'L',
          imageUrl: 'https://placehold.co/300x400',
          rating: 4.8,
        },
        quantity: 2,
      },
    ],
  });

  const isError = useStore({ value: false });
  const messageError = useStore({ value: '' });

  const removeItems = $((id: number) => {
    cart.items = cart.items.filter((item) => item.product.id !== id);
  });

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
  });

  const addItem = $((id: number) => {
    const itemIndex = cart.items.findIndex((item) => item.product.id === id);
    if (itemIndex !== -1) {
      const item = cart.items[itemIndex];
      cart.items[itemIndex] = { ...item, quantity: item.quantity + 1 };
    }
  });

  // Updates the quantity of the product to a specific value
  const updateQuantity = $((id: number, quantity: number) => {
    const itemIndex = cart.items.findIndex((item) => item.product.id === id);
    if (itemIndex !== -1) {
      if (quantity > 0) {
        cart.items[itemIndex] = { ...cart.items[itemIndex], quantity };
      } else {
        cart.items = cart.items.filter((item) => item.product.id !== id);
      }
    }
  });

  const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      <div class="cart">
        <h2>Shopping Cart</h2>

        {/* check if cart is empty */}
        {cart.items.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            <ul class="cart-items">
              {cart.items.map((item) => (
                <li key={item.product.id} class="cart-item">
                  <img src={item.product.imageUrl} alt={item.product.name} width="80" height="80"/>
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
                        onInput$={(e) => updateQuantity(item.product.id, parseInt((e.target as HTMLInputElement).value, 10))}
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

        {/* error conditional */}
        {isError.value && (
          <div class="errorMessage">
            <span>{messageError.value}</span>
          </div>
        )}
      </div>
    </>
  );
});
