import argparse
import sys
import psycopg2
import json

def load_query(filename):
    with open('sql/' + filename) as sql:
        return sql.read()

parser = argparse.ArgumentParser(
    description='Generate a map of the US'
)

parser.add_argument('user', type=str, nargs=1, help="PostgreSQL username")
parser.add_argument('password', type=str, nargs=1, help="PostgreSQL password")

if len(sys.argv) > 1:
    args = parser.parse_args()
    regen = True
else:
    regen = False

# Variables that user can choose from
vars = {    
    'HC01_EST_VC55': {
        'display_label': 'Mean Commute Time',
        'units': 'minutes'
    },
    
    'HC01_EST_VC54': {
        'display_label': 'Extreme Commutes (60+ Minutes)',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC03': {
        'display_label': 'Drove to work',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC04': {
        'display_label': 'Drove to work (alone)',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC05': {
        'display_label': 'Drove to work (carpool)',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC10': {
        'display_label': 'Took public transportation to work',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC11': {
        'display_label': 'Walked to work',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC12': {
        'display_label': 'Biked to work',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC13': {
        'display_label': 'Took cab, rode motorcycle, etc. to work',
        'units': 'percent (of workers)'
    },
    
    'HC01_EST_VC14': {
        'display_label': 'Worked at home',
        'units': 'percent (of workers)'
    }
}

if regen:
    with psycopg2.connect(
        user = args.user[0],
        password = args.password[0],
        dbname = 'us_map'
    ) as conn:
        cur = conn.cursor()
        query = load_query('counties_geojson.sql')
        percentiles = load_query('percentiles.sql')
        worst = load_query('worst_commutes.sql')
        best = load_query('best_commutes.sql')
        
        cur.execute(query)
        counties_data = json.dumps(cur.fetchone()[0])
        
        # Calculate 20th, 40th, ..., 80th percentile for each variable
        percentiles_json = {}
        for col in vars.keys():
            cur.execute(percentiles.format(col=col))
            percentiles_json[col] = cur.fetchone()[0]
            
        # Build best/worst commutes graph
        cur.execute(worst)
        worst_json = cur.fetchone()[0]
        
        cur.execute(best)
        best_json = cur.fetchone()[0]
            
        with open('counties.js', 'w') as outfile:
            outfile.write('var counties = {};'.format(
                counties_data))
                
        with open('meta.js', 'w') as outfile:
            outfile.write('var meta = {};'.format(
                json.dumps(vars)))
                
        with open('worst-commutes.js', 'w') as outfile:
            outfile.write('c3.generate({});'.format(
                json.dumps(worst_json)))
                
        with open('best-commutes.js', 'w') as outfile:
            outfile.write('c3.generate({});'.format(
                json.dumps(best_json)))
                
        with open('percentiles.js', 'w') as outfile:
            outfile.write('var percentiles = {};'.format(
                json.dumps(percentiles_json)))
    
with open('index.html', 'w') as outfile:
    outfile.write('''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>US Map</title>
    <link rel="stylesheet" href="js/leaflet.css" />
    
    <!-- Load tabs -->
    <link href="js/vince.js/tabs/tabs.css" rel="stylesheet" type="text/css" />
    <script src="js/vince.js/tabs/tabs.js" type="text/javascript"></script>
    
    <!-- Load c3.css -->
    <link href="js/c3-0.6.5/c3.css" rel="stylesheet">

    <!-- Load d3.js and c3.js -->
    <script src="js/d3.v5.min.js"></script>
    <script src="js/c3-0.6.5/c3.min.js"></script>
    <script src="js/leaflet.js"></script>
    <link rel="stylesheet" href="css/index.css" type="text/css" />
    
    <!-- Data Tables -->
    <link rel="stylesheet" type="text/css" href="js/datatables/datatables.min.css"/>
    <script type="text/javascript" src="js/datatables/datatables.min.js"></script>
</head>
<body>
    <div id='overlay'></div>

    <div id='content-wrapper'>
        <nav id='main-menu'></nav>
        <div id='main'>
            <section data-title='Map'>
                <div id='map'></div>
            </section>
            
            <section data-title='Summary'>           
                <h2>Worst Commutes</h2>
                <p>A good chunk of the worst commutes belong to counties in the area around our nation's capital.</p>
                <div id="worst-commutes"></div>
                
                <h2>Best Commutes</h2>
                <p>Tired of waiting in traffic? Consider packing bags and moving to Alaska. On the other hand, maybe waiting in traffic isn't so bad after all.</p>
                <div id="best-commutes"></div>
                
                <!--<h2>Least Drivers</h2>-->
            </section>
            
            <section data-title='Sources'>
                <p>The following sources were invaluable in producing this visualization:</p>
                
                <section>
                    <h2>US Counties GeoJSON</h2>
                    <a href="http://eric.clst.org/tech/usgeojson/">
                        http://eric.clst.org/tech/usgeojson/
                    </a>
                    <p>A GeoJSON containing the geographic boundaries of every US county, converted from US Census Bureau shapefiles.</p>
                </section>

                <section>
                    <h2>American Community Survey</h2>
                    <a href="https://factfinder.census.gov">https://factfinder.census.gov</a>
                    <p>The data on American commuters was provided by Census table S0801 from the 2016 (5-year) American Community Survey.</p>
                </section>

                <section>
                    <h2>Source Code</h2>
                    <a href="https://github.com/vincentlaucsb/US-Map">https://github.com/vincentlaucsb/US-Map</a>
                    <p>This visualization was built by Vincent La with the help of JavaScript (leaflet.js, c3.js, and custom code), PostgreSQL, and Python.
                    </p>
                </section>
            </section>
        </div>
    </div>            
    
    <!-- Data Files -->
    <script src="meta.js" type="text/javascript"></script>
    <script src="percentiles.js" type="text/javascript"></script>
    <script src="counties.js" type="text/javascript"></script>
    <script src="worst-commutes.js" type="text/javascript"></script>
    <script src="best-commutes.js" type="text/javascript"></script>
    
    <!-- Map -->
    <script src="helpers.js" type="text/javascript"></script>
    <script src="index.js" type="text/javascript"></script>
    <script type='text/javascript'>
        <!-- Crucial: This needs to load after index.js -->
        var overlay_tabs = new Tabber('tabs');
        var map_tabs = new Tabber('main');
    </script>
</body>
</html>''')