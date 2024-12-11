import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Product } from '../../models/product.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ShoppingCartService } from '../../shared/services/shopping-cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, NgOptimizedImage],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() detailed = false;
  extension = '.png';

  constructor(
    private cartService: ShoppingCartService
  ) {}

  addToCart(event: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.cartService.addToCart(this.product);
  }
}
