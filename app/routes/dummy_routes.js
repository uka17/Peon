// routes/dummy_routes.js
var utools = require('../tools/utools');
const config = require('../../config/config');
var validation = require('../tools/validations');
var ver = '/v1.0';
var testData = require('../../test/test_data');
var messageBox = require('../../config/message_labels');

module.exports = function(app, dbclient) {
  app.get(ver + '/dummy', (req, res) => {
    //dummy
    try {         
      //res.status(200).send({result: validation.dateTimeIsValid('2015-aa-25T12:00:00Z')});
      res.status(200).send({result: 1});
    }
    catch(e) {
      res.status(500).send({error: e.message});
    }
  });  
  app.get('/', (req, res) => {
    //get jobs count
    try {
      dbclient.db(config.db_name).collection('job').countDocuments(req.body, function(err, count) {
        /* istanbul ignore if */
        if (err) {        
          utools.handleServerException(err, config.user, dbclient, res);
        } 
        else {        
          let resObject = {};
          resObject['Greeting:'] = 'Welcome, comrade!';
          resObject['Jobs:'] = count;
          resObject['Deploy status:'] = 'Ok';
          res.status(200).send(resObject);
        } 
      });
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });     
}