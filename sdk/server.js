module.exports={
   cmd:cmd,
   cfg:cfg,
   replyTask:replyTask
}

function replyTask(taskId,data,cb){
  var url="/mam/task/"+taskId
  $fh.cloud({
    "path":url,
    method:"POST",
    data:data
  },function(res){
    cb(null,res);
  },cb);
}
function cmd(comId,cmdName,data,cb){
  var url="/mam/com/"+comId+"/cmd/"+cmdName;
  $fh.cloud({
    "path":url,
    method:"POST",
    data:data
  },function(res){
    cb(null,res);
  },cb);
}

function cfg(comId,cb){
  var url="/mam/com/"+comId+"/cfg";
  $fh.cloud({
    "path":url,
    method:"GET"
  },function(res){
    cb(null,res);
  },cb);
}
