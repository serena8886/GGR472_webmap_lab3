/* ══════════════════════════════════════════════
   GGR472 Lab 3 - Toronto DineSafe Map
   script.js: Mapbox initialisation, expressions, and events
══════════════════════════════════════════════ */

// ── 🔑 Replace with your own Mapbox token ──
mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZW5heGllIiwiYSI6ImNta2RnM29ocjBiYmQzZnB3ZjYxNnc0Y2YifQ.OKLpStuEaqsA1l9cHya4Hw';

/* ══════════════════════════════════════════════
   Helper lookups: status → colour / badge class
══════════════════════════════════════════════ */
const statusBadge = {
  'Pass':             'badge-pass',
  'Conditional Pass': 'badge-cond',
  'Closed':           'badge-closed'
};

const statusColor = {
  'Pass':             '#4caf50',
  'Conditional Pass': '#ff9800',
  'Closed':           '#ef5350'
};

/* ══════════════════════════════════════════════
   Initialise map
══════════════════════════════════════════════ */
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-79.3832, 43.6532],
  zoom: 12
});

// Navigation control (zoom +/- buttons)
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

/* ══════════════════════════════════════════════
   map.on('load') – runs after base style loads
══════════════════════════════════════════════ */
map.on('load', () => {

  // ── Add GeoJSON source ──
  // After publishing to GitHub Pages, use the Pages URL format:
  // https://yourusername.github.io/repositoryname/restaurant.geojson
  map.addSource('restaurants', {
    type: 'geojson',
    data: 'restaurant.geojson'  // ← update this to your GitHub Pages URL after publishing
  });

  // ── Add circle layer with data-driven styling ──
  map.addLayer({
    id: 'restaurants-layer',
    type: 'circle',
    source: 'restaurants',
    paint: {

      // DATA EXPRESSION: 'match' picks colour based on 'status' property
      // This is a conditional expression
      'circle-color': [
        'match', ['get', 'status'],
        'Pass',             '#4caf50',
        'Conditional Pass', '#ff9800',
        'Closed',           '#ef5350',
        '#aaa' // fallback colour
      ],

      // CAMERA EXPRESSION: 'interpolate' smoothly scales circle size with zoom
      // This is a ramp/scale expression
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 4,   // zoom 10 → radius 4px
        14, 9,   // zoom 14 → radius 9px
        17, 14   // zoom 17 → radius 14px
      ],

      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.9
    }
  });

  /* ──────────────────────────────────────────
     EVENT: click → show Popup
     e.lngLat gives coordinates of click
     e.features[0].properties gives feature data
  ────────────────────────────────────────── */
  const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });

  map.on('click', 'restaurants-layer', (e) => {
    const p = e.features[0].properties;
    const badgeClass = statusBadge[p.status] || 'badge-pass';

    popup
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>${p.name}</strong>
        ${p.address}<br>
        <span class="status-badge ${badgeClass}">${p.status}</span><br>
        <span style="color:#aaa;font-size:11px;">Infraction: ${p.infraction}</span><br>
        <span style="color:#aaa;font-size:11px;">Inspected: ${p.date}</span>
      `)
      .addTo(map);
  });

  /* ──────────────────────────────────────────
     EVENT: mouseenter / mouseleave → cursor
  ────────────────────────────────────────── */
  map.on('mouseenter', 'restaurants-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'restaurants-layer', () => {
    map.getCanvas().style.cursor = '';
  });

  /* ──────────────────────────────────────────
     EVENT: mousemove → update sidebar info box
  ────────────────────────────────────────── */
  map.on('mousemove', 'restaurants-layer', (e) => {
    const p = e.features[0].properties;
    document.getElementById('info').innerHTML = `
      <strong>${p.name}</strong>
      ${p.address}<br>
      Status: <b style="color:${statusColor[p.status]}">${p.status}</b><br>
      Inspected: ${p.date}
    `;
  });

  map.on('mouseleave', 'restaurants-layer', () => {
    document.getElementById('info').textContent = 'Hover over a restaurant to see details.';
  });

}); // end map.on('load')

/* ══════════════════════════════════════════════
   FILTER BUTTONS
   Uses setFilter() with a Mapbox filter expression
   to show only features matching the selected status
══════════════════════════════════════════════ */
let activeFilter = 'all';

function setFilter(status) {
  activeFilter = status;

  // FILTER EXPRESSION: null = show all, otherwise filter by status value
  if (status === 'all') {
    map.setFilter('restaurants-layer', null);
  } else {
    map.setFilter('restaurants-layer', ['==', ['get', 'status'], status]);
  }

  // Update button visual state
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.add('inactive'));

  const idMap = {
    'all':              'btn-all',
    'Pass':             'btn-pass',
    'Conditional Pass': 'btn-cond',
    'Closed':           'btn-closed'
  };
  document.getElementById(idMap[status]).classList.remove('inactive');
}

document.getElementById('btn-all')   .addEventListener('click', () => setFilter('all'));
document.getElementById('btn-pass')  .addEventListener('click', () => setFilter('Pass'));
document.getElementById('btn-cond')  .addEventListener('click', () => setFilter('Conditional Pass'));
document.getElementById('btn-closed').addEventListener('click', () => setFilter('Closed'));
