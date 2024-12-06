import { Component, NgZone, OnInit } from '@angular/core';
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
    ngZone: NgZone
  ) {
      ngZone.runOutsideAngular(() => {
        // register web fragment custom elements (fragment-outlet and fragment-host)
        import('web-fragments/elements').then(({ register }) => {
          register();
        }).catch((error) => {
          console.error('Error registering custom elements for web-fragments outlet and host:', error);
        });
      });
  }
  title = 'Angular Migrated App | Web Fragments';

}
