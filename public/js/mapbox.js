/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2tlcmFyYWhwaWtjIiwiYSI6ImNtMWd4ZXE2bTA2cW8yanNpYjA5dHE1cngifQ.tIOA1yNesYTFKs4NvyD-Mw';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ckerarahpikc/cm1i61wy600bp01qt0oqparm9',
    doubleClickZoom: false,
    dragRotate: false,
    boxZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // do all this for each of the location
    const el = document.createElement('div');
    el.className = 'marker';

    const popup = new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    const marker = new mapboxgl.Marker({
      element: el
    })
      .setLngLat(loc.coordinates)
      .setPopup(popup)
      .addTo(map);

    // toggle the popup when clicking the marker
    marker.getElement().addEventListener('click', () => {
      marker.togglePopup();
    });

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });

  document.getElementById('map-group').addEventListener('change', (e) => {
    const handler = e.target.id;
    if (e.target.checked) {
      map[handler].enable();
    } else {
      map[handler].disable();
    }
  });
};
