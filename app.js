var APPLICATION_SID = 'PN85796b5ebbeb36f057ff3f7d5332f980';
var ACCOUNT_SID = 'AC332a4111136723617783087ad398967d';
var AUTH_TOKEN = '2fd2fe7642db69b49ab773a30feb950a';
var TWILIO_PHONE = '+14387937502';
var TEST_PHONE = '+15149534295';

var express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    path = require('path'),
    twilio = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

// Twilio request authentication with custom URL
app.post('/sms', function(req, res) {
	 var options = { url: 'http://smsme2.us-east-1.elasticbeanstalk.com/sms'};
    if (twilio.validateExpressRequest(req, AUTH_TOKEN, options)) {
        client.sendMessage({
		    to: TEST_PHONE, 
		    from: TWILIO_PHONE, 
		    body: "Hello World " + req.Body 
		}, function(err, responseData) { 

		    if (!err) {
		        console.log(responseData.from); 
		        console.log(responseData.body); 
		    }
		});
		
		res.type('text/xml');
		res.send('Something worked!!');
    } else {
        res.status(403).send('you are not twilio. Buzz off.');
    }
});

// Start an HTTP server with this Express app
app.listen(process.env.PORT || 3000);