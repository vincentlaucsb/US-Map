class Overlay {
    // Manages the extra information overlay
    
    constructor (target) {
        // target should be a CSS selector
        this.target = target;
        
        const target_elem = document.querySelector(target);
        
        // create header
        this.title = document.createElement("h1");
        target_elem.appendChild(this.title);
        
        // create subtitle
        this.subtitle = document.createElement("p");
        target_elem.appendChild(this.subtitle);
        
        // create new div (to hold graph) and append to target
        var graph_holder = document.createElement("div");
        graph_holder.setAttribute("class", "graph");
        target_elem.appendChild(graph_holder);
        
        // create close handler
        var close_handler = document.createElement("a");
        close_handler.innerHTML = "Close [x]";
        
        // addEventListener doesn't work for some reason
        close_handler.setAttribute("onclick", "overlay_manager.hide()");
        target_elem.appendChild(close_handler);
    }
    
    generate(params) {
        params.bindto = this.target + " div.graph";
        this.show();
        c3.generate(params);
    }
    
    hide() {
        document.querySelector(this.target).classList.remove("visible");
    }
    
    show() { 
        document.querySelector(this.target).classList.add("visible");
    }
}

var overlay_manager = new Overlay("#overlay");

/////////
// Map //
/////////

var mapboxAccessToken = 'pk.eyJ1IjoidmluY2VsYTkiLCJhIjoiY2pqcWMyNzJkMjhzdDNycXFidml6OHRjZCJ9.yzCoZ4nmdizDPDC0a5uxUA';
var map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
    id: 'mapbox.light',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
}).addTo(map);

function getColor(d) {
    return d > 27.8 ? '#0868ac' :
           d > 24.3 ? '#43a2ca' :
           d > 21.6 ? '#7bccc4' :
           d > 18.6 ? '#bae4bc' :
                      '#f0f9e8';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.HC01_EST_VC55),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7        
    }
}

/////////////
// InfoBox //
/////////////

var info = L.control();

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with class "info"
    this.update();
    return this._div;
};

// update control based on feature properties
info.update = function(props) {
    this._div.innerHTML = '<h4>Average Commute Time</h4>' + (props ?
        '<b>' + props.NAME + ' County</b><br />' + props.HC01_EST_VC55 + ' minutes'
        : 'Hover over a county');
};

info.addTo(map);

function highlightFeature(e) {  
    var layer = e.target;
    
    // Enhance outline on hover
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    // Undo outline effect
    geojson.resetStyle(e.target);
    
    var layer = e.target;
    info.update();
}

function moreInfo(e) {
    var props = e.target.feature.properties;
    var params = {
        data: {
            columns: [
                [
                    'Total',
                    props.HC01_EST_VC46, props.HC01_EST_VC47, props.HC01_EST_VC48,
                    props.HC01_EST_VC49, props.HC01_EST_VC50, props.HC01_EST_VC51,
                    props.HC01_EST_VC52, props.HC01_EST_VC53, props.HC01_EST_VC54
                ], 
                [
                    'Male',
                    props.HC02_EST_VC46, props.HC02_EST_VC47, props.HC02_EST_VC48,
                    props.HC02_EST_VC49, props.HC02_EST_VC50, props.HC02_EST_VC51,
                    props.HC02_EST_VC52, props.HC02_EST_VC53, props.HC02_EST_VC54
                ],
                [
                    'Female',
                    props.HC03_EST_VC46, props.HC03_EST_VC47, props.HC03_EST_VC48,
                    props.HC03_EST_VC49, props.HC03_EST_VC50, props.HC03_EST_VC51,
                    props.HC03_EST_VC52, props.HC03_EST_VC53, props.HC03_EST_VC54
                ]
            ],
            type: 'bar'
        },
        axis: {
          x: {
            type: 'category',
            categories: [
                'Less than 10 minutes',
                '10 to 14 minutes',
                '15 to 19 minutes',
                '20 to 24 minutes',
                '25 to 29 minutes',
                '30 to 34 minutes',
                '35 to 44 minutes',
                '45 to 59 minutes',
                '60 or more minutes'
            ]
          }
        },
        bar: {
            width: {
                ratio: 0.5 // this makes bar width 50% of length between ticks
            }
            // or
            //width: 100 // this makes bar width 100px
        }
    };
    
    overlay_manager.title.innerHTML = props.NAME + " County" + ", " + props.STATE_NAME;
    overlay_manager.subtitle.innerHTML = "Mean Commute Time: " + props.HC01_EST_VC55 + " minutes (Males: " + props.HC02_EST_VC55 + ", Females: " + props.HC03_EST_VC55 + ")";
    overlay_manager.generate(params);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: moreInfo
    });
}

var geojson = L.geoJson(counties, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

///////////////////
// Custom Legend //
///////////////////

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 18.6, 21.6, 24.3, 27.8],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);