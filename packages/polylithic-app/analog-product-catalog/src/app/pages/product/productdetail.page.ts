import { Component, inject } from '@angular/core';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  standalone: true,
  imports: [AsyncPipe, JsonPipe],
  template: `
    <h2>Product Detail</h2>

    ID: {{ id$ | async }}
  `,
})
export default class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly id$ = this.route.paramMap.pipe(
    map((params) => params.get('id'))
  );
}
