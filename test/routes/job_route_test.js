var uniTest = require('./universal_route_test');
var jobRoute = require('../../app/routes/job_routes');
var jobTestObject = require('../test_data').jobOK;

uniTest.testApiRoute('/v1.0/jobs', jobRoute, jobTestObject, 'name', 'string', 'job');