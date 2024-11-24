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

}
