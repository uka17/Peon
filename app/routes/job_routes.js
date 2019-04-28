// routes/job_routes.js
var mongo = require('mongodb');
var utools = require('../tools/utools');
var validation = require('../tools/validations');
const config = require('../../config/config');
const messageBox = require('../../config/message_labels');
var schedulator = require('schedulator');
var ver = '/v1.0';

module.exports = function(app, dbclient) {
  app.get(ver + '/jobs/count', (req, res) => {
    //get jobs count
    try {
      dbclient.db(config.db_name).collection('job').countDocuments(req.body, function(err, count) {
        /* istanbul ignore if */
        if (err) {        
          utools.handleServerException(err, config.user, dbclient, res);
        } 
        else {        
          let resObject = {};
          resObject[messageBox.common.count] = count;
          res.status(200).send(resObject);
        } 
      });
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });
  app.get(ver + '/jobs', (req, res) => {
    //get all jobs
    try {
      dbclient.db(config.db_name).collection('job').find(req.body).toArray(function(err, result) {
        /* istanbul ignore if */
        if (err) {
          utools.handleServerException(err, config.user, dbclient, res);
        } else {        
          res.status(200).send(result);
        } 
      });
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });
  app.get(ver + '/jobs/:id', (req, res) => {    
    //get job by id
    try {
      const where = { '_id': new mongo.ObjectID(req.params.id) };
      dbclient.db(config.db_name).collection('job').findOne(where, (err, item) => {
        /* istanbul ignore if */
        if (err) {
          utools.handleServerException(err, config.user, dbclient, res);
        } else {
          res.status(200).send(item);
        } 
      });
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });
  app.post(ver + '/jobs', (req, res) => {
    //create new job
    try {
      const job = req.body;
      let validationSequence = ['job', 'steps', 'schedules', 'notifications'];
      let jobValidationResult;
      for(i=0; i < validationSequence.length; i++) {        
        switch(validationSequence[i]) {
          case 'job':
            jobValidationResult = validation.validateJob(job);     
            break;
          case 'steps':
            jobValidationResult = validation.validateStepList(job.steps)
            break;
          case 'schedules':  
            jobValidationResult.isValid = {"isValid": true};        
            if(job.schedules) {
              for (let i = 0; i < job.schedules.length; i++) {
                let nextRun = schedulator.nextOccurrence(job.schedules[i]);
                if(nextRun.result == null) {
                  jobValidationResult.isValid = false;
                  jobValidationResult.errorList = nextRun.error;
                  break;
                }
              }
            }
            break;
          case 'notifications':
            //TODO validation for notification
            //jobValidationResult = validation.validateStepList(job.steps)
            break;            
        }
        if(!jobValidationResult.isValid)
          break;
      }

      if(!jobValidationResult.isValid)
        res.status(400).send({"requestValidationErrors": jobValidationResult.errorList});
      else {
        job.createdOn = utools.getDateTime();     
        job.createdBy = config.user;       
        job.modifiedOn = utools.getDateTime();    
        job.modifiedBy = config.user;

        dbclient.db(config.db_name).collection('job').insertOne(job, (err, result) => {
          /* istanbul ignore if */
          if (err) { 
            utools.handleServerException(err, config.user, dbclient, res);
          } else {
            res.status(201).send(result.ops[0]);
          }
        });
      }
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });

  app.post(ver + '/jobs/:id', (req, res) => {
    res.sendStatus(405);
  });
  
  app.patch(ver + '/jobs/:id', (req, res) => {
    //update job by id
    try {
      var job = req.body;      
      job.modifiedOn = utools.getDateTime();
      job.modifiedBy = config.user;      

      const where = { '_id': new mongo.ObjectID(req.params.id) };      
      const update = { $set: job};

      dbclient.db(config.db_name).collection('job').updateOne(where, update, (err, result) => {
        /* istanbul ignore if */
        if (err) {
          utools.handleServerException(err, config.user, dbclient, res);
        } else {
          let resObject = {};
          resObject[messageBox.common.updated] = result.result.n;
          res.status(200).send(resObject);
        } 
      });
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });
  app.delete(ver + '/jobs/:id', (req, res) => {
    //delete job by _id
    try {
      const where = { '_id': new mongo.ObjectID(req.params.id) };
      dbclient.db(config.db_name).collection('job').deleteOne(where, (err, result) => {
        /* istanbul ignore if */
        if (err) {
          utools.handleServerException(err, config.user, dbclient, res);
        } else {
          let resObject = {};
          resObject[messageBox.common.deleted] = result.result.n;
          res.status(200).send(resObject);          
        } 
      });
    }
    catch(e) {
      /* istanbul ignore next */
      utools.handleServerException(e, config.user, dbclient, res);
    }
  });    
};
//TODO
//user handling
//selectors for job list - protect from injection