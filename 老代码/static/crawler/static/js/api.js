////////////////////////////////fetch/////////////////////////////////
async function fetchApi(url, type="GET", data=null) {
    let options = {};
    if(type=="GET" && data!=null){
        url = buildUrlParamByDict(url, data);
        options = {
            method: type,
            headers: new Headers({
                            'Content-Type': 'application/json'
                          })
        }
    }
    else if (type=="GET" && data==null){
        options = {
            method: type,
            headers: new Headers({
                            'Content-Type': 'application/json'
                          })
        }
    }
    else{
        options = {
            method: type,
            body: JSON.stringify(data),
            headers: new Headers({
                            'Content-Type': 'application/json'
                          })
        }
    }
    try{
        let response = await fetch(url, options)
        if(response.status == 200){
            return response.json();
        }
        else{
            toastr.error('Error:', stringFormatByDict("异常请求,状态码:{status}", {"status": response.status}));
            return null;
        }
    }
    catch (e) {
        toastr.error('Error:', e);
        return null;
    }

}


/////////////////////////////////////////////////////////////////
/************获取get******************/
function getUrlParam(name)
{
  var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
  var r = window.location.search.substr(1).match(reg); //匹配目标参数
  if (r!=null) return unescape(r[2]);
  return null; //返回参数值
}

/************print******************/
function print(data)
{
    console.log(data);
}

/************通过字典写一个url get的地址******************/
function buildUrlParamByDict(url, dict){
    url +="?";
    for(let key in dict){
        if(dict[key] != null && dict[key] != "")
            url += stringFormatByDict("{key}={value}&", {"key": key, "value": dict[key]});
    }
    url = url.slice(0,url.length-1);
    return url;
}


function setCookie(name, value, hours, path="/") {
    var name = escape(name);
    var value = escape(value);
    var expires = new Date();
    expires.setTime(expires.getTime() + hours * 3600000);
    path = path == "" ? "" : ";path=" + path;
    _expires = (typeof hours) == "string" ? "" : ";expires=" + expires.toUTCString();
    document.cookie = name + "=" + value + _expires + path;
}

//获取cookie值
function getCookie(name) {
    var name = escape(name);
    //读cookie属性，这将返回文档的所有cookie
    var allcookies = document.cookie;
    //查找名为name的cookie的开始位置
    name += "=";
    var pos = allcookies.indexOf(name);
    //如果找到了具有该名字的cookie，那么提取并使用它的值
    if (pos != -1) {                                             //如果pos值为-1则说明搜索"version="失败
        var start = pos + name.length;                  //cookie值开始的位置
        var end = allcookies.indexOf(";", start);        //从cookie值开始的位置起搜索第一个";"的位置,即cookie值结尾的位置
        if (end == -1){
           end = allcookies.length;
        }         //如果end值为-1说明cookie列表里只有一个cookie
        var value = allcookies.substring(start, end); //提取cookie的值
        return (value);                           //对它解码
    }
    else
    {
       return ""; //搜索失败，返回空字符串
    }
}
//删除cookie
function deleteCookie(name, path) {
    var name = escape(name);
    var expires = new Date(0);
    path = path == "" ? "" : ";path=" + path;
    document.cookie = name + "=" + ";expires=" + expires.toUTCString() + path;
}


function getStorageItem(key, default_value){
    let value = localStorage.getItem(key);
    if(value == null)
        return default_value
    else
        return value
}

function setStorageItem(key, value){
    localStorage.setItem(key, value);
}


