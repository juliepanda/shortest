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

/*
 * MAIN DRIVER:
 * Collect height of all nodes.ways in a designated block
 * */
var fetchHeight = function(A, B) {
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
      fetchNodes(nodeBlock);
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
var fetchNodes = function(nodeBlock) {
  request(apiCall(getQuery(nodeBlock)), function(err, res, body) {
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      for (var i = 0; i < body['elements'].length; i++) {
        nodeId = body['elements'][i]['id'];
        cordList[nodeId] = ('' + body['elements'][i]['lat'] + ',' + body['elements'][i]['lon'] + '');
      }
      getShadow();
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
var getShadow = function() {
  console.log(cordList)
  var firstKey = Object.keys(cordList)[0];
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

  // REMEMBER TO TEST WHEN THE SUN IS UP
  for (key in cordList) {
    shadowList[key] = getShadowLength(heightList[key], position.altitude);
  }
  console.log(shadowList);
}



// sample points to build path around
// (40.731847, -73.997396) - Washington Square Park coordinates
// (40.749045, -74.004902) - the High Line
var A = "40.739847,-73.999396";
var B = "40.740045,-74.000902";

//fetchHeight(A, B);
//
//
//
var url = 'https://maps.googleapis.com/maps/api/directions/json?';
var origin = function(src) { return 'origin=' + src; }
var destination = function(dest) { return 'destination='+ dest; }
var mode = function(m) { return 'mode=' + m; }
var alternative = function(alt) { return 'alternative=' + alt; }


urlwalk = url + origin("40.730847,-73.990396") + '&' + destination("40.740045,-74.000902") + '&' + mode('walking') + '&' + alternative('true') + '&' + API_KEY;

urldrive = url + origin("40.730847,-73.990396") + '&' + destination("40.740045,-74.000902") + '&' + mode('driving') + '&' + alternative('true') + '&' + API_KEY;

urlbike = url + origin("40.730847,-73.990396") + '&' + destination("40.740045,-74.000902") + '&' + mode('bicycling') + '&' + alternative('true') + '&' + API_KEY;


var requestWalk = function(urlwalk) {
  request(urlwalk, function(err, res, body) {
    if (!err) {
      body = JSON.parse(body);
      console.log(body.routes[0].legs[0].steps[0]);
      //requestDrive(urldrive);
    } else {
      console.log('urlwalk didnt work');
    }
  })
}

var requestDrive = function(urldrive) {
  request(urldrive, function(err, res, body) {
    if (!err) {
      //console.log(body);
      requestBike(urlbike);
    } else {
      console.log('urldrive route didnt work');
    }
  })
}

var requestBike = function(urlbike) {
  request(urlbike, function(err, res, body) {
    if (!err) {
      console.log(body);
    } else {
      console.log('urlbike route didnt work');
    }
  })
}


requestWalk(urlwalk);



















