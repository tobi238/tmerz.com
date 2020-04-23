import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { map, tileLayer, latLng } from 'leaflet';
import { environment } from '../../environments/environment';

import FontAwesome from '@fortawesome/fontawesome';
import { faEnvelope } from '@fortawesome/fontawesome-free-solid';
import {
  faXing,
  faLinkedinIn,
  faGithub,
} from '@fortawesome/fontawesome-free-brands';
FontAwesome.library.add(faEnvelope, faXing, faLinkedinIn, faGithub);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  public map;
  private mapState: any = {
    center: new latLng(49.0076052, 8.4026419),
    zoom: 14,
    options: {
      zoomControl: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      scrollWheelZoom: false,
    },
  };

  public showCard = false;
  public showSocials = false;

  private showPageLoading: any;
  private showAppAndCard: any;
  private showSocialsTimeoutId: any;

  public start: any = {
    loaded: false,
    loading: true,
  };

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.map = map('map', this.mapState.options).setView(
      this.mapState.center,
      this.mapState.zoom
    );
    window['map'] = this.map;

    const layer = tileLayer(
      'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}',
      {
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
      }
    );

    // show card animation
    this.showAppAndCard = setTimeout(() => {
      this.start.loading = false;
      this.showCard = true;
    }, 300);

    // show socials animation
    this.showSocialsTimeoutId = setTimeout(() => {
      this.showSocials = true;
    }, 500);

    // all map tiles loaded
    layer.on('load', (e) => {
      // hide page_loading
      this.showPageLoading = setTimeout(() => {
        this.start.loaded = true;
      }, 0);
    });
    layer.addTo(this.map);
  }

  ngOnDestroy() {
    if (this.showPageLoading) {
      clearTimeout(this.showPageLoading);
    }

    if (this.showAppAndCard) {
      clearTimeout(this.showAppAndCard);
    }

    if (this.showSocialsTimeoutId) {
      clearTimeout(this.showSocialsTimeoutId);
    }
  }
}
