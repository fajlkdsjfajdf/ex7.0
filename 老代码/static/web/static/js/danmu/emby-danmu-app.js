/*
    备份用
*/

// ==UserScript==
// @name         Emby danmaku extension
// @description  Emby弹幕插件
// @author       RyoLee
// @version      1.6
// @grant        none
// @match        */web/index.html
// ==/UserScript==

//屏蔽词库
const pb_list = [];
//const api_url = "http://192.168.1.210:18001/";
const api_url = "https://home.ainizai0904.top:8071/";
const api_key = "jjljalksjfidojowenndsklnvjsdoanf";

(async function () {
    'use strict';
    console.log("载入弹幕库");
    let application_name = document.querySelector('meta[name="application-name"]').content;
    console.log(application_name);
    if (['Emby', 'Media Server'].includes(application_name)) {



        // ------ configs start------
        const check_interval = 200;
        const random = (min, max) => +(Math.random() * (max - min) + min).toFixed(0);
        const chConverTtitle = ['当前状态: 未启用', '当前状态: 转换为简体', '当前状态: 转换为繁体'];
        // 0:当前状态关闭 1:当前状态打开
        const danmaku_icon = ['\uE7A2', '\uE0B9'];
        const search_icon = '\uE881';
        const translate_icon = '\uE927';
        const refresh_icon = '\ue863';
        const info_icon = '\uE0E0';
        const local_icon = '\ue2c7';
        const export_icon = '\ue178';
        const autoexport_icon = '\uf03a';
        const with_icon = [ '\ue8f5', '\ue8f4'];
        const buttonOptions = {
            class: 'paper-icon-button-light',
            is: 'paper-icon-button-light',
        };
        //const uiQueryStr = '.btnVideoOsdSettings';
        const uiQueryStr = '.videoOsd-btnPause-autolayout';
        //const uiQueryStr = '.btnVideoOsdSettings';
        //const mediaContainerQueryStr = "div[data-type='video-osd']";
        const mediaContainerQueryStr = "div[class='htmlVideoPlayerContainer'], div[data-type='video-osd'], div[class*='graphicContentContainer']";
        const mediaQueryStr = '.videoOsd-btnPause';
        const mediaVideoPositionStr = '.videoOsdPositionText';
        const mediaVideoTitleStr = '.videoOsdTitle';
        const displayButtonOpts = {
            title: '弹幕开关',
            id: 'displayDanmaku',
            innerText: null,
        };
        const searchButtonOpts = {
            title: '搜索弹幕',
            id: 'searchDanmaku',
            innerText: search_icon,
        };
        const localButtonOpts = {
            title: '本地弹幕',
            id: 'localDanmaku',
            innerText: local_icon,
        };
        const exportButtonOpts = {
            title: '引用弹幕',
            id: 'exportDanmaku',
            innerText: export_icon,
        };
        const autoexportButtonOpts = {
            title: '自动外部引用',
            id: 'autoExport',
            innerText: autoexport_icon,
        };
        const translateButtonOpts = {
            title: null,
            id: 'translateDanmaku',
            innerText: translate_icon,
        };
        const infoButtonOpts = {
            title: '弹幕设置',
            id: 'printDanmakuInfo',
            innerText: info_icon,
        };
        const refreshButtonOpts = {
            title: '重载弹幕',
            id: 'refreshDanmu',
            innerText: refresh_icon,
        };
        const withButtonOpts = {
            title: '外部弹幕',
            id: 'withDanmu',
            innerText: with_icon[0],
        };



        // ------ configs end------
        //引用类


        //上传类
        class XMLUploader {
          constructor(uploadUrl) {
            this.uploadUrl = uploadUrl;
            this.fileInput = null;
          }

          init() {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.style.display = 'none';
            this.fileInput.accept = 'text/xml'; // 限制只能选择 XML 文件
            document.body.appendChild(this.fileInput);
            let self = this;
            this.fileInput.addEventListener('change', function(evt){
                let file = evt.target.files[0];
                let reader = new FileReader();

                reader.onload = function(e) {
                  let xmlContent = e.target.result;
                  self.uploadFile(xmlContent);
                }.bind(this);

                reader.readAsText(file);
            });
          }

          async uploadFile(xmlContent) {
            let xhr = new XMLHttpRequest();
            xhr.onload = function() {
              if (xhr.status === 200) {
                console_log('文件上传成功');
              } else {
                console_log('文件上传失败');
              }
            };

            let data = {
                "id": this.video_id,
                "title": this.animeName,
                "episode": this.episode,
                "xml_content": xmlContent
            };
            let options = {
                method: "POST",
                body: JSON.stringify(data),
                headers: new Headers({
                                'Content-Type': 'application/json'
                              })
            };
            let response = await fetch(this.uploadUrl, options);
            if(response.status == 200){
                let data = await response.json();
                if(this.callback){
                    this.callback(data);
                }
            }
          }

          chooseFile() {
            this.fileInput.click();
          }
          setVideoInfo(item){
            if (item.Type == 'Episode') {
                this.video_id = item.Id;
                this.animeName = item.SeriesName;
                this.episode = item.IndexNumber.toString();
                let session = item.ParentIndexNumber;
                if (session != 1) {
                    this.animeName += ' 第' + session + '季';
                }
                if (session == 0){
                    this.animeName += ' ova';
                }
            } else {
                this.video_id = item.Id;
                this.animeName = item.Name;
                this.episode = 'movie';
            }
          }

          setCallBack(callback){
              this.callback = callback;
          }
        }




    class EDE {
        constructor() {
            this.xml_uploader = new XMLUploader(api_url + "danmuku?type=upload");
            this.xml_uploader.init();

            this.chConvert = 1;
            if (window.localStorage.getItem('chConvert')) {
                this.chConvert = window.localStorage.getItem('chConvert');
            }
            //弹幕属性
            this.danmuLimit = 5;
            if (window.localStorage.getItem('danmuLimit')) {
                this.danmuLimit = window.localStorage.getItem('danmuLimit');
            }
            this.danmuSize = 25;
            if (window.localStorage.getItem('danmuSize')) {
                this.danmuSize = window.localStorage.getItem('danmuSize');
            }
            // 0:当前状态关闭 1:当前状态打开
            this.danmakuSwitch = 1;
            if (window.localStorage.getItem('danmakuSwitch')) {
                this.danmakuSwitch = parseInt(window.localStorage.getItem('danmakuSwitch'));
            }
            this.withSwitch = 1;
            if (window.localStorage.getItem('withSwitch')) {
                this.withSwitch = parseInt(window.localStorage.getItem('withSwitch'));
            }
            this.danmaku = null;
            this.episode_info = null;
            this.ob = null;
            this.reloading = false;
        }
    }

    function console_log(data){
        console.log(data);
        data = JSON.stringify(data);
        toastr.info(data);//提醒

    }

    function dialog(title, data){

    }

    function createButton(opt, onclick) {
        let button = document.createElement('button', buttonOptions);
        button.setAttribute('title', opt.title);
        button.setAttribute('id', opt.id);
        let icon = document.createElement('span');
        icon.className = 'md-icon';
        icon.innerText = opt.innerText;
        button.appendChild(icon);
        button.onclick = onclick;
        return button;
    }

    function createButton2(opt, onclick){
        //<button is="paper-icon-button-light" class="btnVideoOsdSettings btnVideoOsdSettings-right videoOsd-hideWhenLocked paper-icon-button-light" title="设置" aria-label="设置"><i class="largePaperIconButton md-icon"></i></button>

        let button = document.createElement('button', buttonOptions);
        button.setAttribute('title', opt.title);
        button.setAttribute('id', opt.id);
    }

    function displayButtonClick() {
        console_log('切换弹幕开关');
        window.ede.danmakuSwitch = (window.ede.danmakuSwitch + 1) % 2;
        window.localStorage.setItem('danmakuSwitch', window.ede.danmakuSwitch);
        document.querySelector('#displayDanmaku').children[0].innerText = danmaku_icon[window.ede.danmakuSwitch];
        if (window.ede.danmaku) {
            window.ede.danmakuSwitch == 1 ? window.ede.danmaku.show() : window.ede.danmaku.hidden();
        }
    }

    function searchButtonClick() {

        // // 获取当前页面的HTML代码
        // var currentHtml = document.documentElement.outerHTML;
        //
        // // 使用prompt()方法弹出一个带输入框的提示框，并将当前页面的HTML代码作为默认值
        // var userInput = prompt("请输入HTML代码：", currentHtml);

        console_log('手动匹配弹幕');
        reloadDanmaku('search');
    }

    async function localButtonClick() {
        console_log('上传本地弹幕');
        let item = await getEmbyItemInfo();
        console.log(item);
        if(item){
            window.ede.xml_uploader.setVideoInfo(item);
            window.ede.xml_uploader.setCallBack(function(data){
                if(data["status"] == "success"){
                    console_log("成功引用本地弹幕数量:" + data["count"]);
                    reloadDanmaku('reload');
                }
                else{
                    console_log("引用本地弹幕失败");
                }
            });
            window.ede.xml_uploader.chooseFile();
        }
    }

    async function autoexportBUttonClick(){
        console_log('尝试自动引用');
        let item = await getEmbyItemInfo();
        let video_id, animeName, episode;
        if (item.Type == 'Episode') {
            video_id = item.Id;
            animeName = item.SeriesName;
            episode = item.IndexNumber.toString();
            let session = item.ParentIndexNumber;
            if (session != 1) {
                animeName += ' 第' + session + '季';
            }
            if (session == 0){
                animeName += ' ova';
            }
            let _name_key = '_anime_name_rel_' + item.SeasonId;
            if (window.localStorage.getItem(_name_key)) {
                animeName = window.localStorage.getItem(_name_key);
            }
        } else {
            video_id = item.Id;
            animeName = item.Name;
            episode = '0';
        }

        let data = {
                "id": video_id,
                "title": animeName,
                "episode": episode
            };
        let options = {
            method: "POST",
            body: JSON.stringify(data),
            headers: new Headers({
                            'Content-Type': 'application/json'
                          })
        };
        let response = await fetch(api_url + "danmuku?type=export", options);
        if(response.status == 200){
            let data = await response.json();
            console.log(data);
            if(data["status"] == "success"){
                console_log("成功引用第三方弹幕数量:" + data["count"]);
                reloadDanmaku('reload');
            }
            else{
                console_log("引用第三方弹幕失败");
            }
        }


    }

    async function exportBUttonClick(){
        console_log('引用其他网站弹幕');
        let item = await getEmbyItemInfo();


        let video_id, animeName, episode;
        if (item.Type == 'Episode') {
            video_id = item.Id;
            animeName = item.SeriesName;
            episode = item.IndexNumber.toString();
            let session = item.ParentIndexNumber;
            if (session != 1) {
                animeName += ' 第' + session + '季';
            }
            if (session == 0){
                animeName += ' ova';
            }
            let _name_key = '_anime_name_rel_' + item.SeasonId;
            if (window.localStorage.getItem(_name_key)) {
                animeName = window.localStorage.getItem(_name_key);
            }


        } else {
            video_id = item.Id;
            animeName = item.Name;
            episode = 'movie';
        }

        let export_url = prompt('请输入引用的第三方视频网址(支持: 腾讯, 爱奇艺, 优酷)\n 爱奇艺列表: base_info?entity_id=', '');
        if(export_url != ''){
            let data = {
                "id": video_id,
                "title": animeName,
                "episode": episode,
                "export_url": export_url
            };
            let options = {
                method: "POST",
                body: JSON.stringify(data),
                headers: new Headers({
                                'Content-Type': 'application/json'
                              })
            };

            let response = await fetch(api_url + "danmuku?type=export", options);
            if(response.status == 200){
                let data = await response.json();
                console.log(data);
                if(data["status"] == "success"){
                    console_log("成功引用第三方弹幕数量:" + data["count"]);
                    reloadDanmaku('reload');
                }
                else{
                    console_log("引用第三方弹幕失败");
                }
            }

        }

    }

    function translateButtonClick() {
        if (window.ede.reloading) {
            console_log('正在重新加载,请稍后再试');
            return;
        }
        console_log('切换简繁转换');
        window.ede.chConvert = (window.ede.chConvert + 1) % 3;
        window.localStorage.setItem('chConvert', window.ede.chConvert);
        document.querySelector('#translateDanmaku').setAttribute('title', chConverTtitle[window.ede.chConvert]);
        reloadDanmaku('reload');
        console_log(document.querySelector('#translateDanmaku').getAttribute('title'));
    }

    function refreshButtonClick(){
        reloadDanmaku('reload');
    }

    function withButtonClick(){

        window.ede.withSwitch = (window.ede.withSwitch + 1) % 2;

        window.localStorage.setItem('withSwitch', window.ede.withSwitch);
        document.querySelector('#withDanmu').children[0].innerText = with_icon[window.ede.withSwitch];
        if(window.ede.withSwitch == 0){
            console_log('取消引用外部弹幕');
        }
        else{
            console_log('引用外部弹幕');
        }
        reloadDanmaku('reload');
    }

    function infoButtonClick() {
        console_log('设置弹幕');
        let limit = prompt('弹幕每秒数量(默认5):', window.ede.danmuLimit);

        if(limit != null){
            window.ede.danmuLimit = limit;
            window.localStorage.setItem('danmuLimit', window.ede.danmuLimit);
        }

        let size = prompt('弹幕大小(默认25):', window.ede.danmuSize);
        if(size != null){
            window.ede.danmuSize = size;
            window.localStorage.setItem('danmuSize', window.ede.danmuSize);
        }
        if(window.ede.offset == null)
            window.ede.offset = 0;

        window.ede.offset = prompt('弹幕时间偏移(单位:秒):', window.ede.offset);


    }

    function initListener() {
        let container = document.querySelector(mediaQueryStr);
        // 页面未加载
        if (!container) {
            if (window.ede.episode_info) {
                window.ede.episode_info = null;
            }
            return;
        }
        // 已初始化
        if (!container.getAttribute('ede_listening')) {
            //console_log('正在初始化Listener');
            container.setAttribute('ede_listening', true);
            container.addEventListener('click', pauseVideo);
            //console_log('Listener初始化完成');
            reloadDanmaku();
        }
    }

    function initUI() {

        // 页面未加载btnVideoOsdSettings
        if (!document.querySelector(uiQueryStr) && !document.querySelector(".btnVideoOsdSettings")) {
            return;
        }
        // 已初始化
        if (document.getElementById('danmakuCtr')) {
            return;
        }
        //console_log('正在初始化UI');

        // 弹幕按钮容器div

        let menubar = document.createElement('div');
        menubar.id = 'danmakuCtr';
        menubar.style.opacity = 0.5;
        // 弹幕开关
        displayButtonOpts.innerText = danmaku_icon[window.ede.danmakuSwitch];
        menubar.appendChild(createButton(displayButtonOpts, displayButtonClick));
        // 手动匹配
        menubar.appendChild(createButton(searchButtonOpts, searchButtonClick));
        // 本地弹幕
        menubar.appendChild(createButton(localButtonOpts, localButtonClick));
        //引用弹幕
        menubar.appendChild(createButton(exportButtonOpts, exportBUttonClick));
        //重载弹幕
        menubar.appendChild(createButton(refreshButtonOpts, refreshButtonClick));
        //自动外部
        menubar.appendChild(createButton(autoexportButtonOpts, autoexportBUttonClick));
        //外部弹幕
        withButtonOpts.innerText = with_icon[window.ede.withSwitch];
        menubar.appendChild(createButton(withButtonOpts, withButtonClick));
        // 简繁转换
        //translateButtonOpts.title = chConverTtitle[window.ede.chConvert];
        //menubar.appendChild(createButton(translateButtonOpts, translateButtonClick));
        // 弹幕信息
        menubar.appendChild(createButton(infoButtonOpts, infoButtonClick));

        if(document.querySelector(uiQueryStr)){
            let parent = document.querySelector(uiQueryStr).parentNode.parentNode;
            parent.append(menubar);
        }
        else{
            let parent2 = document.querySelector(".videoosd-tabsslider");
            parent2.appendChild(menubar);
            console_log("UI电视模式");
        }
        //console_log('UI初始化完成');


        fristLoad();

    }


    async function fristLoad(){

        // let item =await getEmbyItemInfo();
        // let _id;
        // if (item.Type == 'Episode') {
        //     _id = item.SeasonId;
        // } else {
        //     _id = item.Id;
        // }
        // reloadDanmaku();
    }

    function sendNotification(title, msg) {
        const Notification = window.Notification || window.webkitNotifications;
        //console_log(msg);
        if (Notification.permission === 'granted') {
            return new Notification(title, {
                body: msg,
            });
        } else {
            Notification.requestPermission((permission) => {
                if (permission === 'granted') {
                    return new Notification(title, {
                        body: msg,
                    });
                }
            });
        }
    }

    function danmuPrompt(title, data, defaultValue) {
			  return new Promise((resolve, reject) => {
                const randomValue = Math.random();
				// 创建弹出框容器
				const container = document.createElement('div');
				container.style.position = 'fixed';
				container.style.top = '30%';
				container.style.left = '50%';
				container.style.transform = 'translate(-50%, -50%)';
				container.style.backgroundColor = '#0e0e0e';
                container.style.borderRadius = "10px";
				container.style.padding = '3px';
				container.style.border = '1px solid black';
				container.style.zIndex = 1000;
                container.style.textAlign = 'center';

				// 创建标题元素
				const titleElement = document.createElement('h3');
				titleElement.style.textAlign = 'center';
				titleElement.textContent = title;
				container.appendChild(titleElement);

                // 创建选项列表元素
				const ulElement = document.createElement('ul');
                ulElement.style.textAlign = 'left';
                ulElement.id = 'prompt-ul';
                ulElement.style.maxHeight = '300px';
                ulElement.style.width = '400px';
                ulElement.style.overflowY = 'auto';
				let index = 0;
				data.forEach(item => {
				  index = index + 1;
				  const liElement = document.createElement('li');
				  liElement.textContent = index + ":" + item;
				  liElement.style.listStyleType = 'none';
                  liElement.style.cursor = 'pointer';
				  liElement.setAttribute('index', index);
				  liElement.addEventListener('click', function() {
					let input = document.getElementById('prompt-input');
					let value = this.getAttribute('index');
					input.value = value;
					console.log('li元素的内部文本是：' + this.index);
					
					
					if(isInteger(value) && parseInt(value)> 0){
                        value = parseInt(value);

                        let listItems = document.querySelectorAll('#prompt-ul li');
                        let ul = document.getElementById('prompt-ul');
                        for (let i = 0; i < listItems.length; i++) {
                            if (i + 1 === value) {
                                listItems[i].classList.add('selected');
                                // 获取li元素在ul中的高度
                                let liHeight = listItems[i].offsetTop;
                                console.log(liHeight);
                                // 滚动到该高度
                                ul.scrollTop = Math.max(liHeight - 200, 0);
                            } else {
                                listItems[i].classList.remove('selected');
                            }
                        }
                    }
					
				  });
				  ulElement.appendChild(liElement);
				});
				container.appendChild(ulElement);

				// 创建输入框元素
				const inputElement = document.createElement('input');
				inputElement.style.borderRadius = "10px";
				inputElement.style.fontSize = "2em";
				inputElement.style.paddingLeft = "10px";
                inputElement.id = "prompt-input";
				inputElement.type = 'text';
                // 为input元素添加键盘按下事件监听器
                inputElement.addEventListener("keydown", function(event){
                    // // 判断按下的键是否为回车键或上下左右4个方向键
                    // if (event.key === "Enter" || event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    //     // 在这里执行相应的操作
                    //     console.log("按下了回车键或方向键");
                    //     // 阻止事件继续传递
                    //     event.stopPropagation();
                    //     let btn = document.getElementById('prompt-okbtn');
                    //     btn.focus();
                    // }
                    if (event.key === "Enter"){
                        console.log("按下了回车键或方向键");
                        let btn = document.getElementById('prompt-okbtn' + randomValue);
                        btn.focus();
                    }

                });

                inputElement.addEventListener('input', function(e){
                    let value = e.target.value;
                    if(value.charAt(0) === '-' || value.charAt(0) === '0' || value.charAt(0) === '+' ){
                        if(value.charAt(0) === '+'){
                            let v2 = value.substring(1);
                            if(isInteger(v2) && isInteger(defaultValue)){
                                value = parseInt(defaultValue) + parseInt(v2);
                            }
                        }
                        else{
                            let v2 = value.substring(1);
                            if(isInteger(v2) && isInteger(defaultValue)){
                                value = parseInt(defaultValue) - parseInt(v2);
                            }
                        }
                    }

                    if(isInteger(value) && parseInt(value)> 0){
                        value = parseInt(value);

                        let listItems = document.querySelectorAll('#prompt-ul li');
                        let ul = document.getElementById('prompt-ul');
                        for (let i = 0; i < listItems.length; i++) {
                            if (i + 1 === value) {
                                listItems[i].classList.add('selected');
                                // 获取li元素在ul中的高度
                                let liHeight = listItems[i].offsetTop;
                                console.log(liHeight);
                                // 滚动到该高度
                                ul.scrollTop = Math.max(liHeight - 200, 0);
                            } else {
                                listItems[i].classList.remove('selected');
                            }
                        }
                    }

                });

				container.appendChild(inputElement);


                const pElement = document.createElement('br');
                container.appendChild(pElement);


				// 添加关闭按钮
				// const closeButton = document.createElement('button');
				// closeButton.textContent = '关闭';
				// closeButton.onclick = () => {
				//   document.body.removeChild(container);
				//   resolve(null);
				// };
				// container.appendChild(closeButton);

                // 创建一个遮罩层元素
                const maskLayer = document.createElement('div');
                maskLayer.style.position = 'fixed';
                maskLayer.style.top = '0';
                maskLayer.style.left = '0';
                maskLayer.style.width = '100%';
                maskLayer.style.height = '100%';
                maskLayer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                maskLayer.style.zIndex = '3';
                document.body.appendChild(maskLayer);

				// 添加确定按钮
				const okButton = document.createElement('button');
				okButton.textContent = '确定';
                okButton.id = 'prompt-okbtn' + randomValue;
                okButton.style.fontSize = "2em";
                okButton.style.borderRadius = "10px";
				okButton.onclick = () => {
                    document.body.removeChild(maskLayer);
                    document.body.removeChild(container);
                    resolve(inputElement.value);
				};
				container.appendChild(okButton);


                // 创建一个新的<style>元素
                let style = document.createElement('style');

                // 设置<style>元素的内容
                style.innerHTML = `
                  #prompt-ul .selected{
                    background-color: lightblue;
                  }
                `;
                document.head.appendChild(style);



				// 将弹出框添加到页面中
				document.body.appendChild(container);
                // 添加焦点
                inputElement.focus();
                okButton.setAttribute("tabIndex", "0");
                // 设置默认值
                inputElement.value = defaultValue;
                let event = new Event('input', { 'bubbles': true, 'cancelable': true });
                inputElement.dispatchEvent(event);
			  });
			}
    function showObjectAsString(obj) {
        // 将对象转换为字符串
        const str = JSON.stringify(obj);

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '30%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.backgroundColor = '#0e0e0e';
        container.style.borderRadius = "10px";
        container.style.padding = '3px';
        container.style.border = '1px solid black';
        container.style.zIndex = 1000;
        container.style.textAlign = 'center';


        const richText = document.createElement('textarea');
        richText.setAttribute('id', 'richText');
        richText.setAttribute('class', 'richText');
        richText.style.width = "800px";
        richText.style.height = "800px";
        richText.value = str;
        container.append(richText);
        // 将弹出框添加到页面中
        document.body.appendChild(container);
    }

    function getEmbyItemInfo() {

        return window.require(['pluginManager']).then((items) => {


            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                for (let j = 0; j < item.pluginsList.length; j++) {
                    const plugin = item.pluginsList[j];
                    if (plugin.hasOwnProperty("streamInfo") && plugin.streamInfo.hasOwnProperty("item")){
                        return plugin.streamInfo.item;
                    }

                    // if(window.device == "app"){
                    //     if (plugin.id == 'exovideoplayer') {
                    //
                    //         return plugin.streamInfo.item;
                    //     }
                    // }
                    // else{
                    //     if (plugin.id == 'htmlvideoplayer') {
                    //         return plugin._currentPlayOptions.item;
                    //     }
                    // }
                }
            }
        });
    }

    async function getEpisodeInfo(is_auto = true) {
        let item = await getEmbyItemInfo();
        const html = document.documentElement.outerHTML;
        // showObjectAsString(html);
        let _id;
        let animeName;
        let anime_id = -1;
        let episode =1;
        let true_episode = 0;
        if (item.Type == 'Episode') {
            _id = item.SeasonId;
            animeName = item.SeriesName;
            episode = item.IndexNumber;
            true_episode = item.IndexNumber;
            let session = item.ParentIndexNumber;
            if (session != 1) {
                animeName += '第' + session + '季';
            }
            if (session == 0){
                episode.to
                episode = episode.toString().substr(1);
                console.log("第0季剧集");
            }
        } else {
            _id = item.Id;
            animeName = item.Name;
            episode = 'movie';
        }
        let _id_key = '_anime_id_rel_' + _id;
        let _name_key = '_anime_name_rel_' + _id;
        let _autoload_key = '_anime_autoload_rel_' + _id;
        let _episode_key = '_episode_key_' + _id;
        if (window.localStorage.getItem(_id_key)) {
            anime_id = window.localStorage.getItem(_id_key);
        }
        if (window.localStorage.getItem(_name_key)) {
            animeName = window.localStorage.getItem(_name_key);
        }
        // if (episode >= 200){
        //     // 集数过大, 把集数也放到查询关键词中并将episode重置为1
        //     animeName = `${item.SeriesName} ${episode}`;
        //     episode = 1;
        // }

        if (!is_auto) {
            //animeName = prompt('确认动画名:', animeName);
			let anime_split_name = splitString(animeName);
            //animeName = await danmuPrompt('确认动画名:', [], animeName);
			animeName = await danmuPrompt('确认动画名:', anime_split_name, animeName);
			if(isInteger(animeName) && parseInt(animeName)> 0){
				animeName = anime_split_name[animeName];
			}
        }
		
        //let searchUrl = 'https://api.acplay.net/api/v2/search/episodes?anime=' + animeName + '&withRelated=true';
        let searchUrl = api_url + 'danmuku?type=search&keyword=' + animeName + '&withRelated=true';
        if (is_auto) {
            
			let episode2 = window.localStorage.getItem(_episode_key);
            if(episode2 != null && (episode2.charAt(0) === '-' || episode2.charAt(0) === '0' || episode2.charAt(0) === '+' )){
                if(episode2.charAt(0) === '+' ){
                    episode2 = episode2.substring(1);
                    console.log("偏差 + " + episode2);
                    let e  = parseInt(episode) + parseInt(episode2);
                    episode = e;
                }
                else{
                    episode2 = episode2.substring(1);
                    console.log("偏差 - " + episode2);
                    let e  = parseInt(episode) - parseInt(episode2);
                    if(e>= 1){
                        episode = e;
                    }
                    else{
                        console_log("偏差后数值小于1, 使用源生剧集")
                    }
                }


            }
            searchUrl += '&episode=' + episode + "&animeid=" + anime_id;
        }
        let animaInfo = await fetch(searchUrl).then((response) => response.json());
        //console_log('查询成功');
        if(is_auto && animaInfo.animes.length == 0 && animeName.indexOf("第")>=0 && animeName.indexOf("季")>=0 ){

            searchUrl = `${api_url}danmuku?type=search&keyword=${item.SeriesName}&episode=${episode}`;
            animaInfo = await fetch(searchUrl).then((response) => response.json());
            if(animaInfo.animes.length > 0){
                // console_log("季查找未找到, 移除重查");
                // console_log(animaInfo.animes[0].animeTitle);
                window.localStorage.setItem(_id_key, animaInfo.animes[0].animeId);
                window.localStorage.setItem(_name_key, animaInfo.animes[0].animeTitle);
                window.localStorage.setItem(_autoload_key, "1");
            }

        }
        //console_log(animaInfo);
        let selecAnime_id = 1;
        if (anime_id != -1) {

            for (let index = 0; index < animaInfo.animes.length; index++) {
                if (animaInfo.animes[index].animeId == anime_id) {
                    selecAnime_id = index + 1;
                }
            }

        }
        if (!is_auto) {
            let anime_lists_str = list2string(animaInfo);
            console.log(animaInfo);
            let anime_lists = getAnimes(animaInfo);
            console.log(anime_lists);
            //selecAnime_id = prompt('选择:\n' + anime_lists_str, selecAnime_id);
            selecAnime_id = await danmuPrompt('选择:', anime_lists, selecAnime_id);

            selecAnime_id = parseInt(selecAnime_id) - 1;
            window.localStorage.setItem(_id_key, animaInfo.animes[selecAnime_id].animeId);
            window.localStorage.setItem(_name_key, animaInfo.animes[selecAnime_id].animeTitle);
            window.localStorage.setItem(_autoload_key, "1");


            let episode_lists_str = ep2string(animaInfo.animes[selecAnime_id].episodes);
            let ep_lists = getEps(animaInfo.animes[selecAnime_id].episodes);
            console.log(ep_lists);
            if(episode == "movie")
                episode = 1;
			await sleep(500);
			
			let e3 = window.localStorage.getItem(_episode_key);
			let episode2 = 0;
			if(e3 != null && (e3.charAt(0) === '-' || e3.charAt(0) === '0' || e3.charAt(0) === '+' )){
				episode2 = await danmuPrompt('确认集数:', ep_lists, parseInt(e3));
			}
            //let episode2 = prompt('确认集数:\n' + episode_lists_str, parseInt(episode));
            else{
				episode2 = await danmuPrompt('确认集数:', ep_lists, parseInt(episode));
			}
            if(episode2.charAt(0) === '-' || episode2.charAt(0) === '0' || episode2.charAt(0) === '+' ){
                if(episode2.charAt(0) === '+' ){
                    window.localStorage.setItem(_episode_key, episode2);
                    episode2 = episode2.substring(1);
                    console.log("偏差 + " + episode2);
                    episode = parseInt(episode) + parseInt(episode2);
                }
                else{
                    window.localStorage.setItem(_episode_key, episode2);
                    episode2 = episode2.substring(1);
                    console.log("偏差 - " + episode2);
                    episode = parseInt(episode) - parseInt(episode2);
                }

            }
            else{
                window.localStorage.setItem(_episode_key, null);
                episode = episode2;
            }
            console.log("当前集数: " + episode);
            episode = parseInt(episode) - 1;

        } else {
            //selecAnime_id = parseInt(episode);
            //selecAnime_id = parseInt(selecAnime_id) - 1;
			//selecAnime_id = parseInt(episode) - 1;
			selecAnime_id = 0;
            console.log("当前集数: " + episode);
            episode = parseInt(episode) - 1;
        }
        try {
            let episodeInfo = {};
            if(selecAnime_id in animaInfo.animes){
                episodeInfo = {
                    episode: true_episode,
                    episodeId: animaInfo.animes[selecAnime_id].episodes[episode].episodeId,
                    animeTitle: animaInfo.animes[selecAnime_id].animeTitle,
                    episodeTitle: animaInfo.animes[selecAnime_id].type == 'tvseries' ? animaInfo.animes[selecAnime_id].episodes[episode].episodeTitle : null,
                };
            }
            else{
                episodeInfo = {
                    episode: true_episode,
                    episodeId: item.Id,
                    animeTitle: "",
                    episodeTitle: "未知"
                }
            }
            return episodeInfo;
        } catch (error) {
            console.error("处理剧集信息时出错:", error);
            // 返回一个默认的错误处理对象
            return {
                episode: true_episode,
                episodeId: "error",
                animeTitle: "错误",
                episodeTitle: "处理剧集信息失败"
            };
        }
        // let episodeInfo = {};
        // if(selecAnime_id in animaInfo.animes){
        //     episodeInfo = {
        //         episode: true_episode,
        //         episodeId: animaInfo.animes[selecAnime_id].episodes[episode].episodeId,
        //         animeTitle: animaInfo.animes[selecAnime_id].animeTitle,
        //         episodeTitle: animaInfo.animes[selecAnime_id].type == 'tvseries' ? animaInfo.animes[selecAnime_id].episodes[episode].episodeTitle : null,
        //     };
        // }
        // else{
        //     episodeInfo = {
        //         episode: true_episode,
        //         episodeId: item.Id,
        //         animeTitle: "",
        //         episodeTitle: "未知"
        //     }
        // }

        return episodeInfo;
    }

    async function getComments(episodeInfo) {
        let episodeId = episodeInfo.episodeId;
        //let url = 'https://api.xn--7ovq92diups1e.com/cors/https://api.acplay.net/api/v2/comment/' + episodeId + '?withRelated=true&chConvert=' + window.ede.chConvert;
        let withRelated = "true";
        if(window.ede.withSwitch == 0)
            withRelated = "false";
        let title = episodeInfo.animeTitle;
        let ep = episodeInfo.episode;
        let item = await getEmbyItemInfo();
        let id = item.Id;
        let url = `${api_url}danmuku?type=comment&id=${id}&episodeId=${episodeId}&withRelated=${withRelated}&chConvert=${window.ede.chConvert}`;
        //url = url + `&title=${title}&ep=${ep}`;
        //let url = api_url + 'danmuku?type=comment&id='+ id +'&episodeId=' + episodeId + '&withRelated='+withRelated+'&chConvert=' + window.ede.chConvert;
        return fetch(url)
            .then((response) => response.json())
            .then((data) => {
            //console_log('弹幕加载成功: ' + data.comments.length);
            console.log(data.comments);
            let comments = data.comments;
                // 使用 filter 方法创建一个新的数组，其中不包含 comments 中包含 pb_list 中任意一个值的元素
            let saveComments = comments.filter(comment => !pb_list.some(item => comment["m"].includes(item)));
                let deletedComments = comments.filter(comment => pb_list.some(item => comment["m"].includes(item)));
                // 计算删除的元素数量
            //console_log('屏蔽弹幕数量:' + deletedComments.length);
            console.log(deletedComments);
            console_log(`集数:${episodeInfo.episode};弹幕数量${data.comments.length};屏蔽数量${deletedComments.length}`);
            if(data.comments.length == 0){
                //尝试自动引用外部弹幕
                autoexportBUttonClick();
            }

            return saveComments;
        });
    }

    function createDanmaku(comments) {
        let _comments = bilibiliParser(comments);

        //if(_comments.length >=5000){
        //_comments = _comments.slice(0,5000);
        //}
        _comments = danmuToDict(_comments)
        let _container = document.querySelector(mediaContainerQueryStr);
        // alert(`${_container.offsetWidth}  ${_container.offsetHeight}`);

        //let _media = document.querySelector(mediaQueryStr);

        console.log(_comments);
        window.ede.comments = _comments;
        if (window.ede.danmaku != null &&  $(mediaContainerQueryStr).attr("danmuku") == "open") {
            window.ede.danmaku.clear();
            window.ede.danmaku.stop();
            console.log("已清除弹幕");

        }
        else{
            window.ede.danmaku = Danmuku.create({
                height: 24,
                container:_container,
                rowGap:5,
                limit:60,
                capacity:50,
                interval:1,
                hooks: {
                    send (manager, data) {
                        //console.log(data);
                    },
                    barrageCreate (barrage, node) {
                        if (!barrage.isSpecial) {
                            //console.log(barrage.data) // -> { content: 'one' }
                            // 设置弹幕内容和样式
                            //node.textContent = barrage.data.text + " " + barrage.data.time;
                            node.textContent = barrage.data.text;

                            node.classList.add('barrage-style');
                            $.each(barrage.data.style, function(key,val){
                                node.style[key] = val;
                            });
                            node.style["font-size"] = window.ede.danmuSize + "px";
                            //console.log(`弹幕- 设定时间:${barrage.data.time}, 实际时间:${barrage.data.showtime}, 内容:${barrage.data.text}`);
                        }
                    }
                }
            });
        }
        $(mediaContainerQueryStr).attr("danmuku", "open");
        window.ede.danmaku.start();





        if(window.ede.danmakuSwitch == 1)
            window.ede.danmaku.show()
        else
            window.ede.danmaku.hidden();


        //建立一个窗口重绘的监视
        if (window.ede.ob) {
            window.ede.ob.disconnect();
        }
        window.ede.ob = new ResizeObserver(() => {
            if (window.ede.danmaku) {
                //console_log('Resizing');
                window.ede.danmaku.resize();
            }
        });
        window.ede.ob.observe(_container);
        //建立一个时间文本改变的监视 监视进度条的时间改变
        if (window.ede.timeOb) {
            window.ede.timeOb.disconnect();
        }
        let top_line = 0;
        window.ede.timeOb = new MutationObserver(() => {

            let playerTime = $(mediaVideoPositionStr).html();
            playerTime = getSec(playerTime);
            if(window.ede.playerTime != playerTime){
                window.ede.playerTime = playerTime;
                if(window.ede.offset == null)
                    window.ede.offset = 0;
                let offset = parseInt(window.ede.offset);
                let offset_player_time = playerTime + offset;
                if(offset_player_time in _comments){
                    let comment_list = _comments[offset_player_time];
                    if(comment_list){
                        for(let i=0;i<window.ede.danmuLimit;i++){
                            if(i in comment_list){
                                let msg = comment_list[i];
                                msg.showtime = playerTime;
                                window.ede.danmaku.send(msg);
                            }
                        }
                    }

                }
                //设置高级(顶部)弹幕，每秒只允许1条
                if((offset_player_time+"_top") in _comments){
                    let comment_special = _comments[offset_player_time+"_top"][random(0, _comments[offset_player_time+"_top"].length)];
                    if(comment_special != null){
                        console.log(comment_special);
                        window.ede.danmaku.sendSpecial({
                            duration: random(3, 5),
                            direction: "none",
                            position (barrage) {
                                if(top_line >= 10)
                                    top_line = 1;
                                else
                                    top_line = top_line + 1;
                                return {
                                    x: window.ede.danmaku.containerWidth / 2 - comment_special.text.length * 25 / 2,
                                    y: 24 * (top_line -1),
                                }
                            },
                            hooks: {
                                create (barrage, node) {
                                    node.textContent = comment_special.text;
                                    $.each(comment_special.style, function(key,val){
                                        node.style[key] = val;
                                    });
                                    node.classList.add('special-barrage');
                                    //console.log(`弹幕- 设定时间:${comment_special.time}, 实际时间:${playerTime}, 内容:${comment_special.text}`);
                                },
                                destroy () {
                                    //console.log('高级弹幕销毁');
                                }
                            }
                        });
                    }

                }
            }
        });
        let config = {
            characterData: true,
            subtree: true,
            childList: true
        };
        let timeDiv = document.querySelector(mediaVideoPositionStr);
        window.ede.timeOb.observe(timeDiv, config);
        window.ede.playerTime = -1;
        //建立一个剧集改变的监视
        if (window.ede.epOb) {
            window.ede.epOb.disconnect();
        }
        window.ede.epOb = new MutationObserver(() => {
            reloadDanmaku();
            //console_log("视频已切换");
        });

        let epDiv = document.querySelector(mediaVideoTitleStr);
        window.ede.epOb.observe(epDiv, config);
    }

    function reloadDanmaku(type = 'check') {
        // if (window.ede.reloading) {
        //     console_log('正在重新加载,请稍后再试');
        //     return;
        // }
        window.ede.reloading = true;
        getEpisodeInfo(type != 'search')
            .then((info) => {
            return new Promise((resolve, reject) => {

                if (type != 'search' && type != 'reload' && window.ede.danmaku && window.ede.episode_info && window.ede.episode_info.episodeId == info.episodeId && $(mediaContainerQueryStr).attr("danmuku") == "open") {
                    reject('当前播放视频未变动');
                } else {
                    window.ede.comments = [];
                    console.log("弹幕已清理")
                    window.ede.episode_info = info;
                    resolve(info);
                }
            });
        })
            .then(
            (episodeInfo) => getComments(episodeInfo).then((comments) => createDanmaku(comments)),
            (msg) => {
                console.log(msg);
            }
        )
            .then(() => {
            window.ede.reloading = false;
            if (document.getElementById('danmakuCtr').style.opacity != 1) {
                document.getElementById('danmakuCtr').style.opacity = 1;
            }
        });
    }


    function pauseVideo(){
        let videoPause = $(".videoOsd-btnPause");
        //reloadDanmaku();
        if(videoPause.attr("title") == "播放"){
            if (window.ede.danmaku != null) {
                window.ede.danmaku.start();
            }
        }
        else{
            if (window.ede.danmaku != null) {
                window.ede.danmaku.stop();
            }
        }
    }


    function bilibiliParser($obj) {
        //const $xml = new DOMParser().parseFromString(string, 'text/xml')
        return $obj
            .map(($comment) => {
            const p = $comment.p;
            //if (p === null || $comment.childNodes[0] === undefined) return null
            const values = p.split(',');
            const mode = { 6: 'ltr', 1: 'rtl', 5: 'top', 4: 'bottom' }[values[1]];
            if (!mode) return null;
            //const fontSize = Number(values[2]) || 25
            const fontSize = 25;
            const color = `000000${Number(values[2]).toString(16)}`.slice(-6);
            return {
                text: $comment.m,
                mode,
                time: values[0] * 1,
                style: {
                    fontSize: `${fontSize}px`,
                    color: `#${color}`,
                    textShadow:
                    color === '00000' ? '-1px -1px #fff, -1px 1px #fff, 1px -1px #fff, 1px 1px #fff' : '-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000',

                    font: `${fontSize}px sans-serif`,
                    fillStyle: `#${color}`,
                    strokeStyle: color === '000000' ? '#fff' : '#000',
                    lineWidth: 2.0,
                },
            };
        })
            .filter((x) => x);
    }

    function danmuToDict(comments){
        //将弹幕转换成根据秒速的字典
        let dict = new Array();
        comments.forEach(item => {
            let commentTime = parseInt(item.time);
            let mode = "";
            if(item.mode == "top")
                mode = "_top";
            if(((commentTime + mode) in dict)==false){
                dict[commentTime + mode] = new Array();
            }
            dict[commentTime + mode].push(item);
        });
        return dict;

    }

    function list2string($obj2) {
        const $animes = $obj2.animes;
        let anime_lists = $animes.map(($single_anime) => {
            return $single_anime.animeTitle + ' 类型:' + $single_anime.typeDescription;
        });
        let anime_lists_str = '1:' + anime_lists[0];
        for (let i = 1; i < anime_lists.length; i++) {
            anime_lists_str = anime_lists_str + '\n' + (i + 1).toString() + ':' + anime_lists[i];
        }
        return anime_lists_str;
    }

    function getAnimes($obj2) {
        const $animes = $obj2.animes;
        let anime_lists = $animes.map(($single_anime) => {
            return $single_anime.animeTitle + ' 类型:' + $single_anime.typeDescription;
        });
        return anime_lists;
    }

    function sleep(time){
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, time);
      });
    }

    function ep2string($obj3) {
        const $animes = $obj3;
        let anime_lists = $animes.map(($single_ep) => {
            return $single_ep.episodeTitle;
        });
        let ep_lists_str = '1:' + anime_lists[0];
        for (let i = 1; i < anime_lists.length; i++) {
            if(i>=5){
                ep_lists_str = ep_lists_str + '\n' + "...";
                ep_lists_str = ep_lists_str + '\n' + (anime_lists.length-1).toString() + ':' + anime_lists[anime_lists.length-2];
                ep_lists_str = ep_lists_str + '\n' + (anime_lists.length).toString() + ':' + anime_lists[anime_lists.length-1];
                break;
            }
            else{
                ep_lists_str = ep_lists_str + '\n' + (i + 1).toString() + ':' + anime_lists[i];
            }
        }
        return ep_lists_str;
    }

    function getEps($obj3){
        const $animes = $obj3;
        let anime_lists = $animes.map(($single_ep) => {
            return $single_ep.episodeTitle;
        });
        return anime_lists;
    }

    function isInteger(str) {
      return /^-?\d+$/.test(str);
    }


    function getSec(time) {
        let timeSplit = time.split(":");
        if(timeSplit.length == 3){
            var hour = time.split(":")[0];
            var min = time.split(":")[1];
            var sec = time.split(":")[2];
            var s = parseInt(parseFloat(hour * 3600) + parseFloat(min * 60) + parseFloat(sec));
            return s;
        }
        if(timeSplit.length == 2){
            var min = time.split(":")[0];
            var sec = time.split(":")[1];
            var s = parseInt((parseFloat(min * 60) + parseFloat(sec)));
            return s;
        }
        return 0;

    }

    async function getEmbyItem(){
        // 获取当前媒体信息
        let userId = window.ApiClient._serverInfo.UserId;
        let itemId = /\?id=(\d*)/.exec(window.location.hash)[1];
        let response = await window.ApiClient.getItem(userId, itemId);
        console.log(response);
        return response;
    }

    function checkDc(path){
        const arr = ["普通AV"];
        // 判断一个path 是否可以解码
        for (let i = 0; i < arr.length; i++) {
        if (path.includes(arr[i])) {
                return true;
            }
          }
          return false;
    }

    function getFanhao(str) {
      const index = str.indexOf(' ');
      if (index === -1) {
        return str;
      } else {
        return str.slice(0, index);
      }
    }

    async function setAvChange(){

        // 添加av解码按钮
        let item = await getEmbyItem();
        let path = item.Path;
        let fanhao = getFanhao(item.Name);
        if(checkDc(path)){
            let option = {
                "group_name": "tool",
                "group_title": "工具",
                "name": "decode_av",
                "title": "解码AV",
                "value": `${api_url}api${api_key}?type=dcav&path=${path}`
            };
            addLinksSection(option);

            addLinksSection({
                "group_name": "tool",
                "group_title": "工具",
                "name": "niya_search",
                "title": "niya查询",
                "value": `https://sukebei.nyaa.si/?f=0&c=0_0&q=${fanhao}`
            });
			
			addLinksSection({
                "group_name": "tool",
                "group_title": "工具",
                "name": "tukube_search",
                "title": "tukube查询",
                "value": `https://tktube.com/zh/search/${fanhao.replace("-", "--")}/`
            });

           addLinksSection({
                "group_name": "tool",
                "group_title": "工具",
                "name": "niya_search",
                "title": "niya查询",
                "value": `https://sukebei.nyaa.si/?f=0&c=0_0&q=${fanhao}`
            });
        }

    }

    function addLinksSection(option){
        /*
        * option{
        *   group_name: 分类名称
        *   group_title: 分类标题 cn
        *   name: 数据名称
        *   title: 数据标题 cn
        *   value: 数据值  url
        * }
        * */

        // 向linksSection 中添加指定元素
        $(".linksSection").each(function() {
            let links_section = $(this);
            if(links_section.find("." + option.group_name).length == 0){
                // 添加分类项
                let html = `<h2 class="sectionTitle padded-left padded-right " style="margin-bottom:.4em;">${option.group_title}</h2>`;
                html += `<div class="itemLinks padded-left padded-right focusable ${option.group_name}" data-focusabletype="nearest"></div>`;
                links_section.append(html);
            }
            if(links_section.find("." + option.name).length == 0){
                // 添加元素
                let html = `<a is="emby-linkbutton" class="raised item-tag-button nobackdropfilter emby-button ${option.name}" href="${option.value}" target="_blank"><i class="md-icon button-icon button-icon-left">link</i>${option.title}</a>`;
                let group_div = links_section.find("." + option.group_name);
                group_div.append(html);
            }
        });
    }

    async function setLink(){

        $(".linksSection").each(function() {
            let links_section = $(this);
            if (links_section.find(".bgm-link").length == 0) {
                links_section.removeClass("hide");
                let search_h1 = links_section.parent().parent().parent().parent().parent().find(".itemName-primary");
				let search = "";
				if(search_h1.find("a").length>0)
					search = search_h1.find("a").eq(0).html();
				else
					search = search_h1.text();
				console.log(search);
                setAvChange()
                let href = `https://bangumi.tv/subject_search/${search}?cat=2`;
                let fanzu_a = `<a is="emby-linkbutton" class="raised item-tag-button nobackdropfilter emby-button bgm-link" href="${href}" target="_blank"><i class="md-icon button-icon button-icon-left">link</i>番组计划</a>`;
                links_section.find(".itemLinks").append(fanzu_a);

                console.log("添加番组link");
            }
        });
    }
	
	function replaceChars(str, charArray) {
	  let result = '';
	  for (let i = 0; i < str.length; i++) {
		if (!charArray.includes(str[i])) {
		  result += str[i];
		}
	  }
	  return result;
	}

	
	
	function splitString(str) {
	  const specialChars = [' ', '.', '~', '。', '，', '～'];
	  let result = [str];
	  let temp = '';

	  for (let i = 0; i < str.length; i++) {
		if (specialChars.includes(str[i])) {
		  if (temp.length > 0) {
			if (temp.split('').filter(char => specialChars.includes(char)).length <= 2) {
			  temp = replaceChars(temp, specialChars);
			  result.push(temp);
			}
			temp = '';
		  }
		} else {
		  temp += str[i];
		}
	  }

	  if (temp.length > 0 && temp.split('').filter(char => specialChars.includes(char)).length <= 2) {
		result.push(temp);
	  }

	  return result;
	}


    while (!window.require) {
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!window.ede) {
        window.ede = new EDE(window);
        setInterval(() => {
            initListener();
        }, check_interval);
        setInterval(() => {
            initUI();
        }, check_interval);
        setInterval(() => {
            setLink();
        }, check_interval);
    }
}
 })();