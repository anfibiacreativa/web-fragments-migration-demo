import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FragmentComponent } from "./components/fragment-component/fragment.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FragmentComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Angular Migrated App | Web Fragments';
}
