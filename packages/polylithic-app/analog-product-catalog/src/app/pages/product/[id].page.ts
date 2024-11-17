import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, of } from 'rxjs';
import { ProductDetailComponent } from "../../components/product-detail/product-detail.component";
import { ProductService } from '../../shared/services/product.service';

@Component({
  standalone: true,
  imports: [CommonModule, ProductDetailComponent],
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

  readonly product$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    switchMap((id) => {
      if (!id) return of(null);
      const product = this.productService.getProduct(Number(id));
      return of(product);
    })
  );
}
