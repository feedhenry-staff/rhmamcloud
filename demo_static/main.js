var app=angular.module("mam",[]);
app.controller("main",function($scope){
  $scope.device=window.device;
  $scope.register=function(){
    $fh.cloud({
      path:"/hello",
      method:"GET"
    },console.log.bind(console));
  }
});
