import { Injectable, signal } from '@angular/core';
import { Product } from '../../models/product.model';
import { products } from '../../data/product-catalog-mock';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = signal<Product[]>(
    products
  );

  getProducts() {
    return this.products;
  }

  getProduct(id: number) {
    return this.products().find(p => p.id === id);
  }
}
