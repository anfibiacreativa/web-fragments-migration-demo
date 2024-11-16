import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main>
      <router-outlet/>
    </main>
  `,
  styles: [`
    main {
      min-height: 100vh;
      padding: 1rem;
    }
  `]
})
export class AppComponent {}