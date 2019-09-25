/* eslint-disable no-undef */
//util unit tests
var chai  = require('chai');
chai.use(require('chai-datetime'));
var assert  = chai.assert;

var util = require('../../app/tools/util');
const request = require("supertest");
var ver = '/v1.0';
var ut_routes = require('../../app/routes/ut_routes');
const app = util.expressInstance();
let config = require('../../config/config');

const dbclient = require("../../app/tools/db");
ut_routes(app);
//temporary disable debug output due to have clear test output
config.enableDebugOutput = false;

describe('util', function() {
  describe('1 errors handling', function() {
    it('1.1 handleUserException', function(done) {            
      request(app)
        .get(ver + '/handleUserException')            
        .end(function(err, res) { 
          assert.equal(res.status, 400);
          assert.include(res.body.error, 'error_message');
          done();
        });              
    });
    it('1.2 logServerError. No user', async function() {            
      let logId = await util.logServerError(new Error('dummy'));
      assert.isNumber(logId);
    });
    it('1.3 logServerError. User=1', async function() {            
      let logId = await util.logServerError(new Error('dummy'), 1);
      assert.isNumber(logId);
    });
  });
    
  describe('2 expressInstance', function() {
    it('2.1 isObject ', function(done) {            
      let expr = util.expressInstance();
      assert.equal(typeof expr._router, 'function');
      done();
    });
  });

  describe('3 DB', function() {
    it('3.1 executeSysQuery. No callback, return Promis ', async function() {            
      let db = dbclient.query({text: "SELECT now()"});
      let result = await db;
      assert.equalDate(result.rows[0].now, new Date());
    });
    it('3.2 executeUserQuery. No connection string, return null ', function(done) {            
      let db = dbclient.userQuery({text: "SELECT now()"});
      assert.isNull(db);
      done();
    });        
    
  });

  describe('4 small tools and helpers', function() {
    it('4.1 getDateTime ', function(done) {            
      assert.equalDate(util.getDateTime(), new Date());
      assert.equalTime(util.getDateTime(), new Date());
      done();
    });       
            
    it('4.2 getMinDateTime ', function(done) {
      let dateTimeArray = ["2018-121-31T20:54:23.071Z", "2018-12-30T20:54:23.071Z", "2015-01-31T20:54:23.071Z", "2023-01-31T20:54:23.071Z"];            
      let correctResult = util.parseDateTime("2015-01-31T20:54:23.071Z");
      assert.equalDate(util.getMinDateTime(dateTimeArray), correctResult);
      assert.equalTime(util.getMinDateTime(dateTimeArray), correctResult);
      done();
    });       
       
    it('4.3 renameProperty', function(done) {
      let expected = {new_name: 'obj_name', val: 1};
      let initial = {name: 'obj_name', val: 1};
      assert.equal(util.renameProperty(initial, 'name', 'new_name').toString(), expected.toString());
      done();
    });            
  });
});    
