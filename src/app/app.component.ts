import { Component } from '@angular/core';
import { environment } from '../environments/environment';

declare const gtag: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public mapLoaded = false;

  constructor() {
    // enable analytics only on production build, which are not running on localhost
    if (environment.production && !environment.localhost) {
      // setup google analytics with the id (more details see: https://developers.google.com/gtagjs)
      gtag('config', environment.analyticsId);
    }
  }

  onLoaded() {
    console.log('map loaded');
    this.mapLoaded = true;
  }
}
