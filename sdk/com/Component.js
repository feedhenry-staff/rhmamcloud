module.exports = Component;

var server = require("../server");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Component(comId, defCfg) {
  EventEmitter.call(this);
  this.comId = comId;
  this.prefKey = comId + "_mam_com_pref";
  this.defCfg = defCfg ? defCfg : {};
  var self = this;
  this.updateConfig(function(err) {
    if (err) {
      self.emit("error", new Error(err));
    } else {
      self.emit("ready");
    }
  });
}
util.inherits(Component, EventEmitter);
/**
Get configuration for the component for current device
*/
Component.prototype.getConfig = function() {
  var cfg = this.getPref("config");
  if (cfg) {
    return cfg;
  } else {
    return this.defCfg;
  }
}

/**
Run task
@param taskName
@param callback(err,res)
*/
Component.prototype.run = function(taskName, cb) {
  var func = this[taskName];
  if (typeof func === "function") {
    func.call(this, cb);
  } else {
    cb(new Error("Cannot find task:" + taskName));
  }
};
/*
Run command
*/
Component.prototype.cmd = function(cmdName, data, cb) {
  server.cmd(this.comId, cmdName, data, cb);
}

Component.prototype.updateConfig = function(cb) {
  var self = this;
  server.cfg(this.comId, function(err, cfg) {
    if (err) {
      cb(err);
    } else {
      self.setPref("config", cfg);
      self.emit("change_config", self);
      cb();
    }
  });
}
Component.prototype.getPref = function(key) {
  var v = localStorage.getItem(this.prefKey);
  if (v) {
    return JSON.parse(v)[key];
  } else {
    return null;
  }
}
Component.prototype.setPref = function(key, val) {
  var v = localStorage.getItem(this.prefKey);
  if (!v) {
    v = {};
  } else {
    try {
      v = JSON.parse(v);
    } catch (e) {
      console.log(e);
      v = {};
    }
  }
  v[key] = val;
  localStorage.setItem(this.prefKey, JSON.stringify(v));
}

function getConfig(callback) {
  server.cfg(this.comId, callback);
}
