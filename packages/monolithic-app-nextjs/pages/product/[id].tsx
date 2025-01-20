import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/ProductDetail.module.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity?: number;
}

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { id, name, description, price, image } = router.query;

  const [cart, setCart] = useState<Product[]>([]);

  const handleAddToCart = () => {
    const product: Product = {
      id: Number(id),
      name: name as string,
      description: description as string,
      price: Number(price),
      image: image as string,
    };

    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    alert('Item added to cart!');
  };

  return (
    <div className={styles.productDetail}>
      <div className={styles.container}>
        <img src={image as string} alt={name as string} className={styles.productImage} />
        <div className={styles.details}>
          <h1>{name}</h1>
          <p>{description}</p>
          <p className={styles.price}>${price}</p>
          <button className="btn btn-primary" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
