import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, of } from 'rxjs';
import { ProductDetailComponent } from "../../components/product-detail/product-detail.component";
import { ProductService } from '../../shared/services/product.service';

@Component({
  standalone: true,
  imports: [CommonModule, ProductDetailComponent], // Include CommonModule
  template: `
    <ng-container *ngIf="product$ | async as product; else loading">
      <app-product-detail [product]="product"></app-product-detail>
    </ng-container>
    <ng-template #loading>
      <p>Loading product details...</p>
    </ng-template>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 2rem;
      padding: 2rem 0;
    }
    .cart-sidebar {
      position: sticky;
      top: 2rem;
    }
    a {
      text-decoration: none;
      color: inherit;
    }
  `
})
export default class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  // Observable for the product details
  readonly product$ = this.route.paramMap.pipe(
    map((params) => params.get('id')), // Extract the 'id' parameter from the route
    switchMap((id) => {
      if (!id) return of(null); // Handle case where 'id' is null
      const product = this.productService.getProduct(Number(id)); // Use ProductService to fetch product by ID
      return of(product); // Emit the product as an Observable
    })
  );
}
