import { Component, Signal, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-banner.component.html',
  styleUrl: './countdown-banner.component.css'
})
export class CountdownBannerComponent {
  private saleStartTime = new Date();
  private now = signal(new Date());

  constructor() {
    this.saleStartTime.setHours(this.saleStartTime.getHours() + 3);

    setInterval(() => this.now.set(new Date()), 1000);
  }

  isVisible: Signal<boolean> = computed(() => {
    const timeDifference = this.saleStartTime.getTime() - this.now().getTime();
    return timeDifference > 0 && timeDifference <= 3 * 60 * 60 * 1000;
  });

  countdown: Signal<string> = computed(() => {
    const timeDifference = this.saleStartTime.getTime() - this.now().getTime();

    if (timeDifference <= 0) return '00:00:00';

    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
  });

  private padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
