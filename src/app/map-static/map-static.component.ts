import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import objectFitImages from 'object-fit-images';

@Component({
  selector: 'app-map-static',
  templateUrl: './map-static.component.html',
  styleUrls: ['./map-static.component.scss'],
})
export class MapStaticComponent implements AfterViewInit {
  @ViewChild('map') public $map: ElementRef<HTMLImageElement>;

  @Output() loaded = new EventEmitter<boolean>();

  constructor() {}

  ngAfterViewInit(): void {
    // IE11 object-fit polyfill
    objectFitImages(this.$map.nativeElement);

    this.$map.nativeElement.onload = () => this.loaded.emit(true);
  }
}
