import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { FragmentComponent } from "../fragment-component/fragment.component";

@Component({
  selector: 'app-homepage',
  standalone: true,
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomepageComponent {

}
