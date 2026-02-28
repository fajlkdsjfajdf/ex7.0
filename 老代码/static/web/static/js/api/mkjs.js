// ==UserScript==
// @name         常用油猴脚本
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        https://kp.m-team.cc/*
// @match        https://skyeysnow.com/*
// @match        https://azusa.ru/*
// @match        https://azusa.wiki/*
// @match        https://sukebei.nyaa.si/*
// @match        https://e-hentai.org/*
// @match        https://exhentai.org/*
// @match        https://nyaa.si/*
// @match        https://civitai.com/*
// @match        https://tktube.com/*
// @match        https://zh.moegirl.org.cn/*
// @match        http://v2.ainizai0905.top:8072/*

// @require      https://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js
// @grant        none

// ==/UserScript==
const apiHost = "https://home.ainizai0905.top:8071/";


window.onload = async function(){
    // 设置延迟为5000毫秒（即5秒）
    load();
}

async function load(){

    // 载入公共api库
    await loadJsScript("api.js");

    let url = window.location.href;
    if(url.indexOf("m-team")>=0){
        await loadJsScript("mteam.js");
    }
    if(url.indexOf("nyaa")>=0){
        await loadJsScript("nyaa.js");
    }
    if(url.indexOf("v2.ainizai0904.top")>=0){
        await loadJsScript("v2ray.js");
    }
    if(url.indexOf("tktube.com")>=0){
        await loadJsScript("tktube.js");
    }
    if(url.indexOf("e-hentai")>=0 || url.indexOf("exhentai")>=0){
        await loadJsScript("ehentai.js");
    }
    if(url.indexOf("moegirl")>=0){
        await loadJsScript("moegirl.js");
    }
}

async function loadJsScript(js_name){
    // 获取当前日期和时间
    const now = new Date();
    // 将日期转换为时间戳（毫秒数）
    const timestamp = now.getTime();
    // 将时间戳转换为字符串
    const timestampString = timestamp.toString();
    let js_path = apiHost + "static/js/api/" + js_name + "?t=" + timestampString;
    if(js_name.indexOf("http") == 0){
        js_path = js_name;
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        //script.type = 'text/javascript';
        script.src = js_path;
        script.onload = () => resolve(script);
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
    });
}







