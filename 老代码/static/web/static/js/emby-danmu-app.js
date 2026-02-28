// ==UserScript==
// @name         emby 弹幕脚本
// @namespace    http://tampermonkey.net/
// @version      emby 弹幕脚本
// @description  try to take over the world!
// @author       You
// @match        https://emby.ainizai0904.top:8071/*
// @grant        none

// ==/UserScript==
const apiHost = "https://home.ainizai0904.top:8071/";


window.onload = async function(){
    // 设置延迟为5000毫秒（即5秒）
    setTimeout(load, 2000);

}

async function load(){
    // 载入jq库
    await loadJsScript("jquery-3.5.0.min.js");
    // 载入toastr库
    await loadJsScript("toastr.js");

    // 载入弹幕ede
    await loadJsScript("danmu-ede.js");

    // 载入弹幕库
    await loadJsScript("emby-danmu-app.js");


}

async function loadJsScript(js_name){
    const js_path = apiHost + "/static/js/danmu/" + js_name;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        //script.type = 'text/javascript';
        script.src = js_path;
        script.onload = () => resolve(script);
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
        console.log("载入了js库" + js_name);
    });
}



// 混淆函数
function obfuscateString(str) {
    const offset = 3; // 偏移量
    let obfuscatedStr = '';
    for (let i = 0; i < str.length; i++) {
        obfuscatedStr += (str.charCodeAt(i) + offset).toString() + '-';
    }
    return obfuscatedStr;
}

// 解混淆函数
function deobfuscateString(obfuscatedStr) {
    const offset = 3; // 偏移量
    let deobfuscatedStr = '';
    const charCodes = obfuscatedStr.split('-').filter(Boolean); // 分割并过滤空字符串
    for (let i = 0; i < charCodes.length; i++) {
        deobfuscatedStr += String.fromCharCode(parseInt(charCodes[i]) - offset);
    }
    return deobfuscatedStr;
}







