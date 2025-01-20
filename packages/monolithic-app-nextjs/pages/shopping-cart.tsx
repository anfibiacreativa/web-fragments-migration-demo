import React from 'react';
import Layout from '../components/Layout';
import ShoppingCart from '../components/ShoppingCart';

const ShoppingCartPage: React.FC = () => {
  return (
    <Layout>
      <aside className='cartSidebar'>
        <ShoppingCart />
      </aside>
    </Layout>
  );
};

export default ShoppingCartPage;
