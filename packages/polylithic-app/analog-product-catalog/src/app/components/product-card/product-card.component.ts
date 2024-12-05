import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() detailed = false;

  constructor(private cartService: CartService ) {}

  addToCart(): void {
    this.cartService.addToCart(this.product);
  }
}
