var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var browserify=require("browserify");
var mbaasExpress = mbaasApi.mbaasExpress();
// list the endpoints which you want to make securable here
var securableEndpoints;
// fhlint-begin: securable-endpoints
securableEndpoints = ['/hello'];
// fhlint-end

var app = express();

var mw=require("./lib")("ykYglIhcYicugwxP5-B_dy1p"); //service id
app.use(mbaasExpress.fhmiddleware());
app.use(mw);
// Note: the order which we add middleware to Express here is important!
app.get("/hello",function(req,res){
  res.end("hello");
})
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

app.use(require("express").static(__dirname+"/demo_static"));

// Note: important that this is added just before your own Routes


// Important that this is last!
// app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8880;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var server = app.listen(port, host, function() {
  console.log("App started at: " + new Date() + " on port: http://127.0.0.1:" + port);
});
// models.Address.install(function() {
//   log.info("Address data being installed.");
// });
