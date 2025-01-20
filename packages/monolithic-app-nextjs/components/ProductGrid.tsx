import React from 'react';
import { addToCart } from '../utils/cartState';
import { products } from '../data/product-catalog-mock';
import styles from '../styles/ProductGrid.module.css';

const ProductGrid: React.FC = () => {
  return (
    <div className={styles.products}>
      <div className={styles.grid}>
        {products.map((product) => (
          <div key={product.id} className={`${styles.card} ${styles.productCard}`}>
            <img
              src={`/images/product${product.id}.png`}
              alt={product.name}
              className={styles.productImage}
            />
            <div className={styles.productInfo}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className={styles.price}>${product.price}</p>
              <button
                className="btn btn-primary"
                onClick={() =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: `/images/product${product.id}.png`,
                    quantity: 1,
                  })
                }
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
