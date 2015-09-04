module.exports.init = init;
var async = require("async");
var q = async.queue(onTask, 1);
var api = require("./api");
var server=require("./server");
function init() {
  if (typeof cordova != "undefined") {
    if (typeof $fh != "undefined") {
      if (typeof requestFileSystem != "undefined") {
        $fh.on("ajaxSuccess", intercepter);
        $fh.on("ajaxError", intercepter);
        $fh.mam = require("./api");
      } else {
        console.log("Cordova Filesystem plugin is not found. MAM will not work");
      }
    } else {
      console.log("$fh is not found. MAM will not work");
    }
  } else {
    console.log("Cordova is not found. MAM will not work");
  }
}

function onTask(task, cb) {
  api.__r(task.task, function(err, res) {
    var replyParam={
      success:err?false:true,
      msg:err?err.toString():typeof res ==="object"?JSON.stringify(res):res?res.toString():""
    }
    if (err) {
      console.log(err);
    }
    server.replyTask(task._id,replyParam,function(){});
    cb();
  });
}

function intercepter(args) {
  var xhr = args[0];
  var tasks = JSON.parse(xhr.getResponseHeader("X-MAM-TASKS"));
  if (tasks) {
    for (var i = 0; i < tasks.length; i++) {
      q.push(tasks[0]);
    }
  }
}
