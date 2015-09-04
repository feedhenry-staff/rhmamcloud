module.exports={
  isPhoneGap:isPhoneGap
}

function isPhoneGap(){
  return document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
}
