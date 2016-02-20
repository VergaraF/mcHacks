var express = require('express');
var app = express();
var twilio = require("twilio");

app.get('/', function (req, res) {
  res.send('Hello World!');
});


// Twilio Credentials 
var accountSid = 'SK219d41bdd1bf03f95450886935f0d447'; 
var authToken = 'ILTAd79M9fOv5PSokVnY33EGmUOWhfOb'; 
 
//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken); 
 
client.messages.create({ 
    to: "+15142913224", 
    from: "+14387937806", 
    body: "Hey Jenny! Good luck on the bar exam!",
}, function(err, message) { 
    console.log(message.sid); 
});


// Webhook for twilio
app.post('/sms', twilio.webhook(), function(request, response) {
	// Get message
	var twilio_msg = request.body.Body;
	// Parse message

	// Call tripadvisior api

	// get information from trip advisor

	// parse info into the text message

	// send text message
});

app.listen(3000, function () {
  
});

