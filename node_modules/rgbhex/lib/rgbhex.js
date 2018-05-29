
var commander = require('commander');
    require('colors');

var rgbhex = (function(){

  function RGBtoHex(RGB)
  {
    var R = RGB.split(",")[0];
    var G = RGB.split(",")[1];
    var B = RGB.split(",")[2];
    console.log("#"+ toHex(R) + toHex(G) + toHex(B));
  }

  function toHex(N) {
    if(N == null){
      return "00"
    };
    N = parseInt(N);
    if(N == 0 || isNaN(N))
      return "00";
    N = Math.max(0, N);
    N = Math.min(N, 255);
    N = Math.round(N);
    return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
  }

  function HexToRGB(color){
    var hexColor = color;
    if(hexColor.charAt(0) == "#"){
      hexColor = hexColor.replace("#","");
    }

    if(hexColor.length == 3){
      var fR = hexColor.substring(0,1);
      var fG = hexColor.substring(1,2);
      var fB = hexColor.substring(2,3);
      hexColor = fR + fR + fG + fG + fB + fB;
    }
    var R = parseInt(hexColor.substring(0,2), 16);
    var G = parseInt(hexColor.substring(2,4), 16);
    var B = parseInt(hexColor.substring(4,6), 16);
    console.log(("R:" + R).red + (" G:" + G).green + (" B:" + B).blue);
    var Rpoint = (R / 255).toFixed(2);
    var Gpoint = (G / 255).toFixed(2);
    var Bpoint = (B / 255).toFixed(2);
    console.log("colorWithRed:"+Rpoint+" green:" + Gpoint+ " blue:"+ Bpoint );

  }

  function checkColor(colorName){
    var colorName = colorName.replace(" ","");
    var type = /^(#)?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;//hex reg
    if (type.test(colorName)) {
      return true;
    } else {
      type = /^(([0-9])|([1-9]\d)|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))[,](([0-9])|([1-9]\d)|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))[,](([0-9])|([1-9]\d)|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))$/;
      if (type.test(colorName)) {
        return true;
      } else {
        console.log("Wrong color!".red);
        return false;
      }
    }
  }

  return {
    init : function(){
      var colorName = commander.args[0];
      if(checkColor(colorName)){
        if(colorName.indexOf(",") > -1){
          RGBtoHex(colorName);
        }else{
          HexToRGB(colorName);
        }
      }
    }
  };

})();

module.exports = rgbhex ;





