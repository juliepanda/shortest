var SunCalc = require('suncalc');
var request = require('request');

var sunPos = SunCalc.getPosition(new Date(), 37.0000, -120.0000);
console.log(sunPos);

var buildingHeight = 10; // in meters
var shadowLen = buildingHeight / Math.tan(sunPos.altitude);

console.log('shadow length', shadowLen, 'meters\n');


var query = "[out:json][timeout:25];(node[%22height%22][%22building%22](40.769,-74.0,40.77,-73.99);way[%22height%22][%22building%22](40.769,-74.0,40.77,-73.99);relation[%22height%22][%22building%22](40.769,-74.0,40.77,-73.99););out;"




/*
 * QL formatting node id for Overpass API
 * @param id - unique node id for OpenStreetMap
 * */
var getNodeName = function(id) {
  return "node(" + id + ");";
}

/*
 * QL formatting for making API calls to Overpass API node, way, relations, and etc.
 * @param blcok - content of search
 * */
var getQuery = function(block){
  return "[out:json][timeout:25];(" + block + ");out;";
}


/*
 * @param query - finalize url formatting to make API call
 * */
var apiCall = function(query) {
  var url = "http://overpass-api.de/api/interpreter?data="
  return url + query;
}

var block = getNodeName(644184848) + getNodeName(3316656367);

// initialize variables to store callbacks
var nodeList = new Object();

var getHeight = function(query) {
  request(apiCall(query), function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var nodeBlock = "";
      body = JSON.parse(body);
      for (var i = 0; i < body['elements'].length; i++){
        if (body['elements'][i]['nodes'] instanceof Array){
          //console.log('index', i);
          var nodeId = JSON.stringify(body['elements'][i]['nodes'][0])
          nodeBlock = nodeBlock + getNodeName(nodeId);
          nodeList[nodeId] = body['elements'][i]['tags']['height'];
        }
      }
      //console.log(JSON.stringify(nodeList));
      //console.log(nodeBlock);
      getPoints(nodeBlock);
    } else {
      console.log('getHeight() failed');
    }
  });
}


/*
* Overpass API request can't handle more than a certain number of nodes, so keep it small
* */
var getPoints = function(nodeBlock) {
  request(apiCall(getQuery(nodeBlock)), function(err, res, body) {
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      for (var i = 0; i < body['elements'].length; i++) {
        console.log('index', i);
        console.log(body['elements'][i]['id'], body['elements'][i]['lat']);
      }
    } else {
      console.log('getPoints() failed');
    }
  });
}

getHeight(query);










