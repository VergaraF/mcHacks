var TWILIO_PHONE_NUMBER = '+14387937502';
var AUTH_TOKEN = "SKece7326768e8fe25af56bc6cb827ef4d";
var SECRET = "QHpqDcBvmtOz2LX6NXwqEMsp2Q2go54y";

var express = require('express');
var bodyParser = require('body-parser');
var twilio = require('twilio')(AUTH_TOKEN, SECRET);

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));



app.get('/', function (req, res) {
  res.send(twilio);
});

// Webhook for twilio
// app.post('/sms', twilio.webhook(), function(request, response) {
// 	// Get message
// 	var twilioMsg = request.body.Body;
// 	var toPhoneNumber; // get this from the twilioMsg

// 	// Parse message

// 	// Call tripadvisior api

// 	// get information from trip advisor
// 	var tripAdvisorData;

// 	// parse info into the text message

// 	// send text message
// 	var textMsg = "Hey, this is the text message part";

// 	//Send an SMS text message
// 	twilio.sms.messages.post({
//     	to: toPhoneNumber,
//     	from: TWILIO_PHONE_NUMBER,
//     	body: textMsg
// 	}, function(err, text) {
//     	console.log('You sent: '+ text.body);
//     	console.log('Current status of this text message is: '+ text.status);
// 	});
// });

app.post('/sms', twilio.webhook({
    host:'http://smsme2.us-east-1.elasticbeanstalk.com '
}), function(request, response) {
    var twiml = new twilio.TwimlResponse();
    twiml.message('This HTTP request came from Twilio!');
    response.send(twiml);
});


app.listen(3000);

