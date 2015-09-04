module.exports = lib;
var log = require("../log");
var fh = require("fh-mbaas-api");
var bodyparser = require("body-parser");
var browserify=require("browserify");
var headers = {
  "device": "X-MAM-DEVICE",
  "task": "X-MAM-TASKS"
}
var serviceId = "";
var mamJs = "";

function lib(_serviceId, options) {
  if (!options) {
    options = {};
  }
  options.serviceId = _serviceId;
  serviceId = _serviceId;
  var router = new require("express").Router();
  router.use(bodyparser.json({
    limit: "1gb"
  }));
  router.use(mw_getTasks);
  router.get('/mam/mam.js', getMamJs);
  router.use("/mam", mam_proxy_call);
  return router;
}

function getMamJs(req, res, next) {
  if (mamJs) {
    res.end(mamJs);
  } else {
    browserify(__dirname+"/../sdk/index.js").bundle(function(err, buf) {
      if (err) {
        next(err);
      } else {
        mamJs = buf.toString("utf8");
        res.end(mamJs);
      }
    });
  }
}

function mam_proxy_call(req, res, next) {
  var _fh = getFh(req);
  if (_fh && _fh.device) {
    var d = _fh.device;
    delete _fh.device;
    if (d && d.uuid) {
      var param = {
        device: d,
        fh: _fh
      }
      var args = {
        "guid": serviceId,
        "path": req.originalUrl,
        "method": req.method,
        "headers": {
          "X-MAM-DEVICE": JSON.stringify(param)
        },
        "params": req.body ? req.body : req.query ? req.query : {}
      }
      fh.service(args, function(err, body) {
        if (err) {
          next(err);
        } else {
          if (typeof body === "string") {
            res.end(body);
          } else {
            res.json(body);
          }
        }
      });
    } else {
      next(new Error("MAM - Cannot find device uuid in MAM requests"));
    }
  } else {
    next(new Error("MAM calls should contain __fh parameter"));
  }
}

function getFh(req) {
  var _fh = req.query.__fh ? req.query.__fh : req.body ? req.body.__fh : null;
  if (_fh) {
    return Object.create(_fh);
  } else {
    return null;
  }
}

function mw_getTasks(req, res, next) {
  var _fh = getFh(req);
  if (_fh && _fh.device) {
    var d = _fh.device;
    delete _fh.device;
    if (d && d.uuid) {
      var param = {
        device: d,
        fh: _fh
      }
      fh.service({ //consider using lazy loading approach to reduce client latency in future
        "guid": serviceId,
        "path": "/mam/task",
        "headers": {
          "X-MAM-DEVICE": JSON.stringify(param)
        },
        "method": "GET"
      }, function(err, body, rres) {
        if (err && err.code != "ECONNREFUSED") {
          log.error(err);
        } else {
          res.set(headers.task, typeof body != "string" ? JSON.stringify(body) : body);
        }
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
}

function getDevice(req) {
  var dStr = req.get(headers.device);
  if (dStr) {
    try {
      var d = JSON.parse(dStr);
      return d;
    } catch (e) {
      log.error("Failed to parse device string: ", dStr);
    }
  }
  return null;
}
