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
args = parser.parse_args()

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

with psycopg2.connect(
    user = args.user[0],
    password = args.password[0],
    dbname = 'us_map'
) as conn:
    cur = conn.cursor()
    query = load_query('counties_geojson.sql')
    percentiles = load_query('percentiles.sql')
    
    cur.execute(query)
    counties_data = json.dumps(cur.fetchone()[0])
    
    # Calculate 20th, 40th, ..., 80th percentile for each variable
    percentiles_json = {}
    for col in vars.keys():
        cur.execute(percentiles.format(col=col))
        percentiles_json[col] = cur.fetchone()[0]
        
    with open('counties.js', 'w') as outfile:
        outfile.write('var counties = {};'.format(
            counties_data))
    
    with open('index.html', 'w') as outfile:
        outfile.write('''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>US Map</title>
                <link rel="stylesheet" href="js/leaflet.css" />
                
                <!-- Load tabs -->
                <script src="js/vince.js/tabs/tabs.js" type="text/javascript"></script>
                
                <!-- Load c3.css -->
                <link href="js/c3-0.6.5/c3.css" rel="stylesheet">

                <!-- Load d3.js and c3.js -->
                <script src="js/d3.v5.min.js"></script>
                <script src="js/c3-0.6.5/c3.min.js"></script>
                <script src="js/leaflet.js"></script>
                <link rel="stylesheet" href="index.css" type="text/css" />
            </head>
            <body>
                <div id='overlay'></div>
                <div id='map'></div>
                <script type="text/javascript">
                    var meta = {meta};
                    var percentiles = {pct};
                </script>
                <script src="counties.js" type="text/javascript"></script>
                <script src="helpers.js" type="text/javascript"></script>
                <script src="index.js" type="text/javascript"></script>
                <script type='text/javascript'>
                    <!-- Crucial: This needs to load after index.js -->
                    var tabs = new Tabber('tabs');
                </script>
            </body>
            </html>'''
            .format(
                meta = json.dumps(vars),
                pct = json.dumps(percentiles_json)
            ))