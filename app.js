//var APPLICATION_SID = 'PN85796b5ebbeb36f057ff3f7d5332f980';
var ACCOUNT_SID = 'AC332a4111136723617783087ad398967d';
var AUTH_TOKEN = '2fd2fe7642db69b49ab773a30feb950a';
var TWILIO_PHONE = '+14387937502';
var TEST_PHONE = '+15149534295';

var NOMINATIM_KEY   = "IsgDCmUVcbopSLN9PI1GGAeGDmNAnZrT";
var TRIPADVISOR_KEY = "6DB6633295E242028B9237D14411A773";



var express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    path = require('path'),
    twilio = require('twilio')(ACCOUNT_SID, AUTH_TOKEN),
    request = require("request");

//var tripAdvisor = require('tripadv');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

// Twilio request authentication with custom URL
app.post('/sms', function(req, res) {
	var message = req.body.Body;



    // COMMAND PARSER
    var evalString = message.toLowerCase(); 

    if(evalString.search("help") != -1) {

        // SEND BACK HELP COMMANDS
        var helpCommands = "Welcome to SMSME \n Here is a commands to get started: \n Find Me (foodChoice) Near (Address) In (City) ";
        twilio.sendMessage({
            to: TEST_PHONE, 
            from: TWILIO_PHONE, 
            body: helpCommands
            }, function(err, responseData) { 

                if (!err) {
                    console.log(responseData.from); 
                    console.log(responseData.body); 
                }
            });

            res.type('text/xml');
            res.send(req.body.Body);

        // console.log("SEND HELP INFO");
    }

    else if(evalString.search("near") == -1) {
        var evalLoc = evalString.match("me (.*)");
        var locationID = evalLoc[1].split(" ");

        var outputMessage = "";

    
        url = "http://api.tripadvisor.com/api/partner/2.0/location/" + locationID + "?key=" + TRIPADVISOR_KEY;

        request({
            url: url,
            json: true
        }, function (error, response, body) {


        if (!error && response.statusCode === 200) {

            var obj = JSON.stringify(body);
            var parsedData = JSON.parse(obj);
            outputMessage = parsedData.name + " is located at " + parsedData.address_obj.street1;

            // ADD SENDING TEXT PART

            twilio.sendMessage({
		    to: TEST_PHONE, 
		    from: TWILIO_PHONE, 
		    body: outputMessage
			}, function(err, responseData) { 

			    if (!err) {
			        console.log(responseData.from); 
			        console.log(responseData.body); 
			    }
			});

			res.type('text/xml');
			res.send(req.body.Body);
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

                    twilio.sendMessage({
                    to: TEST_PHONE, 
                    from: TWILIO_PHONE, 
                    body: outputMessage
                    }, function(err, responseData) { 

                        if (!err) {
                            console.log(responseData.from); 
                            console.log(responseData.body); 
                        }
                    });

                    res.type('text/xml');
                    res.send(req.body.Body);


                }

                });
            }


        });
     

    }






 //    twilio.sendMessage({
	//     to: TEST_PHONE, 
	//     from: TWILIO_PHONE, 
	//     body: message
	// }, function(err, responseData) { 

	//     if (!err) {
	//         console.log(responseData.from); 
	//         console.log(responseData.body); 
	//     }
	// });
	// res.type('text/xml');
	// res.send(req.body.Body);
});

// Start an HTTP server with this Express app
app.listen(process.env.PORT || 3000);