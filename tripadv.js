var express = require('express');
var app = express();
//var twilio = require("twilio");
var request = require("request");


var NOMINATIM_KEY   = "IsgDCmUVcbopSLN9PI1GGAeGDmNAnZrT";
var TRIPADVISOR_KEY = "6DB6633295E242028B9237D14411A773";



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

    // var location = "jarry+montreal";    // PASS TROUGHT USER SEARCH
    // var searchTerm = "pizza";
    // var searchLocationType = 'restaurants';


    // function getLocalSearch(location, searchTerm, searchLocationType, NOMINATIM_KEY , TRIPADVISOR_KEY) {


    //     // SEARCH FOR PLACES BASED ON INPUTED LOCATION
    //     // parse info into the text message
    //     var url = 'http://open.mapquestapi.com/nominatim/v1/search.php?key=' + NOMINATIM_KEY + '&format=json&q=' + location; 
    //     //console.log(url);
    //     request({
    //         url: url,
    //         json: true
    //     }, function (error, response, body) {

    //         if (!error && response.statusCode === 200) {
    //             var obj = JSON.stringify(body);
    //             var parsedData = JSON.parse(obj);
    //             var latLon = parsedData[0].lat + "," + parsedData[0].lon;
    //             // console.log(latLon);

    //             // get information from trip advisor
    //             url = "https://api.tripadvisor.com/api/partner/2.0/search/" + searchTerm + "?key=" + TRIPADVISOR_KEY + "&map=" + latLon + "&category=" + searchLocationType;
    //             //console.log(url);
    //             request({
    //                 url: url,
    //                 json: true
    //             }, function (error, response, body) {

    //             if (!error && response.statusCode === 200) {

    //                 var obj = JSON.stringify(body);
    //                 var parsedData = JSON.parse(obj);
    //                 var evalStatement = 'outputMessage += (i + 1) +  "- " + parsedData.' + searchLocationType + '[i].name + " (ID: " + parsedData.' + searchLocationType + '[i].location_id + ") ";'

    //                 for(i = 0; i < 3; i++) {
    //                     //outputMessage += (i + 1) +  "- " + parsedData.restaurants[i].name + " (ID: " + parsedData.restaurants[i].location_id + ") ";
    //                     eval(evalStatement);
    //                 }

    //                 outputMessage += 'TextBack: "LookUp + ID" to get ' + searchLocationType + ' address';     
    //                 // console.log("OUTPUT: " + outputMessage);  
    //                 //return outputMessage;
    //             }

    //             });
    //         }


    //     });

    //     return outputMessage;
    // }
    

    // function getAddressOnLocationID(locationID, TRIPADVISOR_KEY) {
    
    //     // LOOKUP TO SEARCH A LOCATION BASED ON PROVIDED ID
    //     // parse info into the text message
    //     var outputMessage = "text"; 

    //     url = "http://api.tripadvisor.com/api/partner/2.0/location/" + locationID + "?key=" + TRIPADVISOR_KEY;
    //     console.log(url);

    //     request({
    //         url: url,
    //         json: true
    //     }, function (error, response, body) {

    //     if (!error && response.statusCode === 200) {

    //         var obj = JSON.stringify(body);
    //         var parsedData = JSON.parse(obj);
    //         outputMessage = parsedData.name + " is located at " + parsedData.address_obj.street1;
    //         //console.log(outputMessage);
    //     }

    //     });

    //     return outputMessage;
    // }



    /***
    
        THIS PART GOES INTO APP.JS

    ***/


    // COMMAND PARSER
    var evalString = "Find me pizza Near 6644 Fielding In Montreal".toLowerCase();
    //var evalString = "Find me 5801891".toLowerCase();
    // var evalString = "HeLP!!!!!".toLowerCase();

    //var evalString = "HElp!".toLowerCase();
    if(evalString.search("help") != -1) {
        console.log("SEND HELP INFO");
    }

    else if(evalString.search("near") == -1) {
        var evalLoc = evalString.match("me (.*)");
        var locationID = evalLoc[1].split(" ");
        //console.log("="+locationID+"+");
        // console.log(getAddressOnLocationID(locationID[1], TRIPADVISOR_KEY));

        var outputMessage = "";

    
        url = "http://api.tripadvisor.com/api/partner/2.0/location/" + locationID + "?key=" + TRIPADVISOR_KEY;
        //console.log(url);

        request({
            url: url,
            json: true
        }, function (error, response, body) {


        if (!error && response.statusCode === 200) {

            var obj = JSON.stringify(body);
            var parsedData = JSON.parse(obj);
            outputMessage = parsedData.name + " is located at " + parsedData.address_obj.street1;
            console.log(outputMessage);
            // ADD SENDING TEXT PART

            
        }

        });

    }

    else {
        var searchTerm = evalString.match("me (.*) near");
        var address    = evalString.match("near (.*) in").toString().split(" ").join('+').split(",");
        var city       = evalString.match("in (.*)").toString().split(" ").join('+').split(",");
        var location   = address[1] + '+' + city[1];

        // console.log(location);

        var searchLocationType = "restaurants";

        // var text = getLocalSearch(location[1], searchTerm[1], "restaurants",  NOMINATIM_KEY, TRIPADVISOR_KEY);
        // console.log(text);

        var url = 'http://open.mapquestapi.com/nominatim/v1/search.php?key=' + NOMINATIM_KEY + '&format=json&q=' + location; 
        //console.log(url);
        request({
            url: url,
            json: true
        }, function (error, response, body) {

            if (!error && response.statusCode === 200) {
                var obj = JSON.stringify(body);
                var parsedData = JSON.parse(obj);
                var latLon = parsedData[0].lat + "," + parsedData[0].lon;
                var outputMessage = "";
                // console.log(latLon);

                // get information from trip advisor
                url = "https://api.tripadvisor.com/api/partner/2.0/search/" + searchTerm[1] + "?key=" + TRIPADVISOR_KEY + "&map=" + latLon + "&category=" + searchLocationType;
                console.log(url);
                request({
                    url: url,
                    json: true
                }, function (error, response, body) {

                if (!error && response.statusCode === 200) {

                    var obj = JSON.stringify(body);
                    var parsedData = JSON.parse(obj);
                    var evalStatement = 'outputMessage += (i + 1) +  "- " + parsedData.' + searchLocationType + '[i].name + " (ID: " + parsedData.' + searchLocationType + '[i].location_id + ") ";'

                    for(i = 0; i < 3; i++) {
                        //outputMessage += (i + 1) +  "- " + parsedData.restaurants[i].name + " (ID: " + parsedData.restaurants[i].location_id + ") ";
                        eval(evalStatement);
                    }

                    outputMessage += 'TextBack: "LookUp + ID" to get ' + searchLocationType + ' address';     
                    console.log(outputMessage);  
                   
                    

                    // ADD SENDING TEXT PART


                }

                });
            }


        });
     

    }


    

    
    

    

    // send text message


// app.listen(3000, function () {
  
// });

