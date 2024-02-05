/* eslint-disable */
import mapboxgl from 'mapbox-gl';

export const displayMap = locations => {
	mapboxgl.accessToken =
		'pk.eyJ1IjoiZG92ZWx5IiwiYSI6ImNscnEwbmk4MzA4eWMycWxpaWw4MmxydjQifQ.O6X9cpuikvR6m8_ssVYnDw';
	const map = new mapboxgl.Map({
		container: 'map', // container ID
		style: 'mapbox://styles/dovely/clrq3s0rt00aa01pl4u99gmy6', // style URL
		scrollZoom: false, // scroll zoom
	});

	const bounds = new mapboxgl.LngLatBounds();

	locations.forEach(location => {
		// Create market
		const div = document.createElement('div');
		div.className = 'marker';

		// Add marker
		new mapboxgl.Marker({
			element: div,
			anchor: 'bottom',
		})
			.setLngLat(location.coordinates)
			.addTo(map);

		// Add popup
		new mapboxgl.Popup({
			offset: 30,
		})
			.setLngLat(location.coordinates)
			.setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
			.addTo(map);

		// Extend map bound to include current location
		bounds.extend(location.coordinates);
	});

	map.fitBounds(bounds, {
		padding: {
			top: 200,
			bottom: 150,
			left: 100,
			right: 100,
		},
	});
};
