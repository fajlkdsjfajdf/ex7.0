
const apiHost = "https://home.ainizai0904.top:8071/";

//const apiHost = "http://localhost:18001/";
const goodTags = ["连裤袜", "恋腿癖", "超乳"];

function loadJq(){
    if (typeof jQuery == 'undefined') {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://code.jquery.com/jquery-3.6.0.min.js'; // 替换为你需要的jQuery版本号和URL
        document.head.appendChild(script);
        console.log("jq载入完成");
    }
    else{
        console.log("jq已经载入");
    }
}

function getFanhao(str){
    var reg = /[a-zA-Z]{2,6}-\d{2,6}/;
    var result = str.match(reg);
    if (result) {
        //console.log(result);
        let fanhao = result[0];

        fanhao = cleanFanhao(fanhao);
        return fanhao;
    } else {
        //console.log("匹配失败");
    }
    return "";
}

function cleanFanhao(fanhao){
    //清洗番号
    fanhao = fanhao.toUpperCase();
    //ppv开头为个人摄影，搜不到
    if(fanhao.startsWith("PPV-"))
        fanhao = "";


    return fanhao
}

function showTable(url,w,h){
    //添加iframe

    //allowTransparency='true' 设置背景透明
    $("<div   id='down_div' name='down_div' style='position:absolute;z-index:4;'   security='restricted' ></div>").prependTo('body');
    $("#down_div").css("width",w);
    $("#down_div").css("height",h);
    $("#down_div").css("background","white");
    var st=document.documentElement.scrollTop|| document.body.scrollTop;//滚动条距顶部的距离
    var sl=document.documentElement.scrollLeft|| document.body.scrollLeft;//滚动条距左边的距离
    var ch=document.documentElement.clientHeight;//屏幕的高度
    var cw=document.documentElement.clientWidth;//屏幕的宽度
    var objH=$("#down_div").height();//浮动对象的高度
    var objW=$("#down_div").width();//浮动对象的宽度
    var objT=Number(st)+(Number(ch)-Number(objH))/2;
    var objL=Number(sl)+(Number(cw)-Number(objW))/2;
    $("#down_div").css('left',objL);
    $("#down_div").css('top',objT);
    $("#down_div").css('overflow-y','auto');
    $("#down_div").attr("src", url);
    //添加背景遮罩
    $("<div id='down_divbg' style='background-color: Gray;display:block;z-index:3;position:absolute;left:0px;top:0px;filter:Alpha(Opacity=30);/* IE */-moz-opacity:0.4;/* Moz + FF */opacity: 0.4; '/>").prependTo('body');
    var bgWidth = Math.max($("body").width(),cw);
    var bgHeight = Math.max($("body").height(),ch);
    $("#down_divbg").css({width:bgWidth,height:bgHeight});
    //点击背景遮罩移除iframe和背景
    $("#down_divbg").click(function() {
        $("#down_div").remove();
        $("#down_divbg").remove();
    });
}

function setCss(){
    // 注入一些css
    let css_str = {
        "#down_div input": {
            'width': "40px",

        },
        "#down_div p": {
            'color': "black"
        },
        "#av_tool":{
            'position': 'fixed',
            'cursor': 'pointer',
            'top': '10px',
            'left': '10px',
            'z-index': '9999',
            //'background-color': '#007bff',
            'color': '#fff',
            'padding': '10px',
            'border': 'none',
            'border-radius': '5px',
            'font-size': '16px',
            'width': '200px',
        },
        ".login-btn-api": {
            //'position': 'fixed',
            'cursor': 'pointer',
            //'top': '10px',
            //'left': '10px',
            //'z-index': '9999',
            'background-color': '#007bff',
            'color': '#fff',
            'padding': '10px',
            'border': 'none',
            'border-radius': '5px',
            'font-size': '12px',
            'width': '70px',
            'margin-left': '5px',
            'margin-top': '5px',
        },
        ".tags": {
            "height": "80px",
            "display": "block",
            "margin-top": "10px",
            "white-space": "normal"
        },
        ".tags span": {
            "background-color": "bisque",
            "padding": "4px 11px",
            "margin-bottom": "5px",
            "margin-right": "2px",
            "border-radius": "20px",
            "font-size": "13px",
            "text-transform": "capitalize",
            "color": "#506172",
            "display": "inline-block",
            "font-weight": "700",
            "cursor": "pointer"
        },
        ".tags .love":{
            "border": "3px solid gray",
        },
        ".hidden-important":{
            "display": "none !important",
        },
        ".link-button":{
            "margin": "5px",
            "cursor": "pointer"
        }


    }
    injectCSS(css_str);
}


function createFloatingButton(show_retrieval_button=true) {
    if($("#av_tool").length >0)
        return;

    let div = $('<div id="av_tool" class="av_tool"></div>')

    $('body').append(div);

    // 登录框
    let $button = $('<button  class="login-btn-api">登录</button>');
    if(checkLoginCodeInUrlAndCookie())
    {
        window.is_login = true;
        $button = $('<button class="login-btn-api" style="background-color:burlywood">已登录</button>');
    }
    else{
        window.is_login = false;
    }

    $button.on("click", function(){
        let login_url = buildUrlParamByDict(apiHost+ "login_code",
            {
                "source_url": encodeURIComponent(window.location.href)
            });
        window.location.href = login_url
    });

    $('#av_tool').append($button);




    //检索按钮
    if(show_retrieval_button){
        let $button_search = $('<button  class="login-btn-api" >强制检索</button>');
        let forced_retrieval = getCookie("forced_retrieval");
        window.forced_retrieval = forced_retrieval;
        if(window.forced_retrieval)
            $button_search.css({"background-color": "burlywood"});
            $button_search.click(function(){
                if(window.forced_retrieval){
                    window.forced_retrieval = 0;
                    setCookie("forced_retrieval", 0);
                    $(this).css({"background-color": "#007bff"});
                }
                else{
                    window.forced_retrieval = 1;
                    setCookie("forced_retrieval", 1);
                    $(this).css({"background-color": "burlywood"});
                }

            });
        $('#av_tool').append($button_search);
    }

    //显示模式按钮
    let show_mode_button = $('<button  class="login-btn-api" ></button>');
    let show_mode = getShowMode();
    let show_mode_text = "显示全部";
    let show_mode_color = "#007bff"
    if(show_mode == 2){
        show_mode_text = "显示有效";
        show_mode_color = "burlywood";
    }
    else if(show_mode == 3){
        show_mode_text = "显示喜爱";
        show_mode_color= "brown";
    }
    show_mode_button.css({"background-color": show_mode_color})
    show_mode_button.html(show_mode_text);
    show_mode_button.on("click", function(){
        let text = $(this).html();
        if(text == "显示全部"){
            setCookie("tool_show_mode", 2, 30);
            $(this).html("显示有效");
            show_mode_button.css({"background-color": "burlywood"})
        }
        else if(text == "显示有效"){
            setCookie("tool_show_mode", 3, 30);
            $(this).html("显示喜爱");
            show_mode_button.css({"background-color": "brown"})
        }
       else if(text == "显示喜爱"){
            setCookie("tool_show_mode", 1, 30);
            $(this).html("显示全部");
            show_mode_button.css({"background-color": "#007bff"})
        }
       window.location.reload();
    })
    $("#av_tool").append(show_mode_button);


}

function buildTag(tag_name, bg="bisque"){
    let $span = $('<span>'+tag_name+'</span>');
    $span.css({"background": bg});
    if(goodTags.indexOf(tag_name) > -1){
        //$span.css({"border": "3px solid gray"});
        $span.addClass("love");
    }
    return $span;

}

function buildFileInfo(files){
    let html = "";
    for(let f in files){
        let file = files[f];
        html += `<p>本地文件--》 类型: ${file['type']} 分辨率: ${file['dpi']} </p>`;
        console.log(file);
    }
    return html;

}

function showCovers(pics){
    showTable("url", 1500, 500);
    let div = $('<div id="imageContainer" style="overflow-y: scroll; height: 500px;"></div>');
    for (let i = 1; i < pics.length; i++) {
        let src = pics[i];
		src = src.replace("jbk002", "jbk003");
        let img = $('<img>').attr('src', src);
        img.css({
            "width": "450px",
            "margin": "10px 10px"
        });
        img.on("error", function(){
            if($(this).attr('src') == src){
                // 尝试使用服务器转接图片

            }
        });
        // 将img元素添加到div中
        div.append(img);
    }
    $("#down_div").append(div);
}

async function downFile(url, path, file){
    url = encodeURIComponent(url);
    let login_code = getCookie("login_code");
    if(login_code){
        let data = await fetchApi(apiHost+ "api", "GET", {
            "type": "downbigfile",
            "code": login_code,
            "url": url,
            "path": path,
            "file": file
        });

        if("status" in data && data["status"] == "success"){
            showMsgTip(data["msg"]);

        }
        else{
            showMsgTip(data["msg"]);
        }
    }
    else{
        showMsgTip("还未登录");
    }
}

async function getAvInfo(fanhao_list){
    let login_code = getCookie("login_code");
    if(login_code){
        let data = await fetchApi(apiHost+ "response_api", "POST", {
            "prefix": "jb",
            "type": "apisearch",
            "code": login_code,
            "update": window.forced_retrieval,
            "fh_list": fanhao_list

        });
        if("status" in data && data["status"] == "success"){
            return data["data"];
        }

    }
    return null;
}

function getAvThumb(info){
    let login_code = getCookie("login_code");
    let pic_l = info["pic_l"];
    if("thumb_load" in info & info["thumb_load"] == 2){
        pic_l = `${apiHost}response_api?code=${login_code}&prefix=jb&type=thumb&id=${info["_id"]}`;
    }
    return pic_l;
}


function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function checkLoginCodeInUrlAndCookie() {
  var urlParams = new URLSearchParams(window.location.search);
  var loginCode = urlParams.get("login_code");

  if (loginCode) {
    setCookie("login_code", loginCode, Infinity);
    console.log("login_code已存入cookie");
    // 获取当前URL
    let url = new URL(window.location.href);
    // 删除指定的查询参数
    url.searchParams.delete("login_code");
    // 重载页面到新的URL
    window.location.href = url.toString();
    return true;
  }

  var storedLoginCode = getCookie("login_code");
  if (storedLoginCode) {
    console.log("cookie中记录了login_code: " + storedLoginCode);
    return true;
  } else {
    console.log("cookie中没有记录login_code");
  }



  return false;
}

function getShowMode(){
    //获取显示模式, 0为全部显示, 1为只显示找到信息的, 2为显示找到信息并且具有爱好tag的
    let tool_show_mode = getCookie("tool_show_mode");
    if(tool_show_mode == null){
        tool_show_mode = 1;
    }
    tool_show_mode = parseInt(tool_show_mode);
    return tool_show_mode;
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


async function fetchApi(url, type="GET", data=null, formpost=false, headers=null) {
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
    else if(type=="POST" && formpost){
        let formData = new FormData();
        for (let key in data) {
            formData.append(key, data[key]);
        }
        options = {
            method: type,
            body: formData,
			headers: new Headers()
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
	
	if(headers != null){
		if (!options.headers) {
		  options.headers = {};
		}
		options.headers = Object.assign({}, options.headers, headers);
		options.headers = new Headers(options.headers);
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

function injectCSS(css_str) {
    let style = document.createElement('style');
    for (let key in css_str) {
        if (css_str.hasOwnProperty(key)) {
            let css = key + ' {';
            for (let property in css_str[key]) {
                if (css_str[key].hasOwnProperty(property)) {
                    css += property + ': ' + css_str[key][property] + '; ';
                }
            }
            css += '}';
            style.innerHTML += css;
        }
    }
    document.head.appendChild(style);
}


function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
  showCopyTip();
}


function showCopyTip() {
  const copyTip = document.createElement('div');
  copyTip.innerHTML = '已复制';
  copyTip.style.position = 'fixed';
  copyTip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  copyTip.style.color = 'white';
  copyTip.style.padding = '5px';
  copyTip.style.borderRadius = '3px';
  copyTip.style.zIndex = '1000';
  copyTip.style.left = '48%';
  copyTip.style.top = '80%';
  copyTip.style.fontSize = '3em';
  document.body.appendChild(copyTip);


  setTimeout(() => {
    document.body.removeChild(copyTip);
  }, 2000);
}


function showMsgTip(msg) {
  const copyTip = document.createElement('div');
  copyTip.innerHTML = msg;
  copyTip.style.position = 'fixed';
  copyTip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  copyTip.style.color = 'white';
  copyTip.style.padding = '5px';
  copyTip.style.borderRadius = '3px';
  copyTip.style.zIndex = '1000';
  copyTip.style.left = '48%';
  copyTip.style.top = '80%';
  copyTip.style.fontSize = '3em';
  document.body.appendChild(copyTip);


  setTimeout(() => {
    document.body.removeChild(copyTip);
  }, 10000);
}

function removeItem(arr, item) {
    let new_arr = [];
    for(let i in arr){
        let d = arr[i];
        if(d != item){
            new_arr.push(d);
        }
    }
    return new_arr;
}


function getUrlParams(url) {
  var params = {};
  var queryString = url.split('?')[1];
  if (queryString) {
    var keyValuePairs = queryString.split('&');
    for (var i = 0; i < keyValuePairs.length; i++) {
      var keyValuePair = keyValuePairs[i].split('=');
      params[keyValuePair[0]] = keyValuePair[1];
    }
  }
  return params;
}

function getCurrentDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以需要加1
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function showIframe(url,w,h){
    //添加iframe

    //allowTransparency='true' 设置背景透明
    $("<iframe   id='link_iframe' name='down_div' style='position:absolute;z-index:4;'   security='restricted' ></iframe>").prependTo('body');
    $("#link_iframe").css("width",w);
    $("#link_iframe").css("height",h);
    $("#link_iframe").css("background","white");
    var st=document.documentElement.scrollTop|| document.body.scrollTop;//滚动条距顶部的距离
    var sl=document.documentElement.scrollLeft|| document.body.scrollLeft;//滚动条距左边的距离
    var ch=document.documentElement.clientHeight;//屏幕的高度
    var cw=document.documentElement.clientWidth;//屏幕的宽度
    var objH=$("#link_iframe").height();//浮动对象的高度
    var objW=$("#link_iframe").width();//浮动对象的宽度
    var objT=Number(st)+(Number(ch)-Number(objH))/2;
    var objL=Number(sl)+(Number(cw)-Number(objW))/2;
    $("#link_iframe").css('left',objL);
    $("#link_iframe").css('top',objT);
    $("#link_iframe").css('overflow-y','auto');
    $("#link_iframe").attr("src", url);
    //添加背景遮罩
    $("<div id='down_divbg' style='background-color: Gray;display:block;z-index:3;position:absolute;left:0px;top:0px;filter:Alpha(Opacity=30);/* IE */-moz-opacity:0.4;/* Moz + FF */opacity: 0.4; '/>").prependTo('body');
    var bgWidth = Math.max($("body").width(),cw);
    var bgHeight = Math.max($("body").height(),ch);
    $("#down_divbg").css({width:bgWidth,height:bgHeight});
    //点击背景遮罩移除iframe和背景
    $("#down_divbg").click(function() {
        $("#link_iframe").remove();
        $("#down_divbg").remove();
    });
}


function getCurrentTimestamp() {
    /*
        获取当前时间的毫秒数
     */
    const now = new Date();
    // 获取时间戳
    const timestamp = now.getTime();
    return timestamp;
}

function getCurrentSecondstamp(){
    /*
        获取当前时间的秒数
     */
    return Math.floor(getCurrentTimestamp() / 1000);
}