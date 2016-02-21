//var APPLICATION_SID = 'PN85796b5ebbeb36f057ff3f7d5332f980';
var ACCOUNT_SID = 'AC336fb1664da1a7d3de5cbcf4bbe5ba3a';
var AUTH_TOKEN = '30b201bfe0053ca9884a9c891463c871';
var TWILIO_PHONE = '+14387937806';
var TEST_PHONE = '+15142913224';

var express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    path = require('path'),
    twilio = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

//var tripAdvisor = require('tripadv');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

// Twilio request authentication with custom URL
app.post('/sms', function(req, res) {
	var message = req.body.Body;
    twilio.sendMessage({
	    to: TEST_PHONE, 
	    from: TWILIO_PHONE, 
	    body: message
	}, function(err, responseData) { 

	    if (!err) {
	        console.log(responseData.from); 
	        console.log(responseData.body); 
	    }
	});
	res.type('text/xml');
	res.send(req.body.Body);
});


// Twilio request authentication with custom URL
app.post('/getstarted', function(req, res) {
	var phoneNumber = req.body.telephone;
	if (phoneNumber) {
		var message = "Hey! How are you? I want to thank you for using the service. If you can use the command help to get started."
	    twilio.sendMessage({
		    to: TEST_PHONE, 
		    from: TWILIO_PHONE, 
		    body: message
		}, function(err, responseData) { 
			res.send(req.body.Body);
				    if (!err) {
				        console.log(responseData.from); 
				        console.log(responseData.body); 
				    }
				});
	   	res.redirect('/');
	}
	res.type('text/xml');
	res.send(req.body.Body);
});


// Start an HTTP server with this Express app
app.listen(process.env.PORT || 3000);