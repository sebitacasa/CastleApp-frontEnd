// RetroMapStyle.js
export const RETRO_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#ebe3cd" }] // Fondo color papel
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#523735" }] // Texto color tinta vieja
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f1e6" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#c9b2a6" }] // Fronteras suaves
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#dcd2be" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#dfd2ae" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [{ "visibility": "off" }] // Ocultar negocios modernos
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f1e6" }] // Calles casi invisibles (color papel)
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#f8c967" }] // Autopistas doradas/ocres
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#b9d3c2" }] // Agua azul acuarela pálido
  }
];