var SunCalc = require('suncalc');
var request = require('request');


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
  return  "[out:json][timeout:25];(" + 
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
 * @param query - finalize url formatting to make API call, used inside getHeight()
 * */
var apiCall = function(query) {
  var url = "http://overpass-api.de/api/interpreter?data="
  return url + query;
}


// initialize variables to store callbacks
var nodeList = new Object();

/*
 * MAIN DRIVER:
 * Collect height of all nodes.ways in a designated block
 * */
var getHeight = function(A, B) {
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
          nodeList[nodeId] = body['elements'][i]['tags']['height'];
        }
      }
      getPoints(nodeBlock);
    } else {
      console.log('getHeight() failed');
    }
  });
}

var cordList = new Object();
/*
 * Overpass API request can't handle more than a certain number of nodes, so keep it small!
 * Outputs nodeIds and their corresponding latitude/longitude
 * @param nodeBlock - correctly formated QL code to get nodes from Overpass API
 * */
var getPoints = function(nodeBlock) {
  request(apiCall(getQuery(nodeBlock)), function(err, res, body) {
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      for (var i = 0; i < body['elements'].length; i++) {
        nodeId = body['elements'][i]['id'];
        cordList[nodeId] = ('' + body['elements'][i]['lat'] + ',' + body['elements'][i]['lon'] + '');
      }
      getShadow();
    } else {
      console.log('getPoints() failed: rectangle sized too big');
    }
  });
}


/*
 * simple Pythagorean theorem to get shadow length
 */
var getShadowLength = function(buildingHeight, sunAltitude) {
  return buildingHeight / Math.tan(sunAltitude);
}

var shadowList = new Object();
/*
 * Calculates the shadow lenght of each building depending on sun's altitude at that time
 * */
var getShadow = function() {
  var firstKey = Object.keys(cordList)[0];
  var str = cordList[firstKey].split(',');
  //var tempDate = 'Mon May 25 2015 09:50:04 GMT-0700 (PDT)' // REPLACE TEMP WITH new Date() WHEN SUN IS UP!!!!!
  var position = SunCalc.getPosition(new Date(), str[0], str[1]);
  /*
  var times = SunCalc.getTimes(new Date, str[0], str[1]);
  if (new Date() > times.sunset || new Date() < times.sunrise) {
    console.log("This app only works when the sun is up, yo!")
  } else {
    for (key in cordList) {
      console.log(nodeList[key]);
      shadowList[key] = getShadowLength(nodeList[key], position.altitude);
    }
    console.log(shadowList);
  }
  UNCOMMENT THIS AFTER DEMO AND PEOPLE CAN'T USE IT AT NIGHT ANYMORE
  */

  // REMEMBER TO TEST WHEN THE SUN IS UP
  for (key in cordList) {
    shadowList[key] = getShadowLength(nodeList[key], position.altitude);
  }
  console.log(shadowList);
}




// sample points to build path around
// (40.731847, -73.997396) - Washington Square Park coordinates
// (40.749045, -74.004902) - the High Line
var A = "40.739847, -73.999396";
var B = "40.740045, -74.000902";

getHeight(A, B);

























