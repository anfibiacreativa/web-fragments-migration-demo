import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent {

  @Input() product!: Product;

  constructor(private cartService: CartService ) {}

  addToCart(): void {
    this.cartService.addToCart(this.product);
  }
}
