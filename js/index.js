/////////////
// Overlay //
/////////////

class GraphContainer {
    /*
     * Helper class for Overlay
     *
     * Each GraphContainer corresponds to a new tab in the overlay display
     */
    
    constructor(parent, elem, title) {
        // elem should be an ID name
        this.target = elem;
        var new_section = document.createElement("section");
        new_section.dataset.title = title;
        new_section.setAttribute("id", elem);
        
        // Make subtitle
        this.subtitle = document.createElement("p");
        this.subtitle.setAttribute("class", "subtitle");
        new_section.appendChild(this.subtitle);
        
        // Make container for c3 graph
        var graph_container = document.createElement("div");
        graph_container.setAttribute("class", "graph");
        new_section.appendChild(graph_container);
        
        parent.appendChild(new_section);
    }
    
    generate(params) {
        params.bindto = "#" + this.target + " div.graph";
        params.axis.x.height = 50;
        c3.generate(params);
    }
}

class Overlay {
    // Manages the extra information overlay
    
    constructor (target) {
        // target should be a CSS selector
        this.target = target;
        const target_elem = document.querySelector(target);
        
        // for tab.js
        var tab_menu = document.createElement("nav");
        var tabs = document.createElement("div");
        tab_menu.setAttribute("id", "tabs-menu");
        tabs.setAttribute("id", "tabs");
        
        // create elements
        this.title = document.createElement("h1");
        target_elem.appendChild(this.title);
        target_elem.appendChild(tab_menu);
        target_elem.appendChild(tabs);
        
        // register graphs
        this.graphs = {
            commute: new GraphContainer(tabs, "commute", 'Commute Times'),
            transport: new GraphContainer(tabs, "transport", 'Mode of Transportation')
        };
        
        // create close handler
        var close_handler = document.createElement("a");
        close_handler.setAttribute("class", "close-handler");
        close_handler.innerHTML = "Close";
        
        // addEventListener doesn't work for some reason
        close_handler.setAttribute("onclick", "overlay_manager.hide()");
        target_elem.appendChild(close_handler);
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
        var grades = [ 0 ];
        const sorted_pct = Object.keys(percentiles[var_name]).sort();
        for (var i in sorted_pct) {
            const pct = sorted_pct[i];
            grades.push(percentiles[var_name][pct]);
        }
        
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
        return d > pct[0.875] ? '#0c2c84' :
               d > pct[0.75]  ? '#225ea8' :
               d > pct[0.625] ? '#1d91c0' :
               d > pct[0.5]   ? '#41b6c4' :
               d > pct[0.375] ? '#7fcdbb' : 
               d > pct[0.25]  ? '#c7e9b4' :
               d > pct[0.125] ? '#edf8b1' :
                                '#ffffd9' ;
    },

    style: function(feature) {
        return {
            fillColor: layer_manager.getColor(feature.properties[map_state.current_var]),
            weight: 0, // stroke width
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
    
    // Commuters
    var commute_params = {
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
    
    // Mode of Transportation
    var transport_params = {
        data: {
            columns: [
                [
                    'Total', 
                    props.HC01_EST_VC03, props.HC01_EST_VC04, props.HC01_EST_VC05,
                    props.HC01_EST_VC10, props.HC01_EST_VC11, props.HC01_EST_VC12,
                    props.HC01_EST_VC13, props.HC01_EST_VC14
                ]
            ],
            type: 'bar',
            groups: [
                ['Drove to Work (Total)', 'Took Public Transport',
                'Walked',
                'Biked',
                'Cab, Motorcycle, etc.',
                'Worked at Home']
            ]
        },
        axis: {
          x: {
            type: 'category',
            categories: [
                'Drove to Work (Total)',
                'Drove to Work (Alone)',
                'Drove to Work (Carpool)',
                'Took Public Transport',
                'Walked',
                'Biked',
                'Cab, Motorcycle, etc.',
                'Worked at Home'
            ]
          }
        },
        bar: {
            width: {
                ratio: 0.5
            }
        }
    };
    
    overlay_manager.title.innerHTML = props.NAME + " County" + ", " + props.STATE_NAME;
    overlay_manager.show();
    overlay_manager.graphs.commute.generate(commute_params);
    overlay_manager.graphs.commute.subtitle.innerHTML = "Mean Commute Time: " + props.HC01_EST_VC55 +
        " minutes (Males: " + props.HC02_EST_VC55 + ", Females: " + props.HC03_EST_VC55 + ")" +
        "<br /><span>Rank (best to worst): " + 
        ordinal(props.HC01_EST_VC55_STATE_RANK) + " in " + props.STATE_NAME + ", " +
        ordinal(props.HC01_EST_VC55_RANK) + " in America (out of " + counties.features.length + ")</span>";
    
    overlay_manager.graphs.transport.generate(transport_params);
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