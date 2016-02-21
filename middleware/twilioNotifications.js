var twilioClient = require('../twilioClient');
var fs = require('fs');
var admins = require('../config/administrators.json');

function formatMessage(errorToReport) {
  return '[This is a test] ALERT! It appears the server is' +
    'having issues. Exception: ' + errorToReport;
};

exports.notifyOnError = function(appError, request, response, next) {
  admins.forEach(function(admin) {
    var messageToSend = "Hey this is a test msg";
    twilioClient.sendSms(admins[0].phoneNumber, messageToSend);
  });
  next(appError);
};
