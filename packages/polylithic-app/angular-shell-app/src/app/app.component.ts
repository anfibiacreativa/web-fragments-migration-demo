import { Component, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

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

  title = 'Angular Migrated App | Web Fragments';
}
