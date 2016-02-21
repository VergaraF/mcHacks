var express = require('express');
var app = express();
//var twilio = require("twilio");
var request = require("request");


var nominatimKey   = "IsgDCmUVcbopSLN9PI1GGAeGDmNAnZrT";
var tripAdvisorKey = "6DB6633295E242028B9237D14411A773";



//app.get('/', function (req, res) {
//  res.send('Hello World!');
//});

// Webhook for twilio
//app.post('/sms', twilio.webhook(), function(request, response) {
    // Get message
 //   var twilio_msg = request.body.Body;
    // Parse message

    
    // Call tripadvisior api

//})

    var location = "jarry+montreal";    // PASS TROUGHT USER SEARCH
    var searchTerm = "pizza";
    var searchLocationType = 'restaurants';
    var returnMessage = ""; 


    // SEARCH FOR PLACES BASED ON INPUTED LOCATION
    // parse info into the text message
    var url = 'http://open.mapquestapi.com/nominatim/v1/search.php?key=' + nominatimKey + '&format=json&q=' + location; 
    console.log(url);
    request({
        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            var obj = JSON.stringify(body);
            var parsedData = JSON.parse(obj);
            var latLon = parsedData[0].lat + "," + parsedData[0].lon;

            // get information from trip advisor
            url = "https://api.tripadvisor.com/api/partner/2.0/search/" + searchTerm + "?key=" + tripAdvisorKey + "&map=" + latLon + "&category=" + searchLocationType;

            request({
                url: url,
                json: true
            }, function (error, response, body) {

            if (!error && response.statusCode === 200) {

                var obj = JSON.stringify(body);
                var parsedData = JSON.parse(obj);
                var evalStatement = 'returnMessage += (i + 1) +  "- " + parsedData.' + searchLocationType + '[i].name + " (ID: " + parsedData.' + searchLocationType + '[i].location_id + ") ";'
                var tempText

                for(i = 0; i < 3; i++) {
                    //returnMessage += (i + 1) +  "- " + parsedData.restaurants[i].name + " (ID: " + parsedData.restaurants[i].location_id + ") ";
                    eval(evalStatement);
                }

                returnMessage += 'TextBack: "LookUp + ID" to get ' + searchLocationType + ' address';

                console.log(returnMessage);        
            }

            });
        }

    });


    // LOOKUP TO SEARCH A LOCATION BASED ON PROVIDED ID
    // parse info into the text message
    var locationID = 5801891;
    url = "http://api.tripadvisor.com/api/partner/2.0/location/" + locationID + "?key=" + tripAdvisorKey;

    request({
        url: url,
        json: true
    }, function (error, response, body) {

    if (!error && response.statusCode === 200) {

        var obj = JSON.stringify(body);
        var parsedData = JSON.parse(obj);
        returnMessage = parsedData.name + " is located at " + parsedData.address_obj.street1;
        console.log(returnMessage);        
    }

    });

    

    

    // send text message


app.listen(3000, function () {
  
});

