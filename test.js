var gm = require('googlemaps');
var util = require('util');
/*
gm.reverseGeocode('41.850033,-87.6500523', function(err, data){
  console.log(JSON.stringify(data));
});
*/

var googUrl = "https://maps.googleapis.com/maps/api/staticmap?";



markers = [
    { 'location': '300 W Main St Lock Haven, PA' },
    { 'location': '444 W Main St Lock Haven, PA',
        'color': 'red',
        'label': 'A',
        'shadow': 'false',
        'icon' : 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe%7C996600'
    }
]

styles = [
    { 'feature': 'road', 'element': 'all', 'rules': 
        { 'hue': '0x00ff00' }
    }
]

paths = [
    { 'color': '0x0000ff', 'weight': '5', 'points': 
        ["40.739847, -73.999396", "40.740045, -74.000902"]
    }
]


console.log(gm.staticMap('444 W Main St Lock Haven PA', 15, '500x400', false, false, 'roadmap', markers, styles, paths));



