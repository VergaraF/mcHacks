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

//var tripAdvisor = require('./tripadv.js');

//var speech = require('./speech.js');

var app = express();

app.use(express.static(__dirname + '/music'));

app.use(bodyParser.urlencoded({
    extended: true
}));

// Twilio request authentication with custom URL
app.post('/sms', function(req, res) {
	//var message = req.body.Body;
	var message = req.body.Body;

	//create speech.wav file 
	//var speech = speech.gotPost(message).pipe(fs.createWriteStream('speech.wav'));;
/*client.makeCall({

    to:TEST_PHONE, // Any number Twilio can call
    from: TWILIO_PHONE, // A number you bought from Twilio and can use for outbound communication
    url: 'http://www.example.com/twiml.php' // A URL that produces an XML document (TwiML) which contains instructions for the call

}, function(err, responseData) {

    //executed when the call has been initiated.
    console.log(responseData.from); // outputs "+14506667788"

});*/

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

  	var got  = require('got'),
    util = require('util'),
    fs   = require('fs'),
    SSML_TPL = '<speak version="1.0" xml:lang="en-us">' +
                 '<voice xml:lang="%s" xml:gender="%s" name="%s">%s</voice>' +
              '</speak>',
    CLIENT_ID    = 'SMSMe',
    SUBSCRIPTION = 'e5cf7aaa62a2488596b556e9778f041b';

var tokenParams = [
    'grant_type=client_credentials',
    'client_id=' + CLIENT_ID,
    'client_secret=' + encodeURIComponent(SUBSCRIPTION),
    'scope=' + encodeURI('https://speech.platform.bing.com')
].join('&');


    got.post('https://oxford-speech.cloudapp.net:443/token/issueToken', {
      json: true,
      headers: {
         'content-type': 'application/x-www-form-urlencoded',
         'Content-Length': tokenParams.length
      },
      body: tokenParams
    }, function(err, res) {
        if (err) { throw 'Code:  ' + err.code + '\nError: ' + err.message; }

        var data = util.format(SSML_TPL,
          'en-US',
          'Male',
          'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)',
          message);

        console.log('---- Oxford Access Token -----------------------------------');
        console.log(res.access_token);
       console.log('------------------------------------------------------------');

      //
      // Now we can invoke the Text-To-Speech API passing in some text to be 
      // converted. Take note of all the headers! We need to include the
      // Oxford Access Token in the Authorization header on every request:
      //
      

      
      got.post('https://speech.platform.bing.com:443/synthesize', {
          headers: {
              'content-type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
              'Authorization': 'Bearer ' + res.access_token,
              'X-Search-AppId': '07D3234E49CE426DAA29772419F436CA',
              'X-Search-ClientID': '1ECFAE91408841A480F00935DC390960',
              'User-Agent': 'TTSNodeJS',
              'Transfer-Encoding': 'chunked'
          },
          body: data
      }).pipe(fs.createWriteStream('./music/speech.wav'));
      console.log('speech.wav file created3');
  });



//	var twiml = new twilio.TwimlResponse();

//	console.log()

   // twiml.play('./speech.wav');


//twiml.play('./music/speech.wav');*/

	res.type('text/xml');
	//res.send('./speech.wav')
	res.send(req.body.Body);
});

// Start an HTTP server with this Express app
app.listen(process.env.PORT || 3000);