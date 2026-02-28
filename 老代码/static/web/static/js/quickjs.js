// ==UserScript==
// @name         我的快捷脚本
// @namespace    http://tampermonkey.net/
// @version      0.21
// @description  2023-09-04
// @author       You
// @match        https://sukebei.nyaa.si/*
// @match        https://kp.m-team.cc/*
// @match        https://skyeysnow.com/*
// @match        https://azusa.ru/*
// @match        https://azusa.wiki/*
// @match        https://civitai.com/*
// @match        https://ani.gamer.com.tw/animeList.php*
// @require      http://libs.baidu.com/jquery/2.0.0/jquery.min.js
// @grant        none

// ==/UserScript==


const API_URL = 'https://home.ainizai0904.top:8071';
class JsTools{


    /**
    * 获取当前网址的 GET 参数值
    * @param {string} paramName 要获取的参数名称
    * @returns {string|null} 参数值，如果参数不存在则返回 null
    */
    getQueryParam(paramName) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(paramName);
    }

    /**
    * 获取字符串查找番号
    * @param {string} str 标题
    * @returns {string|null} 假定番号
    */
    getFanhao(str){
        if(typeof str == "string"){
            let reg = /[a-zA-Z]{2,6}-\d{2,6}/;
            let result = str.match(reg);
            if (result) {
                //console.log(result);
                let fanhao = result[0];
                return fanhao;
            } else {
                //console.log("匹配失败");
            }
        }
        return null;
    }

    /**
     * @function calculateHourDiff
     * @description 计算传入的时间戳与当前时间的小时插值
     * @param {number|string} timestamp - 要计算插值的时间戳 (单位: 秒)
     * @returns {number} - 与当前时间的小时插值
     */
    calculateHourDiff(timestamp) {
        if(this.tryConvertStringToInt(timestamp)>=0){
            // 获取当前时间的时间戳
            const currentTimestamp = Math.floor(Date.now() / 1000);
            // 计算时间差（以秒为单位）
            const timeDiffInSeconds = currentTimestamp - timestamp;
            // 转换为小时数
            const hourDiff = Math.floor(timeDiffInSeconds / 3600);
            return hourDiff;
        }
        else
            return 99999999
    }

    /**
    * 尝试转换字符串到int
    * @param {number|string} value
    * @returns {number} 参数值，如果参数不存在则返回 null
    */
    tryConvertStringToInt(value) {
    if (typeof value === 'string') {
        let result = Number(value);
        if (!isNaN(result)) {
            return result;
        }
    }
    if (typeof value== 'number')
        return value
    return -1;
}

    /**
    * api网址登录,未登录时将显示登录按钮
    * @returns 无
    */
    apiLogin(){
        let login_code = localStorage.getItem("login_code");
        if(login_code){
            // 计算时间差,超过2小时就重新登录
            let parts = login_code.split(".");
            let timestamp = parts.length >= 2 ? parts[1] : false;
            if(timestamp && this.calculateHourDiff(timestamp)<=2){
                localStorage.setItem("login_code", login_code);
            }
            else{
                login_code = null;
            }
        }
        // 如果 login_code 不存在，则从 get 请求的参数获取
        if (!login_code) {
            login_code = this.getQueryParam("login_code");
            if(login_code) localStorage.setItem("login_code", login_code);
        }

        let inner_text = "已登录" ;
        if(!login_code) inner_text = "登录到ex2.0";
        // 创建浮动框的样式
        let containerStyle = `
            position: fixed;
            top: 5px;
            left: 5px;
            width: 110px;
            height: auto;
            background-color: #fff;
            border: 1px solid #ccc;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
            z-index: 9999;`;
        // 创建登录按钮的样式
        let loginButtonStyle = `
            width: 100px;
            height: 30px;
            background-color: #4285f4;
            color: #fff;
            font-size: 14px;
            line-height: 30px;
            text-align: center;
            cursor: pointer;
            margin: 5px 5px;
            border-radius: 4px;`;
        // 创建浮动框容器元素
        let container = document.createElement("div");
        container.style.cssText = containerStyle;
        container.id = "control_div";
        // 创建登录按钮元素
        let loginButton = document.createElement("button");
        loginButton.innerText = inner_text;
        loginButton.style.cssText = loginButtonStyle;
        // 添加点击事件处理程序
        loginButton.addEventListener("click", function () {
            let url = window.location.href;
            let login_code_url = API_URL + "/login_code?source_url=" + encodeURIComponent(url);
            window.location.href = login_code_url;// 跳转到login_code页面
        });
        // 将登录按钮添加到浮动框容器中
        container.appendChild(loginButton);
        // 将浮动框容器添加到页面中
        document.body.appendChild(container);

    }

    /**
     *  在login按钮下面添加一些其他按钮
     *  @param {string} title
     *  @param  click_fun - 点击事件
     */
    addOtherBtn(title, click_fun){
        // 创建登录按钮的样式
        let buttonStyle = `
            width: 100px;
            height: 30px;
            background-color: #4285f4;
            color: #fff;
            font-size: 14px;
            line-height: 30px;
            text-align: center;
            cursor: pointer;
            margin: 5px 5px;
            border-radius: 4px;`;
        // 创建按钮元素
        let button = document.createElement("button");
        button.innerText = title;
        button.style.cssText = buttonStyle;
        button.addEventListener("click", click_fun);
        let control_div = document.getElementById("control_div");
        // 将button元素添加到control_div中
        control_div.appendChild(button);
    }

    /**
     * 添加自定义css
     * @returns 无
     */
    addCss(){
        let css = `
            .extags .tag { 
                display: inline-block;
                background-color: aqua;
                padding: 4px 11px;
                margin-bottom: 5px;
                margin-right: 2px;
                border-radius: 20px;
                font-size: 13px; 
                text-transform: capitalize;
                color: #506172;
                font-weight: 700;
                float: left;
            }
            #eximage_container{
                width:100%;
                height:100%;
                overflow-y:auto;
            }
            #eximage_container img {
                
                height: auto;
                margin: 10px;
            }
            .exfanhao{
                color:red;
                font-weight:bold;
            }
        `;

        // 创建一个新的style元素
        let style = document.createElement('style');
        style.innerHTML = css;
        // 将新创建的style元素添加到head元素中
        document.head.appendChild(style);
    }

    /**
    * 添加自定义css
    * @param {string} url - 传入链接
    * @returns 跳转链接
    */
    async getRedirectUrl(url){
        try {
            const response = await fetch(API_URL + '/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
                body: JSON.stringify({ type: 'get302', url: url })
            });
            const data = await response.json();
            return data.url.toString();
        }
        catch(error) {
            console.error(error);
            return "";
        }
    }




    /**
     * 弹出前景框
     * @param {number} w 宽度
     * @param {number} h 高度
     * @param {string} stype 类型  “text(富文本框)|images(图片列表)”
     * @param value 类型  根据前面类型决定，如果是text就是文本， images就是{"col": 列数, "images": []}
     * @returns 如果是text,就返回textarea的id，否则没有返回
     */
    showForegroundBox(w, h,stype,value){
        //allowTransparency='true' 设置背景透明
        $("<div   id='down_div' name='down_div' style='position:absolute;z-index:4;'   security='restricted' ></div>").prependTo('body');
        $("#down_div").css("width",w);
        $("#down_div").css("height",h);
        $("#down_div").css("background","white");
        let st=document.documentElement.scrollTop|| document.body.scrollTop;//滚动条距顶部的距离
        let sl=document.documentElement.scrollLeft|| document.body.scrollLeft;//滚动条距左边的距离
        let ch=document.documentElement.clientHeight;//屏幕的高度
        let cw=document.documentElement.clientWidth;//屏幕的宽度
        let objH=$("#down_div").height();//浮动对象的高度
        let objW=$("#down_div").width();//浮动对象的宽度
        let objT=Number(st)+(Number(ch)-Number(objH))/2;
        let objL=Number(sl)+(Number(cw)-Number(objW))/2;
        $("#down_div").css('left',objL);
        $("#down_div").css('top',objT);
        //添加背景遮罩
        $("<div id='down_divbg' style='background-color: Gray;display:block;z-index:3;position:absolute;left:0px;top:0px;filter:Alpha(Opacity=30);/* IE */-moz-opacity:0.4;/* Moz + FF */opacity: 0.4; '/>").prependTo('body');
        let bgWidth = Math.max($("body").width(),cw);
        let bgHeight = Math.max($("body").height(),ch);
        $("#down_divbg").css({width:bgWidth,height:bgHeight});
        //点击背景遮罩移除iframe和背景
        $("#down_divbg").click(function() {
            $("#down_div").remove();
            $("#down_divbg").remove();
        });
        //添加内部元素
        if(stype == "text"){
            let textarea = $('<textarea id="#foregroundTextBox" style="width:100%;margin: auto auto; height:100%;"></textarea>');
            textarea.val(value);
            $("#down_div").append(textarea);
            return document.getElementById("#foregroundTextBox");
        }
        if(stype == "images"){
            let div = $("<div id='eximage_container'></div>");
            let col = value["col"];
            let img_width = Math.floor( w / col) - 10 * col;
            for(let i in value["images"]){
                let src = value["images"][i];
                 let thumbnail= $("<img></img>");
                 thumbnail.attr("src", src);
                 thumbnail.css("width", img_width);
                 div.append(thumbnail);
            }
            $("#down_div").append(div);


        }
        return null;
    }

    /**
     * 根据番号设置info
     * @param {string} fanhao
     * @param img 需要设置的img元素
     * @param tags_div 需要插入tag的div
     * @returns
     */
    setAvInfo(fanhao,img, tags_div){
        let myclass = this;
        let login_code = localStorage.getItem("login_code");
        if(!login_code) return null;
        let url = API_URL + "/response?prefix=av&type=list"+"&fanhao=" + fanhao + "&login=" + login_code;
        fetch(url)
            .then(response => response.json())
            .then(data => {
            // 获取到数据后的操作
            //
            if(data.count>0){
                let div = $("<div class='extags'></div>");
                tags_div.append(div);
                let item = data["data"][0];
                let src = API_URL + "/response?prefix=av&type=thumb&aid="+item["aid"] + "&login=" + login_code;
                img.css("border", "2px solid yellow;");
                img.attr("data-src", src);
                img.attr("src", src);
                for(let i in item["tags"]){
                    let tag = item["tags"][i];
                    div.append("<span class='tag'>"+tag+"</span>");
                }
                img.on("error", function(){
                    let timestamp = new Date().getTime(); // 获取当前时间戳
                    let src = img.attr("data-src"); // 获取图像的src属性值
                    // 在src后面加上时间戳
                    let updatedSrc = src + '&timestamp=' + timestamp;
                    // 5 秒后重新请求加载图像
                    setTimeout(function() {
                        img.attr("src", updatedSrc);
                    }, 3000);
                });

                let parentAnchor = img.closest("a");

                parentAnchor.attr("href", "javascript:void(0);");
                parentAnchor.attr("title", item["title"]);
                parentAnchor.attr("aid", item["aid"]);
                parentAnchor.attr("nailnum", item["PicList"].length);
                parentAnchor.on("click", function(){
                    let nailnum = item["PicList"].length;
                    let images = [];
                    for(let i=0;i<nailnum;i++) {
                        let url = API_URL + "/response?type=loc.thumbnail&prefix=av&num="+(i+1)+ "&id="+ item["aid"] +"&login=" + login_code;
                        images.push(url);
                    }
                    myclass.showForegroundBox(1500, 600, "images", {"col": 3, "images": images});
                });

            }
        })
            .catch(error => {
            // 发生错误时的处理
            console.log("查询番号发生错误" + fanhao);
        });
    }


}


const jsTools = new JsTools();

(function() {
    jsTools.addCss();
    jsTools.apiLogin();
    let url = window.location.href;
    if (url.indexOf("m-team") >= 0 && (url.indexOf("torrents.php") >= 0 || url.indexOf("adult.php") >= 0)) {
        console.log("载入馒头脚本");
        metamLoad();
    } else if (url.indexOf("skyeysnow") >= 0) {
        console.log("载入天雪脚本");
        skyLoad();
    } else if (url.indexOf("nyaa") >= 0) {
        console.log("载入nyaa脚本");
        nyaaLoad();
    } else if (url.indexOf("civitai") >= 0) {
        console.log("载入civitai脚本");
        civitaiLoad();
    } else if (url.indexOf("ani.gamer") >= 0) {
        console.log("载入巴哈姆特脚本");
        bahaLoad();
    }
})();

function metamLoad(){
    //修改图片大小
    $("img[alt*='torrent']").css('width','auto');
    $("img[alt*='torrent']").css('height','auto');
    $("img[alt*='torrent']").css('max-width','600px');
    //添加一个批量下种子的按钮
    // jsTools.addOtherBtn("下种子", function (){
    //     let text = "";
    //     $("a[href*='download.php']").each(function(){
    //         let down= $(this);
    //         let href = down.attr("href");
    //         href = "https://kp.m-team.cc/" + href + "&passkey=449d09972fb9c84c745ec7cc8492e43b";
    //         text += href + "/r/n";
    //     });
    //     jsTools.showForegroundBox(1500, 200, "text", text);
    // });
    //为每个下载种子按钮修改为弹出为种子链接文档
    $("a[href*='download.php']").each(function(){
        let down= $(this);
        let href = down.attr("href");
        href = "https://kp.m-team.cc/" + href + "&passkey=449d09972fb9c84c745ec7cc8492e43b";
        let a = $('<a style="cursor:pointer;" down="'+ href +'"></a>');
        a.on('click', async function(){
            let href = $(this).attr("down");
            let textbox = jsTools.showForegroundBox(1500, 200, "text", "正在获取种子地址,请稍后")
            href = await jsTools.getRedirectUrl(href);
            textbox.value = href;
        });
        a.append('<img class="download" src="pic/trans.gif" style="padding-bottom: 2px;" alt="download" title="下载本种">');
        down.before(a);
        down.hide();
    });

    //为每个标题推理 是否有对应番号 并链接
    $(".embedded a[href*='details.php']:has(b)").each(function(){
        let title = $(this).attr("title");
        let fanhao = jsTools.getFanhao(title);
        if(fanhao){
            $(this).before("<p class='exfanhao'>"+ fanhao +"</p>");
            let img = $(this).closest("tr").find("img[alt*='thumbnail']");
            let div = $("<div style='width:300px;margin-left:10px;margin-top:20px;'></div>");
            jsTools.setAvInfo(fanhao, img, div);
            $(this).closest("td").append(div);

        }

    });
}

function skyLoad(){
    $("img[class='download']").each(function(){
    let a = $(this).parent();
    a.attr("data", a.attr("href"));
    a.attr("href", "javascript:void();");
    a.off("click");
    a.attr("onclick", "");
    a.on('click', function(){
        let href = "https://skyeysnow.com/" + a.attr("data") + "&passkey=ed7cdd12683e306eb52c";
        jsTools.showForegroundBox(600, 200, "text", href)
        });
    });
}

function nyaaLoad(){
    //修改图片大小
    $("img[alt*='Real Life']").css("width", "auto");
    $("img[alt*='Real Life']").css("height", "auto");
    $("img[alt*='Real Life']").css("max-width", "500px");
    //插入一个批量获取种子的按钮
    jsTools.addOtherBtn("批量下载", function(){
         let batch_magnet = "";
        // 遍历选中的复选框
        $('input[name="batchdown"]:checked').each(function() {
            // 获取其所在行（tr）
            let row = $(this).closest('tr');
            // 获取行中的第二个 a 标签（索引为1）
            let magnet = row.find('td:eq(2) a:eq(1)').attr('href');
            batch_magnet = batch_magnet + magnet + "\r\n";
        });
        jsTools.showForegroundBox(1500, 200, "text", batch_magnet);
    });
    $("<th>").text("Batch").css("width", "50").appendTo(".torrent-list thead tr");
    $(".torrent-list tbody tr").each(function() {
        $("<td>").addClass("text-center").append("<input type='checkbox' name='batchdown'>").appendTo(this);
    });
    //去广告
    $("div[class='container']").children().each(function(){
        if($(this).attr("id")!=null){
            $(this).css("display", "none");
        }
    });
    //下载种子的链接
    $("td[class='text-center']").each(function(){
        let td = $(this);
        let aa = $(this).find("a").eq(1);
        if(aa.length>0){
            let a = $('<a  style="cursor:pointer;"><i class="fa fa-fw fa-copy"></i></a>');
            a.attr("down", aa.attr("href"));
            a.on("click", function(){
                let href = $(this).attr("down");
                jsTools.showForegroundBox(1500, 200, "text", href)
            });
            td.append(a);
        }
    });

    //番号查找
    $("td[colspan='2'] a").each(function(){
        let str = $(this).html();
        let fanhao = jsTools.getFanhao(str);
        if (fanhao){
            $(this).before("<p class='exfanhao'>"+ fanhao +"</p>");
            let img = $(this).closest("tr").find("img").eq(0);
            let div = $("<div style='width:300px;margin-left:10px;margin-top:20px;'></div>");
            jsTools.setAvInfo(fanhao, img, div);
            $(this).after(div);
        }
    });
}

function civitaiLoad(){
    setInterval(function(){
        if(window.location.href.indexOf("models")>0){
        let change = false;
        $(".mantine-mefm9g canvas").each(function(){
            let div = null;
            if(change == false){
                div = $(this).parents(".mantine-mefm9g:first").find(".mantine-1p9khi6").eq(0);
                if($(this).parents(".mantine-mefm9g:first").find("img").length == 0){
                    console.log($(this).parents(".mantine-mefm9g:first").find("a").eq(0).attr("href"));
                    div.click();
                    change = true;
                }
            }
        });
        }
        else{
            let change = false;
            $(".mantine-AspectRatio-root canvas").each(function(){
                if(change == false){
                    let div = $(this).parent().prev().find("div").eq(0);
                    console.log(div);
                    div.click();
                }
            });
        }
    }, 100);

}

function bahaLoad(){
    setInterval(function(){
        $(".theme-name").css("height", "40px");
    }, 1000);

}





















