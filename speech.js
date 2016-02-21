#!/usr/bin/env node

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
        'Is Javascript a Functional Programming Language?');

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
    }).pipe(fs.createWriteStream('speech.wav'));
});
