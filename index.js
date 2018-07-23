/////////////
// Overlay //
/////////////

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

const overlay_manager = new Overlay("#overlay");

///////////////
// Map State //
///////////////

var map_state = {
    current_var: null,
    current_active_layer: null,
    current_legend: null,
    current_info_box: null
};

///////////////////
// Layer Control //
///////////////////
var layer_manager = {
    // A collection of functions for managing the different layers
    // corresponding to different ACS 16 variables

    show: function(var_name) {
        // Destroy previous map layer
        if (map_state.current_active_layer) {
            map_state.current_active_layer.remove();
            map_state.current_legend.remove();
            map_state.current_info_box.remove();
        }
        
        // Load new map layer
        map_state.current_var = var_name;
        map_state.current_active_layer = L.geoJson(counties, {
            style: layer_manager.style,
            onEachFeature: layer_manager.onEachFeature
        }).addTo(map);
        
        // add info box
        map_state.current_info_box = layer_manager.make_info_box(var_name, map);
        
        // Add legend
        map_state.current_legend = layer_manager.make_legend(var_name, map);
    },
    
    make_info_box: function(var_name, map) {
        var info = L.control({position: 'topright'});

        info.onAdd = function(map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function(props) {
            this._div.innerHTML = '<h4>' + meta[var_name].display_label + '</h4>' +
                (props ?
                    '<b>' + props.NAME + ' County' + 
                    ', ' + props.STATE_NAME + '</b><br />' +
                    props[var_name] + ' ' + meta[var_name].units :
                'Hover over a county');
        };

        info.addTo(map);
        return info;
    },
    
    make_legend: function(var_name, map) {
        // Create a legend
        var grades = [
            0,
            percentiles[var_name][0.2],
            percentiles[var_name][0.4],
            percentiles[var_name][0.6],
            percentiles[var_name][0.8]
        ];
        
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                labels = [];
                
            div.innerHTML += '<h4>' + meta[var_name].units + '</h4>';

            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + layer_manager.getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(map);
        return legend;
    },
    
    getColor: function(d) {
        const pct = percentiles[map_state.current_var];
        return d > pct[0.8] ? '#0868ac' :
               d > pct[0.6] ? '#43a2ca' :
               d > pct[0.4] ? '#7bccc4' :
               d > pct[0.2] ? '#bae4bc' :
                              '#f0f9e8';
    },

    style: function(feature) {
        return {
            fillColor: layer_manager.getColor(feature.properties[map_state.current_var]),
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        }
    },
    
    onEachFeature: function(feature, layer) {
        layer.on({
            mouseover: layer_manager.highlightFeature,
            mouseout: layer_manager.resetHighlight,
            click: moreInfo
        });
    },
    
    highlightFeature: function(e) {
        var layer = e.target;
        
        // Enhance outline on hover
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
        
        map_state.current_info_box.update(layer.feature.properties);
    },

    resetHighlight: function(e) {
        // Undo outline effect
        map_state.current_active_layer.resetStyle(e.target);
        map_state.current_info_box.update();
    }
}

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

// popup containing extra information (same for all layers)
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
    overlay_manager.subtitle.innerHTML = "Mean Commute Time: " + props.HC01_EST_VC55 + " minutes (Males: " + props.HC02_EST_VC55 + ", Females: " + props.HC03_EST_VC55 + ")" +
    "<br /><span>Rank (best to worst): " + props.HC01_EST_VC55_RANK + " out of " + counties.features.length + " (USA); " + props.HC01_EST_VC55_STATE_RANK +"th best in " + 
    props.STATE_NAME + "</span>";
    overlay_manager.generate(params);
}

layer_manager.show('HC01_EST_VC55');

//////////////
// Dropdown //
//////////////
var dropdown = L.control({position: 'bottomleft'});
dropdown.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'dropdown');
    this.update();
    return this._div;
};

// update control based on feature properties
dropdown.update = function(props) {
    var label = L.DomUtil.create('label');
    label.setAttribute('for', 'variable_options');
    label.innerHTML = 'Variable of Interest: ';
    this._div.appendChild(label);
    
    // dropdown list
    var select = L.DomUtil.create('select', 'variable_options');
    select.onchange = function() {
        layer_manager.show(select.value); // update map
    }
    
    // add variables to dropdown list
    const vars = Object.keys(meta);
    for (i in vars) {
        var option = L.DomUtil.create('option');
        option.value = vars[i];                         // actual Census variable name
        option.innerHTML = meta[vars[i]].display_label; // pretty display name
        select.appendChild(option);
    }
    
    this._div.appendChild(select);
};

dropdown.addTo(map);