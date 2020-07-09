/* eslint-disable */
export const displayMap = (locations, settings) => {
    // Mapbox init
    mapboxgl.accessToken =
        'pk.eyJ1IjoiYWJtc3R1ZGlvIiwiYSI6ImNrNXI1bnI1cjA4dzUzZG1yZHdtaHVlY2wifQ.Wy8J5ftzHDkoUj3Gb5qGqA';

    const map = new mapboxgl.Map(
        Object.assign(
            {
                container: 'map',
                style: 'mapbox://styles/abmstudio/ck5r5zlbt17to1il30e9wzknj',
                scrollZoom: false
                // center: [-74.5, 40],
                // zoom: 10
            },
            settings.options
        )
    );

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    // ustawia mapę tak by widoczne były wszyskie markery
    map.fitBounds(bounds, settings.bounds);
};
