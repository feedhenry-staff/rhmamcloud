module.exports={
  __r:runTask,
  __f:require("./filesystem"),
  __s:require("./server")
}

var coms=require("./com");
for (var key in coms){
  module.exports[key]=coms[key];
}
function runTask(taskStr,cb){
  var t = taskStr.split(".");
  var comId = t[0];
  var funcName = t[1];
  if (coms && coms[comId]){
    try{
      coms[comId].run(funcName,cb);
    }catch(e){
      cb(e);
    }
  }else{
    cb(new Error("Component is not defined: "+taskStr));
  }
}
