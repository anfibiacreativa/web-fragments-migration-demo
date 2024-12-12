import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';

@Component({
  selector: 'app-ecommerce-page',
  standalone: true,
  templateUrl: './ecommerce-page.component.html',
  styleUrl: './ecommerce-page.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EcommercePageComponent {
  isCartOpen = false;

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const viewportWidth = window.innerWidth;

    if (this.isCartOpen && viewportWidth >= 900) {
      this.toggleCart();
    }
  }
}
