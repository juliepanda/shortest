var SunCalc = require('suncalc');
var request = require('request');
var gm = require('googlemaps');
var util = require('util');


/*
 * get right inputs for formattingRect(), use lat/lon of A and B to contruct a box
 * */
var parseInput = function(A, B) {
  var arr_A = A.split(',');
  var arr_B = B.split(',');
  return arr_A.concat(arr_B);
}

/*
 * set coordinates area to get building data from Overpass
 * Adjust top/right increment values if not getting values in getPoint().
 * This usually means that the area selected is too large to process.
 * */
var formattingRect = function(bottom, left, top, right) {
  var tmp;
  if (bottom > top) { // make sure box is sound
    tmp = bottom;
    bottom = top;
    top = tmp;
  }
  if (left < right) {
    tmp = left;
    left = right;
    right = tmp;
  }

  var cords = "(" + bottom + "," + left + "," + top + "," + right + ");";
  return "[out:json][timeout:25];(" + 
    "node[%22height%22][%22building%22]" + cords + 
    "way[%22height%22][%22building%22]" + cords +
    "relation[%22height%22][%22building%22]" + cords +
    ");out;";

}

/*
 * QL formatting node id
 * @param id - unique node id for OpenStreetMap
 * */
var getNodeName = function(id) {
  return "node(" + id + ");";
}

/*
 * QL formatting for getting node, way, relations, and etc data before API call.
 * @param block - content of search
 * */
var getQuery = function(block){
  return "[out:json][timeout:25];(" + block + ");out;";
}


/*
 * @param query - finalize url formatting to make API call, used inside fetchHeight()
 * */
var apiCall = function(query) {
  var url = "http://overpass-api.de/api/interpreter?data="
  return url + query;
}

/*
 * Initialize variables to store callback values in the following formats:
 * heightList - (nodeId, buildingHeight)
 * cordList - (nodeId, 'latitude, longitude')
 * shadowList - (nodeId, shadowLength)
 * */
var heightList = new Object();
var shadowList = new Object();
var cordList = new Object();
var badnessList = new Object();
badnessList['walk'] = 0;
badnessList['drive'] = 0;
badnessList['bike'] = 0;


/*
 * MAIN DRIVER FOR GETTING BUILDING HEIGHT/SHADOW:
 * Collect height of all nodes.ways in a designated block
 * 3 types: walk, drive, bike
 * */
var fetchHeight = function(A, B, type) {
  var str = parseInput(A, B);
  var query = formattingRect(str[0], str[1], str[2], str[3]);
  request(apiCall(query), function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var nodeBlock = "";
      body = JSON.parse(body);
      for (var i = 0; i < body['elements'].length; i++){
        if (body['elements'][i]['nodes'] instanceof Array){
          //console.log('index', i);
          var nodeId = JSON.stringify(body['elements'][i]['nodes'][0])
          nodeBlock = nodeBlock + getNodeName(nodeId);
          heightList[nodeId] = body['elements'][i]['tags']['height'];
        }
      }
      fetchNodes(nodeBlock, type);
    } else {
      console.log('fetchHeight() failed');
    }
  });
}

/*
 * Overpass API request can't handle more than a certain number of nodes, so keep it small!
 * Outputs nodeIds and their corresponding latitude/longitude
 * @param nodeBlock - correctly formated QL code to get nodes from Overpass API
 * */
var fetchNodes = function(nodeBlock, type) {
  request(apiCall(getQuery(nodeBlock)), function(err, res, body) {
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      for (var i = 0; i < body['elements'].length; i++) {
        nodeId = body['elements'][i]['id'];
        cordList[nodeId] = ('' + body['elements'][i]['lat'] + ',' + body['elements'][i]['lon'] + '');
      }
      getShadow(type);
    } else {
      console.log('fetchNodes() failed: rectangle sized too big');
    }
  });
}


/*
 * simple Pythagorean theorem to get shadow length
 */
var getShadowLength = function(buildingHeight, sunAltitude) {
  return buildingHeight / Math.tan(sunAltitude);
}

/*
 * Calculates the shadow lenght of each building depending on sun's altitude at that time
 * */
var getShadow = function(type) {
  var badness = 0;
  var firstKey = Object.keys(cordList)[0];
  console.log(firstKey);
  var str = cordList[firstKey].split(',');
  var position = SunCalc.getPosition(new Date(), str[0], str[1]);
  /*
     var times = SunCalc.getTimes(new Date, str[0], str[1]);
     if (new Date() > times.sunset || new Date() < times.sunrise) {
     console.log("This app only works when the sun is up, yo!")
     } else {
     for (key in cordList) {
     console.log(heightList[key]);
     shadowList[key] = getShadowLength(heightList[key], position.altitude);
     }
     console.log(shadowList);
     }
     UNCOMMENT THIS AFTER DEMO AND PEOPLE CAN'T USE IT AT NIGHT ANYMORE
     */

  // DEMO USE ONLY CODE
  for (key in cordList) {
    shadowList[key] = getShadowLength(heightList[key], position.altitude);
    badnessList[type] = getShadowLength(heightList[key], position.altitude) + badnessList[type];
  }
  console.log(badnessList);
}


var url = 'https://maps.googleapis.com/maps/api/directions/json?';
var origin = function(src) { return 'origin=' + src; }
var destination = function(dest) { return 'destination='+ dest; }
var mode = function(m) { return 'mode=' + m; }
var alternative = function(alt) { return 'alternative=' + alt; }

var directionUrl = function(src, dest, travel) { 
  return url + origin(src) + '&' + destination(dest) + '&' + mode(travel) + '&' + API_KEY };

  var cordString = function(latitude, longitude) { return '' + latitude + ',' + longitude +'';}

  var requestWalk = function( url, A, B ) {
    request( url, function(err, res, body) {
      if (!err) {
        body = JSON.parse(body);
        var steps = body.routes[0].legs[0].steps;
        for (i=0; i< steps.length; i++) {
          if (i===0) {
            fetchHeight(A, cordString(steps[0].start_location.lat, steps[0].start_location.lng), 'walk');
          } else {
            var lat = steps[i].start_location.lat;
            var lon = steps[i].start_location.lng;
            var prevlat = steps[i-1].start_location.lat;
            var prevlon = steps[i-1].start_location.lng;
            fetchHeight(cordString(prevlat, prevlon), cordString(lat, lon), 'walk');
          }

        }
        requestDrive(directionUrl('driving'), A, B);
      } else {
        console.log('urlwalk didnt work');
      }
    })
  }

  var requestDrive = function( url, A, B ) {
    request(url, function(err, res, body) {
      if (!err) {
        //console.log(body);
        body = JSON.parse(body);
        var steps = body.routes[0].legs[0].steps;
        for (i=0; i< steps.length; i++) {
          if (i===0) {
            fetchHeight(A, cordString(steps[0].start_location.lat, steps[0].start_location.lng), 'drive');
          } else {
            var lat = steps[i].start_location.lat;
            var lon = steps[i].start_location.lng;
            var prevlat = steps[i-1].start_location.lat;
            var prevlon = steps[i-1].start_location.lng;
            fetchHeight(cordString(prevlat, prevlon), cordString(lat, lon), 'drive');
          }

        }
        requestBike(directionUrl('bicycling'), A, B);
      } else {
        console.log('urldrive route didnt work');
      }
    })
  }

  var requestBike = function(url, A, B) {
    request(url, function(err, res, body) {
      if (!err) {
        body = JSON.parse(body);
        var steps = body.routes[0].legs[0].steps;
        for (i=0; i< steps.length; i++) {
          if (i===0) {
            fetchHeight(A, cordString(steps[0].start_location.lat, steps[0].start_location.lng), 'bike');
          } else {
            var lat = steps[i].start_location.lat;
            var lon = steps[i].start_location.lng;
            var prevlat = steps[i-1].start_location.lat;
            var prevlon = steps[i-1].start_location.lng;
            fetchHeight(cordString(prevlat, prevlon), cordString(lat, lon), 'bike');
          }

        }
      } else {
        console.log('urlbike route didnt work');
      }
      determineBestPath();
    })
  }




// sample points to build path around
// (40.731847, -73.997396) - Washington Square Park coordinates
// (40.749045, -74.004902) - the High Line
var A = "40.739847,-73.999396";
var B = "40.740045,-74.000902";

  requestWalk(directionUrl(A, B, 'walking'), A, B);



















