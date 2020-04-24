import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public mapLoaded = false;

  onLoaded() {
    console.log('map loaded');
    this.mapLoaded = true;
  }
}
