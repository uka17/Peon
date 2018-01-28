// routes/job_routes.js
var mongo = require('mongodb');
const user = "test";

module.exports = function(app, client) {
  app.get('/jobs', (req, res) => {
    //get all jobs
    const where = {  };
    client.db('peon').collection('job').find(where).toArray(function(err, result) {
      if (err) {
        res.status(501).send({error: "Not able to process"});
      } else {        
        res.status(200).send(result);
      } 
    });
});
  app.get('/jobs/:id', (req, res) => {
    //get job by id
    const where = { '_id': new mongo.ObjectID(req.params.id) };
    client.db('peon').collection('job').findOne(where, (err, item) => {
      if (err) {
        res.status(501).send({error: "Not able to process"});
      } else {
        res.status(200).send(item);
      } 
    });
  });
  app.post('/jobs', (req, res) => {
    //create new job
    const job = req.body;
    job.createdOn = Date.now();
    job.createdBy = user;
    job.modifiedOn = Date.now();
    job.modifiedBy = user;

    client.db('peon').collection('job').insert(job, (err, result) => {
      if (err) { 
        res.status(501).send({error: "Not able to process"});
      } else {
        res.status(201).send(result.ops[0]);
      }
    });
  });
  app.post('/jobs/:id', (req, res) => {
    res.sendStatus(405);
  });
  app.put('/jobs', (req, res) => {
    //res.send(res.result.nModified + " item(s) updated");
    //bulk jobs update
  });
  app.put('/jobs/:id', (req, res) => {
    //update job by _id
    const where = { '_id': new mongo.ObjectID(req.params.id) };
    const newvalues = req.body;
    newvalues.modifiedOn = Date.now();
    newvalues.modifiedBy = user;
    const update = { $set: newvalues};

    client.db('peon').collection('job').updateOne(where, update, (err, result) => {
      if (err) {
        res.status(501).send({error: "Not able to process"});
      } else {
        res.status(200).send({itemsDeleted: result.result.nModified})
      } 
    });
  });
  app.delete('/jobs/:id', (req, res) => {
    //delete job by _id
    const where = { '_id': new mongo.ObjectID(req.params.id) };
    client.db('peon').collection('job').deleteOne(where, (err, result) => {
      if (err) {
        res.status(501).send({error: "Not able to process"});
      } else {
        res.status(200).send({itemsDeleted: result.result.n})
      } 
    });
  });    
};
//TODO
//errors handling
//user handling