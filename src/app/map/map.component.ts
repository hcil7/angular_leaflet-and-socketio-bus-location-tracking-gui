import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
// @ts-ignore

import io from 'socket.io-client';
// @ts-ignore
import * as lf from 'leaflet.marker.slideto';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  private map: any;
  change: any = [];
  currentBuses: any = [];
  buses: any = [];
  index = 0;
  testbus: any;

  constructor(private route: ActivatedRoute, private router: Router) {
    L.Marker.include({
      _slideToUntil: undefined,
      _slideToDuration: undefined,
      _slideToLatLng: undefined,
      _slideFromLatLng: undefined,
      _slideKeepAtCenter: undefined,
      _slideDraggingWasAllowed: undefined,

      // 🍂method slideTo(latlng: LatLng, options: Slide Options): this
      // Moves this marker until `latlng`, like `setLatLng()`, but with a smooth
      // sliding animation. Fires `movestart` and `moveend` events.
      slideTo: function slideTo(latlng: any, options: any) {
        if (!this._map) return;

        this._slideToDuration = options.duration;
        this._slideToUntil = performance.now() + options.duration;
        this._slideFromLatLng = this.getLatLng();
        this._slideToLatLng = latlng;
        this._slideKeepAtCenter = !!options.keepAtCenter;
        this._slideDraggingWasAllowed =
          this._slideDraggingWasAllowed !== undefined
            ? this._slideDraggingWasAllowed
            : this._map.dragging.enabled();

        if (this._slideKeepAtCenter) {
          this._map.dragging.disable();
          this._map.doubleClickZoom.disable();
          this._map.options.touchZoom = 'center';
          this._map.options.scrollWheelZoom = 'center';
        }

        this.fire('movestart');
        this._slideTo();

        return this;
      },

      // 🍂method slideCancel(): this
      // Cancels the sliding animation from `slideTo`, if applicable.
      slideCancel: function slideCancel() {
        L.Util.cancelAnimFrame(this._slideFrame);
      },

      _slideTo: function _slideTo() {
        if (!this._map) return;

        var remaining = this._slideToUntil - performance.now();

        if (remaining < 0) {
          this.setLatLng(this._slideToLatLng);
          this.fire('moveend');
          if (this._slideDraggingWasAllowed) {
            this._map.dragging.enable();
            this._map.doubleClickZoom.enable();
            this._map.options.touchZoom = true;
            this._map.options.scrollWheelZoom = true;
          }
          this._slideDraggingWasAllowed = undefined;
          return this;
        }

        var startPoint = this._map.latLngToContainerPoint(
          this._slideFromLatLng
        );
        var endPoint = this._map.latLngToContainerPoint(this._slideToLatLng);
        var percentDone =
          (this._slideToDuration - remaining) / this._slideToDuration;

        var currPoint = endPoint
          .multiplyBy(percentDone)
          .add(startPoint.multiplyBy(1 - percentDone));
        var currLatLng = this._map.containerPointToLatLng(currPoint);
        this.setLatLng(currLatLng);

        if (this._slideKeepAtCenter) {
          this._map.panTo(currLatLng, { animate: false });
        }

        this._slideFrame = L.Util.requestAnimFrame(this._slideTo, this);
      },
    });
    this.route.params.subscribe((params: any) => {
      console.log(params.networkid);
      this.router.navigateByUrl('/map/' + params.networkid);
    });
    var greenIcon = L.icon({
      iconUrl: './assets/bus.svg',

      iconSize: [22, 22],

      iconAnchor: [11, 22],
      shadowAnchor: [4, 62],
      popupAnchor: [-3, -76],
    });

    var socket = io('http://localhost:3000', {
      query: { networkid: this.route.snapshot.paramMap.get('networkid') },
    });
    socket.emit('initial', this.route.snapshot.paramMap.get('networkid'));
    socket.on('initialData', (data: any) => {
      this.buses = data;

      for (var i = 0; i < data.length; i++) {
        this.currentBuses[i] = new L.Marker([data[i].lat, data[i].lon], {
          icon: greenIcon,
        });

        this.currentBuses[i].addTo(this.map);
      }
    });
    socket.on('dbresponse', (data: any) => {
      this.change[this.index] =
        'Change Detected: ' +
        'Bus id: ' +
        data.bus_id +
        ' lat: ' +
        data.lat +
        ' lon: ' +
        data.lon;
      this.index++;

      for (var i = 0; i < this.currentBuses.length; i++) {
        if (data.bus_id == this.buses[i].bus_id) {
          var newLatLng = L.latLng(data.lat, data.lon);

          var latlon = [data.lat, data.lon];
          // this.currentBuses[i].setLatLng(newLatLng);
          this.currentBuses[i].slideTo([data.lat, data.lon], {
            duration: 1000,
          });
        }
      }
    });
  }

  ngOnInit(): void {
    this.initMap();
  }
  private initMap(): void {
    this.map = L.map('map', {
      center: [40.766666, 29.916668],
      zoom: 12,
    });
    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(this.map);
  }
}
