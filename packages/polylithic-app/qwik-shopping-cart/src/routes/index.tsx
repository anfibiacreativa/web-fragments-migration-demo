import { component$ } from '@builder.io/qwik';
import { ShoppingCart } from '../components/shopping-cart/shopping-cart';

export default component$(() => {
  return (
    <div>
      <h1>Shopping Cart Web Fragment</h1>
      <ShoppingCart />
    </div>
  );
});
