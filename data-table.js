google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {
var data = new google.visualization.DataTable();
data.addColumn('string', 'County');
data.addColumn('string', 'State');

var rows = [];

for (var i = 0; i < counties.features.length; i++) {
    const props = counties.features[i].properties;
    rows.push([ props.NAME, props.STATE_NAME ]);
}

data.addRows(rows);

/*
data.setProperty("page", "enable");
data.setProperty("pageSize", 200);
data.setProperty("startPage", 0);
*/

var table = new google.visualization.Table(document.getElementById('table_div'));

table.draw(data, {
        page: 'enable',
        showRowNumber: true,
        width: '100%',
        height: '100%'
    });
}