////////////////////////////////实行replaceAll/////////////////////////////////
String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

////////////////////////////////通过字典格式话字符串/////////////////////////////////
String.prototype.stringFormatByDict = function(s, dict) {
    for(let key in dict){
        s = s.replaceAll("{"+key+"}", dict[key]);
    }
    return s;
}
function stringFormatByDict(s, dict) {
    try{
        for(let key in dict){
            if(s)
                s = s.replaceAll("{"+key+"}", dict[key]);
        }
        return s;
    }
    catch(error){
        console.log(error);
        console.log(s);
        console.log(dict);
        return s;
    }

}

function getDefaultFromDict(dict, key, d=null) {
    if (dict ==null)
        return d
    if(key in dict && dict[key] != null && dict[key] != "")
        return dict[key];
    else
        return d
}


//////////////////////////获取一个值，没有就选中默认值
function getDefault(s, d=null){
    if(s == "" || s== null || s == "undefined"){
        return d;
    }
    return s;
}

/*************日期格式话输出******************/
Date.prototype.format = function (fmt) {
  var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ?
        (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
}

//////////////////////////数字缩写，千=K，百万=M
function getNo(number){
    let n = parseInt(number);
    if(n >= Math.pow(10,6)){
        n = (n / Math.pow(10,6)).toFixed(1) + "M";
    }
    else if(n >= Math.pow(10,3)){
        n = (n / Math.pow(10,3)).toFixed(1) + "K";
    }
    else{
        n = n + "";
    }
    return n;
}


////////////////////////////输出一个信息提示框
function printInfo(msg){
    let info_container = $("#info-container");
    if(info_container.length == 0){
        let html = '<div id="info-container" class="toast-bottom-center mb-50"><div class="toast toast-info" aria-live="polite" style=""><div class="toast-message">{msg}</div></div></div>';
        html = stringFormatByDict(html, {"msg": msg});
        $("body").append(html);
        $("#info-container").attr("time", Date.parse(new Date()) / 1000);
    }
    else{
        $("#info-container .toast-message").html(msg);
        $("#info-container").attr("time", Date.parse(new Date()) / 1000);
    }
}

function clearInfo(){
    let info_container = $("#info-container");
    if(info_container.length > 0) {
        let time_now = Date.parse(new Date()) / 1000;
        let time_print = parseInt($("#info-container").attr("time"));
        if (time_now - time_print >= 2) {
            $("#info-container").remove();
        }
    }
}

setInterval(clearInfo, 1000);


///替换host
function replaceHost(url, host){
    let domain = url.split('/');
    h = domain[2];
    url = url.replace(h, host);
    return url;
}

////////////////////////////对list数组重新排序，使得其横向排列
// function listDataReOrder(data, col_count){
//     col_count = parseInt(col_count);
//     let row_count = parseInt(data.length / col_count);
//     let exp = data.length % col_count;
//     let row = 0;
//     let col = 0;
//     let new_data = [];
//     for(let i=0; i<data.length; i++){
//         if(col < exp){
//             print(col_count * row + col);
//             new_data.push(data[row_count * row + col]);
//         }
//         else{
//             print(row_count * row + col + exp);
//             new_data.push(data[row_count * row + col + exp]);
//         }
//
//         if(row< row_count && col < exp){
//             row ++ ;
//         }
//         else if(row< row_count -1){
//             row ++ ;
//         }
//         else{
//             row =0;
//             col ++;
//         }
//     }
//     return new_data;
//
// }


function fullScreen(){
    if(document.documentElement.RequestFullScreen){
        document.documentElement.RequestFullScreen();
    }
    //兼容火狐
    //console.log(document.documentElement.mozRequestFullScreen)
    if(document.documentElement.mozRequestFullScreen){
        document.documentElement.mozRequestFullScreen();
    }
    //兼容谷歌等可以webkitRequestFullScreen也可以webkitRequestFullscreen
    if(document.documentElement.webkitRequestFullScreen){
        document.documentElement.webkitRequestFullScreen();
    }
    //兼容IE,只能写msRequestFullscreen
    if(document.documentElement.msRequestFullscreen){
    document.documentElement.msRequestFullscreen();
    }

}

function noFullScreen(){
    if(document.exitFullScreen){
        document.exitFullscreen()
    }
    //兼容火狐
    //console.log(document.mozExitFullScreen)
    if(document.mozCancelFullScreen){
        document.mozCancelFullScreen()
    }
    //兼容谷歌等
    if(document.webkitExitFullscreen){
        document.webkitExitFullscreen()
    }
    //兼容IE
    if(document.msExitFullscreen){
        document.msExitFullscreen()
    }

}