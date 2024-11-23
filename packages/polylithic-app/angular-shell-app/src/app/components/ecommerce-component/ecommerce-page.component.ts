import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AnalogPageComponent } from "../analog-page-component/analog-page.component";
import { QwikPageComponent } from "../qwik-page-component/qwik-page.component";
// import { FragmentComponent } from "../fragment-component/fragment.component";

@Component({
  selector: 'app-ecommerce-page',
  standalone: true,
  templateUrl: './ecommerce-page.component.html',
  styleUrl: './ecommerce-page.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [AnalogPageComponent, QwikPageComponent],
})
export class EcommercePageComponent {

}
