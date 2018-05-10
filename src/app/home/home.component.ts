import { Component, OnInit } from '@angular/core';
import { map, tileLayer } from 'leaflet';
import { environment } from '../../environments/environment';

import FontAwesome from '@fortawesome/fontawesome';
import { faEnvelope } from '@fortawesome/fontawesome-free-solid';
import { faXing, faLinkedinIn, faGithub } from '@fortawesome/fontawesome-free-brands';
FontAwesome.library.add(faEnvelope, faXing, faLinkedinIn, faGithub);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public map;
  private mapState: any = {
    center: [49.0076052,8.4026419],
    zoom: 14,
    options: {
      zoomControl: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      scrollWheelZoom: false,
    }
  }

  public showCard: boolean = false
  public showSocials: boolean = false

  private showPageLoading: any
  private showAppAndCard: any
  private showSocialsTimeoutId: any

  public start : any = {
    loaded: false,
    loading: true
  }

  constructor() { }

  ngOnInit() {}

  ngAfterViewInit() {
    this.map = map('map', this.mapState.options).setView(this.mapState.center, this.mapState.zoom);
    const layer = tileLayer('https://api.mapbox.com/styles/v1/tobi238/cj5mj7f4m3h0p2ss7v22uplf7/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      detectRetina: true,
      accessToken: environment.MAPBOX_API_KEY
    })

    // show card animation
    this.showAppAndCard = setTimeout(() => {
      this.start.loading = false
      this.showCard = true;
    }, 300);

    // show socials animation
    this.showSocialsTimeoutId = setTimeout(() => {
      this.showSocials = true;
    }, 500);

    // all map tiles loaded
    layer.on('load', e => {
      // hide page_loading
      this.showPageLoading = setTimeout(() => {
        this.start.loaded = true
      }, 0);
    })
    layer.addTo(this.map);
    
  }

  ngOnDestroy () {
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