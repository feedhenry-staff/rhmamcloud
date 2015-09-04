var Component = require("../Component");
var util = require("util");
var async = require("async");
var currentDebugUrl=null;
function Device() {
  Component.call(this, "device", {
    "liveInterval": 0,
    "debugUrl":"",
    "debugEnabled":false
  });
  var self = this;
  this.on("change_config", function() {
      self.initConfig();
  });
}
util.inherits(Device, Component);

Device.prototype.initConfig=function(){
    var cfg=this.getConfig();
    if (cfg.debugEnabled ==true && currentDebugUrl!=cfg.debugUrl && cfg.debugUrl){
      var script=document.createElement("script");
      script.src=cfg.debugUrl;
      var body=document.querySelector("body");
      body.appendChild(script);
      script.onload=script.onreadystatechange=function(){
        debugAlreadyEnabled=true;
      }
    }
}
Device.prototype.setIdentifier=function(identi){
  var fhParam=$fh.getFHParams();
  if (!fhParam.device){
    fhParam.device={};
  }
  fhParam.device.identifier=identi;
}



module.exports=new Device();
