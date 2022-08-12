import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
// @ts-ignore
import io from 'socket.io-client';

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
  constructor(private route: ActivatedRoute, private router: Router) {
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
          this.currentBuses[i].setLatLng(newLatLng);
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
