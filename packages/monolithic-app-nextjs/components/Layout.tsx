import React, { ReactNode } from 'react';
import Header from './Header';
import styles from '../styles/Layout.module.css';

type LayoutProps = {
  children: ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
      <div className={styles.mainWrapper}>
        {children}
      </div>
    </main>
    <footer className='footer'>
      <p><a href="">©2025 | Web Fragments Enterprise Demo</a></p>
    </footer>
    </div>
  );
};

export default Layout;
