
// instantiate the map (Paris)
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyYWhoYWhtYWQiLCJhIjoiY2x1bHU0NDdxMDBtcTJqb3lwcDAyM3NpMSJ9.LtM9x5jiBhMAt00hdlBVyw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12', //street map style 
    center: [2.34778, 48.85540], //starting position centered on Paris
    zoom: 11.7 // starting zoom view
});


// add a navigation control
map.addControl(new mapboxgl.NavigationControl());

// wait! don't execute this code until the map is finished it's initial load
map.on('load', () => {

    // add a geojson source for Paris administrative border
    map.addSource('paris-districts', {
        "type": "geojson",
        "data": "data/paris-districts.geojson",
    })

    // add a geojson source for Areas identified as Social Housing Deficit Zones (PLU)
    map.addSource('deficit', {
        "type": "geojson",
        "data": "data/deficit.geojson",
    })

    //add geosjon source for social housing unit locations
    map.addSource('housing-units', {
        'type': 'geojson',
        'data': 'data/housing-units.geojson'
    })


map.addLayer({
    id: 'housing-units-fill',
    type: 'point',
    source: 'housing-units'
}, 'path-pedestrian-label');

    //add a fill layer, each arrondissement getting a color based on the percentage of the city's social housing units it has 
    map.addLayer({
        id: 'paris-districts-fill',
        type: 'fill',
        source: 'paris-districts',
        paint: {
            'fill-color': [
                'match',
                ['get', 'percentsruclass'],
                'under5', '#edf8fb',
                '5to10', '#bfd3e6',
                '10to15', '#9ebcda',
                '15to20', '#8c96c6',
                '20to25', '#8856a7',
                'over25', '#810f7c',
                '#ccc'
            ],
            'fill-opacity': .6

        }
    }, 'path-pedestrian-label');


    // add a line layer using the arrondissement boundaries
    map.addLayer({
        'id': 'paris-districts-line',
        'type': 'line',
        'source': 'paris-districts',
        'layout': {},
        'paint': {
            'line-color': '#C4C6C8',
            'line-width': .75
        }
    }, 'path-pedestrian-label');

    // add a line layer for highlighting clicked arrondissement
    map.addLayer({
        id: 'highlight-line',
        type: 'line',
        source: 'paris-districts',
        paint: {
            'line-color': '#04E7FF', // Adjust color as needed
            'line-width': 2
        },
        filter: ['==', 'name3', ''] // Initially hide the line layer
    });

     //visualize deficit zones

  map.addLayer({
    id: 'deficit-fill',
    type: 'fill',
    source: 'deficit',
    minizoom: 5,
    paint: {
        'fill-color': '#FFBDAE',
        'fill-opacity': 1
    }
}, 'path-pedestrian-label');

  map.addLayer({
    id: 'deficit-line',
    type: 'line',
    source: 'deficit',
    paint: {
        'line-color': 'black',
        'line-width': 1
    }
    }, 'path-pedestrian-label');

    
    // Event listener for click on arrondissements
    map.on('click', 'paris-districts-fill', function (e) {
        var clickedFeature = e.features[0];
        highlightFeature(clickedFeature);
        showPopup(clickedFeature);
    });

});

// Function to highlight clicked arrondissement
function highlightFeature(feature) {
    map.setFilter('highlight-line', ['==', 'name3', feature.properties.name3]);
}


// Function to show popup with information about social housing percentages and inventory
//since geojson was originally from a shapefile, I wanted to make sure that the pop up was showing up in the center of each arrondissement instead of snapping to the polygon line. so I asked ChatGPT for some help and it had me download a program that can calculate the center of each polygon (arrondissement) 
function showPopup(feature) {
    var centroid = turf.centroid(feature).geometry.coordinates; // Calculate centroid using turf.js
    var description = '<h3>' + feature.properties.name3 + ' | <br>' + feature.properties.neighborhoodname + '</h3>' +
        '<p>Percent of Citywide Social Housing Units: ' + feature.properties.percsocialhousing + '</p>' +
        '<p>Number of Social Housing Units: ' + feature.properties.units + '</p>';

    // Ensure that the popup is not already open
    if (!map.getLayer('popup')) {
    var popup = new mapboxgl.Popup({ closeOnClick: true })
            .setLngLat(centroid) // Set the centroid as the popup location
            .setHTML(description)
            .addTo(map);
}


// Change the cursor to a pointer when
// the mouse is over the states layer.
map.on('mouseenter', 'paris-districts-fill', () => {
    map.getCanvas().style.cursor = 'pointer';
});

// Change the cursor back to a pointer
// when it leaves the states layer.
map.on('mouseleave', 'paris-districts-fill', () => {
    map.getCanvas().style.cursor = '';
});
}