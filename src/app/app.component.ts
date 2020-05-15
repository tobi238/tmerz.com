import { Component } from '@angular/core';
import { environment } from '../environments/environment';

// declare gives Angular app access to ga function
declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public mapLoaded = false;

  constructor() {
    if (environment.production) {
      gtag('config', environment.analyticsId);
    }
  }

  onLoaded() {
    console.log('map loaded');
    this.mapLoaded = true;
  }
}
