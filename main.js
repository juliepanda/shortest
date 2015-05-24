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
    console.log(JSON.parse(body).nodes) // Show the HTML for the Google homepage.
  }
});












