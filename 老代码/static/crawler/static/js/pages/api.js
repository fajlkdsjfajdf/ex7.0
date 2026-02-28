////////////////////////////////fetch/////////////////////////////////
async function fetchApi(url, type="GET", data=null) {
    let options = {};

    if(type=="GET"){
        if(data !=null)
            url = buildUrlParamByDict(url, data);
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

    let response = await fetch(url, options)
    if(response.status == 200){
        return response.json();
    }
    else{
        toastr.error('Error:', stringFormatByDict("异常请求,状态码:{status}", {"status": response.status}));
        return null;
    }
}


/*************添加 或者 修改 url中参数的值******************/
function updateQueryString(name, val) {
    var thisURL = document.location.href;
    // 如果 url中包含这个参数 则修改
    if (thisURL.indexOf(name+'=') > 0) {
        var v = getQueryString(name);
        if (v != null) {
            // 是否包含参数
            thisURL = thisURL.replace(name + '=' + v, name + '=' + val);
        }
        else {
            thisURL = thisURL.replace(name + '=', name + '=' + val);
        }
    } // 不包含这个参数 则添加
    else {
        if (thisURL.indexOf("?") > 0) {
            thisURL = thisURL + "&" + name + "=" + val;
        }
        else {
            thisURL = thisURL + "?" + name + "=" + val;
        }
    }
    location.href = thisURL;
};


/*************添加 或者 修改 url中参数的值******************/
function urlSetParm(url, name, val) {
    var thisURL = url;
    // 如果 url中包含这个参数 则修改
    if (thisURL.indexOf(name+'=') > 0) {
        var v = getQueryString(name);
        if (v != null) {
            // 是否包含参数
            thisURL = thisURL.replace(name + '=' + v, name + '=' + val);
        }
        else {
            thisURL = thisURL.replace(name + '=', name + '=' + val);
        }
    } // 不包含这个参数 则添加
    else {
        if (thisURL.indexOf("?") > 0) {
            thisURL = thisURL + "&" + name + "=" + val;
        }
        else {
            thisURL = thisURL + "?" + name + "=" + val;
        }
    }
    return thisURL;
};

/************获取get******************/
function getUrlParam(name)
{
  var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
  var r = window.location.search.substr(1).match(reg); //匹配目标参数
  if (r!=null) return unescape(r[2]);
  return null; //返回参数值
}


function dictGet(dict, key, default_value=""){
    if(key in dict)
        return dict[key];
    else
        return default_value
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


function stringFormatByDict(s, dict) {
    for(let key in dict){
        s = s.replaceAll("{"+key+"}", dict[key]);
    }
    return s;
}

function getDefaultFromDict(dict, key, d=null) {
    if (dict ==null)
        return d
    if(key in dict && dict[key] != null && dict[key] != "")
        return dict[key];
    else
        return d
}


function parseDate(dateString) {
    dateString = dateString.replace("GMT", "");
    console.log(dateString);
    let date = new Date(dateString);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toLocaleString().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

}

/**
 * 获取2个字符串的相似度
 * @param {string} str1 字符串1
 * @param {string} str2 字符串2
 * @returns {number} 相似度
 */
function getSimilarity(str1,str2) {
    let sameNum = 0
    //寻找相同字符
    for (let i = 0; i < str1.length; i++) {
        for(let j =0;j<str2.length;j++){
            if(str1[i]===str2[j]){
                sameNum ++
                break
            }
        }
    }
    // console.log(str1,str2);
    // console.log("相似度",(sameNum/str1.length) * 100);
    //判断2个字符串哪个长度比较长
    let length = str1.length > str2.length ? str1.length : str2.length
    return (sameNum/length) * 100 || 0
}

