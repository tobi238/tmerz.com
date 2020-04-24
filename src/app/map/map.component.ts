import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { Map, LatLng, TileLayer } from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('map') public $map: ElementRef<HTMLDivElement>;

  public map: Map;

  @Output() loaded = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.map = new Map(this.$map.nativeElement, {
      zoomControl: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      scrollWheelZoom: false,
      attributionControl: false,
    }).setView(new LatLng(49.0076052, 8.4026419), 14);

    const layer = new TileLayer(
      'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png',
      {
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
      }
    );

    // all map tiles loaded
    layer.on('load', (e) => {
      setTimeout(() => {
        this.loaded.emit(true);
      }, 1000);
    });
    layer.addTo(this.map);
  }
}
