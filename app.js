var express = require('express');
var app = express();
var twilio = require("twilio");

app.get('/', function (req, res) {
  res.send('Hello World!');
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

