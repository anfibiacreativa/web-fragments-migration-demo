import { Component } from '@angular/core';
import { FragmentComponent } from "../fragment-component/fragment.component";

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FragmentComponent],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {

}
