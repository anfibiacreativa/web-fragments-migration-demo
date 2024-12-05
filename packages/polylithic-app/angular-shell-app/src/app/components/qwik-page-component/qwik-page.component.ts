import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { FragmentComponent } from "../fragment-component/fragment.component";

@Component({
  selector: 'app-qwik-page',
  standalone: true,
  templateUrl: './qwik-page.component.html',
  styleUrl: './qwik-page.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QwikPageComponent {

  addItem() {
    const product = {
      id: 3,
      name: 'Angular Developer Hoodie',
      description: 'For developers who love Angular!',
      price: 39.99,
      color: 'Red',
      size: 'L',
      imageUrl: 'https://placehold.co/300x400',
      rating: 4.9,
    };
    
    const base64Product = btoa(JSON.stringify(product));
    
    window.postMessage({ type: 'add_to_cart', product: base64Product }, '*');
  }

}
