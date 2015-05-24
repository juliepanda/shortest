var SunCalc = require('suncalc');
var request = require('request');

var sunPos = SunCalc.getPosition(new Date(), 37.0000, -120.0000);
console.log(sunPos);

var buildingHeight = 10; // in meters
var shadowLen = buildingHeight / Math.tan(sunPos.altitude);

console.log('shadow length', shadowLen, 'meters\n');

var url = "http://overpass-api.de/api/interpreter?data="

var query = "[out:json][timeout:25];(node[%22height%22][%22building%22](40.76,-74.0,40.77,-73.99);way[%22height%22][%22building%22](40.76,-74.0,40.77,-73.99);relation[%22height%22][%22building%22](40.76,-74.0,40.77,-73.99););out;"

var fullUrl = url + query;


request(fullUrl, function(err, res, body) {
  if (!err && res.statusCode == 200) {
    body = JSON.parse(body);
    for (var i = 0; i < body['elements'].length; i++){
      console.log('index', i);
      console.log(JSON.stringify(body['elements'][i]['tags']['height']) + '\n');
      //console.log(JSON.stringify(body['elements'][i]['tags']['building']));
     // console.log(JSON.stringify(body['elements'][i]['tags']['height']));
    }
  }
});












