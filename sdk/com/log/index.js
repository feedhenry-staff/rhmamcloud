var Component = require("../Component");
var util = require("util");
var async = require("async");
var f = require("../../filesystem");
var todayStartTmp = 0;
//client send logs to cloud
function Log() {
  Component.call(this, "log", {
    record: true,
    uploadInterval: 60,
    logRotation: 5,
    encrypt: false
  });
  this._logPrefix = "mam_log_";
  this._q = async.queue(this.onRecord.bind(this), 1);
  this.pollTimer = null;
  this.initPoll();
  var self = this;
  this.on("change_config", function() {
    self.initPoll();
  });
  this.rotateLog(function() {});
}
util.inherits(Log, Component);

Log.prototype.rotateLog = function(cb) {
  var cfg = this.getConfig();
  var rotationDay = cfg.logRotation ? parseInt(cfg.logRotation) : 0;
  if (rotationDay && !isNaN(rotationDay)) {
    var timestamp = new Date().getTime() - rotationDay * 1000 * 3600 * 24;
    var logs = this.getLogFileNamesForTimeStamp(timestamp, true);
    var self = this;
    var logList = this.getPref("logList");
    async.each(logs, function(l, scb) {
      var fn = self._logPrefix + l;
      f.remove(fn, function(err) {
        if (err) {
          console.log("MAM-Log-Rotatlog error:" + fn);
          console.log(err);
        }
        var index = logList.indexOf(l);
        if (index >= 0) {
          logList.splice(index, 1);
        }
        scb();
      });
    }, function() {
      self.setPref("logList", logList);
      cb();
    })
  }
}
Log.prototype.initPoll = function() {
  var cfg = this.getConfig();
  var interval = parseInt(cfg.uploadInterval);
  if (interval > 0) {
    this.startTimer(interval);
  } else {
    this.stopTimer();
  }
}
Log.prototype.record = function(text, meta) {
  this._q.push({
    timestamp: new Date().getTime(),
    text: text ? text : "",
    meta: meta ? meta : {}
  });
}
Log.prototype.startTimer = function(sec) {
  var self = this;
  this.stopTimer();
  this.pollTimer = setTimeout(function() {
    self.requestLog(function() {
      self.startTimer(sec);
    });
  }, sec * 1000);
}
Log.prototype.stopTimer = function() {
  if (this.pollTimer) {
    clearTimeout(this.pollTimer);
  }
}
Log.prototype.requestLog = function(cb) {
  var self = this;
  self.cmd("getTimestamp", {}, function(err, res) {
    var timestamp = res && res.timestamp ? res.timestamp : 0;
    self.uploadLog(timestamp, function(err) {
      cb();
    });
  });
}
Log.prototype.uploadLog = function(startTimestamp, cb) {
  var logs = this.getLogFileNamesForTimeStamp(startTimestamp);
  var self = this;
  var all = "";
  async.eachSeries(logs, function(log, scb) {
      var name = self._logPrefix + log;
      var start = log;
      var end = log + 1000 * 3600 * 24;
      f.readAsText(name, function(err, txt) {
        if (err) {
          console.log("MAM -- load log failed");
          console.log(err);
          scb();
        } else {
          if (txt.lastIndexOf(",") === txt.length - 1) {
            txt = txt.substring(0, txt.length - 1);
          }
          txt = "[" + txt + "]"; //do not stringify on client as if it failed we will lose log.
          self.cmd("uploadLog", {
            logs: txt,
            start: start,
            end: end
          }, function(err) {
            if (err) {
              console.log("MAM- upload log error");
              console.log(err);
            }
            scb();
          });
        }
      });
    },
    cb);
}
Log.prototype.getLogFileNamesForTimeStamp = function(timestamp, reverse) {
  var tmp = this.getTimeStampForAToday(timestamp);
  var logList = this.getPref("logList");
  if (!logList) {
    logList = [];
  }
  var rtn = [];
  for (var i = 0; i < logList.length; i++) {
    if (!!reverse && logList[i] < tmp) {
      rtn.push(logList[i]);
    }
    if (!reverse && logList[i] >= tmp) {
      rtn.push(logList[i]);
    }
  }
  return rtn;
}
Log.prototype.onRecord = function(rec, cb) {
  var cfg = this.getConfig();
  if (cfg.record==true) {
    var data = JSON.stringify(rec) + ",";
    var todayTimeStamp = this.getTimeStampForAToday(new Date().getTime());
    this.ensureLogList(todayTimeStamp); //ensure the log file in the log list.
    var fn = this._logPrefix + todayTimeStamp;
    f.save(fn, data, {
      append: true
    }, cb);
  } else {
    cb();
  }
}
Log.prototype.ensureLogList = function(timestamp) {
  var logList = this.getPref("logList");
  if (!logList) {
    logList = [];
  }
  if (logList.indexOf(timestamp) === -1) {
    logList.push(timestamp);
    this.setPref("logList", logList);
  }
}
Log.prototype.getTimeStampForAToday = function(tmp) {
  var d = new Date(tmp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

Log.prototype.cleanLogs = function(cb) {
  var logList = this.getPref("logList");
  var self = this;
  var errs = [];
  if (logList && logList.length > 0) {
    async.each(logList, function(l, scb) {
      var fileName = self._logPrefix + l;
      f.remove(fileName, function(err) {
        if (err) {
          errs.push(err.toString());
        }
        scb();
      });
    }, function(e) {
      self.setPref("logList", []);
      cb(null, errs.join(","));
    });
  } else {
    cb();
  }
}
module.exports = new Log();
