import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductDetailComponent } from '../product-detail/product-detail.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { ProductService } from './product.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductDetailComponent, ShoppingCartComponent],
  templateUrl: './productpage.component.html', 
  styleUrl: './productpage.component.css'
})
export class ProductPageComponent {
  product: any;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {
    const id = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    this.product = this.productService.getProduct(id);
  }
}