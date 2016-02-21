var admins = require('../config/administrators.json');
var twilioClient = require('../twilioClient');

// Map routes to controller functions
module.exports = function(router) {
  router.get('/error', function(req, resp) {
    throw new Error('Derp. An error occurred.');
  });

  router.post('/sms', twilio.webhook(), function(req, resp) {
  	
  	twilioClient.sendSms(admins[0].phoneNumber, messageToSend);
  });

};

