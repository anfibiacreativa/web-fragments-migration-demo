import { Component, CUSTOM_ELEMENTS_SCHEMA, Renderer2 } from '@angular/core';
// import { AnalogPageComponent } from "../analog-page-component/analog-page.component";
// import { QwikPageComponent } from "../qwik-page-component/qwik-page.component";
// import { FragmentComponent } from "../fragment-component/fragment.component";

@Component({
  selector: 'app-ecommerce-page',
  standalone: true,
  templateUrl: './ecommerce-page.component.html',
  styleUrl: './ecommerce-page.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EcommercePageComponent {

  constructor(
    private renderer: Renderer2
  ) {}

  fragmentSeam = false;

  toggleFragmentBorder() {
    this.fragmentSeam = !this.fragmentSeam;
    if (this.fragmentSeam) {
      this.renderer.addClass(document.body, 'fragment-border');
    } else {
      this.renderer.removeClass(document.body, 'fragment-border');
    }
  }
}
