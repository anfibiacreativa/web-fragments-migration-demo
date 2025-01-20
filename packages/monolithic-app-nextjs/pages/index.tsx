import React from 'react';
import Layout from '../components/Layout';
import Banner from '../components/CountDownBanner';
import ProductGrid from '../components/ProductGrid';
import ShoppingCart from '../components/ShoppingCart';
import Head from 'next/head';
import { useCartToggle } from '../utils/cartState';

const Home: React.FC = () => {
  const { isCartOpen, toggleCart } = useCartToggle(); // Toggle the cart sidebar
  return (
    <>
      <Head>
        <title>Next.js Monolithic App</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"></link>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className='container'>
          <div className={isCartOpen ? 'backdrop visible' : 'backdrop'}></div>
          <h1>Ecommerce Monolithic Clientside App</h1>
          <Banner />
          <button className='btn-toggle-cart' onClick={toggleCart}>
            <i className='fa-solid fa-cart-shopping'></i>
          </button>
          <div className='layout'>
            <ProductGrid />
            <ShoppingCart />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Home;
