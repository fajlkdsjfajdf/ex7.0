$(function(){
    window.auto_translator = false;
    window.auto_decode = false;
	
    //pageMode(getCookie(window.prefix+"-pagemode"));
     $("#page .container .row").click(function(){
         if($(".phpage-bottom-menu").is(':visible') == false){　　

             $(".phpage-bottom-menu").show();
      	}
         else{
             $(".phpage-bottom-menu").hide();
         }
         $("#top").show();
     });
});


async function getPage(index){
    setHashParams("page", window.info_id, index);
    window.gif_index = 0;
    window.auto_decode = false;
    window.web_tools.cleanInfo();
    window.image_load_pages = [];
    window.page_index = index;
	window.get_flag = true;
    let html = "";
    window.page_title = "";
    //$(".loading").show();
    switch (window.prefix) {
        case "ex":
            html= await exPage(index);
            break;
        case "cm":
            html= await cmPage(index);
            break;
        case "bk":
            html= await bkPage(index);
            break;
        case "mh":
            html = await mhPage(index);
            break;
        case "mg":
            html = await mgPage(index);
            break;
        case "lm":
            html = await lmPage(index);
            break;
        case "bs":
            html = await bsPage(index);
            break;
    }
    $("#page .page-title").html(window.page_title);
    $("#page .imgs").empty();
    $("#page .imgs").append(html);
    $("#page").attr("scroll", $(window).scrollTop());
    //addPageMenu();




    toPage(0);
    getForum();
    //生产页面滑块
    buildSlider($("#page img.lazy").length);
    add_pages_over();

    //$(".loading").hide();
}






async function cmPage(index){
    let id = window.info_data["_id"];
    let page_data = window.info_data["lists"][index];
    window.img_page_id = page_data["_id"];
    SetHistory(id, index);
    window.page_title = page_data["title"];

    //判断是否有下一章， 如果有， 下一张也载入，但是不要使用callback
    if(window.info_data["lists"].length > (index+1)){
        //有下一页
        console.log("同步加载下一章");
        let nid = window.info_data["lists"][index+1]["_id"];
        if("images" in window.info_data["lists"][index+1]){
            getImages(nid, 1, false);
        }
    }

    //下面为本章返回
    if("images" in page_data && page_data["images"].length > 0){
        let id = page_data["_id"];
        let images = page_data["images"];
        return buildImages(id, images);
    }
    else{
        $(".loading").show();
        let lid = page_data["_id"];
        await window.web_tools.startPage([lid], ["page"], function(data){
            let info = data["info"];
            if(info.length > 0){
                let id = info[0]["_id"];
                if(info[0]["complete"] == "True" && "images" in info[0]){
                    $(".loading").hide();
                    print("加载page成功");
                    let images = info[0]["images"];
                    let html = buildImages(id, images);
                    $("#page .imgs").append(html);
                    buildSlider($("#page img.lazy").length);
                    add_pages_over();
                }
            }
        });
    }

    return  "";


}

function buildText(data){

    if(typeof data === 'string'){
        data = JSON.parse(data);
    }
    $("#page .imgs").empty();
    let html = "";
    for(let page in data){
        html += data[page]
    }
    return html;
}

async function bsGetContent(id){
    let url = `response?id=${id}&type=content&prefix=bs`;
    let data = await fetchApi(url);
    if("content" in data){
        let content = data["content"];
        return content;
    }
    else{
        return {};
    }

}



async function bsPage(index){

    let id = window.info_data["_id"];
    let page_data = window.info_data["lists"][index];
    window.img_page_id = page_data["_id"];
    SetHistory(id, index);
    window.page_title = page_data["title"];
    window.img_page_count  = 0;
    $("#page .post-single").attr("class", "post-single-text");

    $("#page .imgs").css("background", "#f1f1f1");
    $("#page .row").css("background", "#f1f1f1");

    console.log(page_data);

    //判断是否有下一章， 如果有， 下一张也载入，但是不要使用callback
    if(window.info_data["lists"].length > (index+1)){
        //有下一页
        console.log("同步加载下一章");
        let nid = window.info_data["lists"][index+1]["_id"];
        if("content_update" in window.info_data["lists"][index+1] == false || window.info_data["lists"][index+1]["content_update"].length == 0) {
            window.web_tools.startPage([nid], ["page"], false);
        }
    }

    //下面为本章返回
    if("content_update" in page_data && page_data["content_update"].length > 0){

        let content = await bsGetContent(page_data["_id"]);
        return buildText(content);
    }
    else{
        $(".loading").show();
        let lid = page_data["_id"];
        await window.web_tools.startPage([lid], ["page"],async function(data){
            let info = data["info"];
            if(info.length > 0){
                let content = await bsGetContent(page_data["_id"]);
                let html = buildText(content);
                $("#page .imgs").append(html);
                $(".loading").hide();
                add_pages_over();

            }
        });
    }

    return  "";


}

function loadFristImg(){

}


async function bkPage(index){
    let id = window.info_data["_id"];
    let page_data = window.info_data["lists"][index];
    window.img_page_id = page_data["_id"];
    SetHistory(id, index);
    window.page_title = page_data["title"];

    //判断是否有下一章， 如果有， 下一张也载入，但是不要使用callback
    if(window.info_data["lists"].length > (index+1)){
        //有下一页
        console.log("同步加载下一章");
        let nid = window.info_data["lists"][index+1]["_id"];
        if("images" in window.info_data["lists"][index+1]){
            getImages(nid, 1, false);
        }
    }

    //下面为本章返回
    if("images" in page_data){
        let id = page_data["_id"];
        let images = page_data["images"];
        return buildImages(id, images);
    }
    else{
        $(".loading").show();
        let lid = page_data["_id"];
        await window.web_tools.startPage([lid], ["page"], function(data){
            let info = data["info"];
            if(info.length > 0){
                let id = info[0]["_id"];
                if(info[0]["complete"] == "True" && "images" in info[0]){
                    $(".loading").hide();
                    print("加载page成功");
                    let images = info[0]["images"];
                    let html = buildImages(id, images);
                    $("#page .imgs").append(html);
                    buildSlider($("#page img.lazy").length);
                    add_pages_over();
                }
            }
        });
    }

    return  "";



}



async function exPage(index){
    let filecount = parseInt(window.info_data["filecount"]);
    SetHistory(window.info_data["_id"]);

    window.page_title = "单本";
    let images = getDefaultFromDict(window.info_data, "mpv_images", []);
    if(images.length>0){
        return buildImages(window.info_data["_id"], images);
    }
    else{
        $(".loading").show();
        let id = window.info_data["_id"];
        await window.web_tools.startPage([id], ["page"], function(data){
            let info = data["info"];
            if(info.length > 0){
                let id = info[0]["_id"];
                if(info[0]["complete"] == "True" && "images" in info[0]){
                    $(".loading").hide();
                    print("加载page成功");
                    let images = info[0]["images"];
                    let html = buildImages(id, images);
                    $("#page .imgs").append(html);
                    buildSlider($("#page img.lazy").length);
                    add_pages_over();
                }
            }
        });
    }

}



async function mgPage(index){
    let id = window.info_data["_id"];
    let page_data = window.info_data["lists"][index];
    window.img_page_id = page_data["_id"];
    SetHistory(id, index);
    window.page_title = page_data["title"];

    //判断是否有下一章， 如果有， 下一张也载入，但是不要使用callback
    if(window.info_data["lists"].length > (index+1)){
        //有下一页
        console.log("同步加载下一章");
        let nid = window.info_data["lists"][index+1]["_id"];
        if("images" in window.info_data["lists"][index+1]){
            getImages(nid, 1, false);
        }
        else{
            console.log("获取下一章图片列表" + nid);
            window.web_tools.startPage([nid], ["page"], false);
        }
    }

    //下面为本章返回
    if("images" in page_data){
        let id = page_data["_id"];
        let images = page_data["images"];
        return buildImages(id, images);
    }
    else{
        $(".loading").show();
        let lid = page_data["_id"];
        await window.web_tools.startPage([lid], ["page"], function(data){
            let info = data["info"];
            if(info.length > 0){
                let id = info[0]["_id"];
                if(info[0]["complete"] == "True" && "images" in info[0]){
                    $(".loading").hide();
                    print("加载page成功");
                    let images = info[0]["images"];
                    let html = buildImages(id, images);
                    $("#page .imgs").append(html);
                    buildSlider($("#page img.lazy").length);
                    add_pages_over();
                }
            }
        });
    }

    return  "";

}

async function lmPage(index){
    let id = window.info_data["_id"];
    let page_data = window.info_data["lists"][index];
    window.img_page_id = page_data["_id"];
    SetHistory(id, index);
    window.page_title = page_data["title"];

    //判断是否有下一章， 如果有， 下一张也载入，但是不要使用callback
    if(window.info_data["lists"].length > (index+1)){
        //有下一页
        console.log("同步加载下一章");
        let nid = window.info_data["lists"][index+1]["_id"];
        if("images" in window.info_data["lists"][index+1]){

        }
        else{
            console.log("获取下一章图片列表" + nid);
            //window.web_tools.startPage([nid], ["page"], false);
        }
    }
    window.get_flag = false;
    //下面为本章返回
    if("pages" in page_data){
        let id = page_data["_id"];
        let images = page_data["pages"];
        return buildImages(id, images);
    }



    return  "";

}

function buildImages(id, images){

    let pages = images.length;
    let html = "";
    let img_html = $("temp.temp-page-img").html();
    for (let i=0;i<pages;i++){
        let src = buildUrlParamByDict("response", {"prefix": this.prefix, "type": "image", "id": id, "page": i+1});
        html += stringFormatByDict(img_html, {"index": parseInt(i) + 1, "id": id, "load": 0, "url":src});
    }

    getImages(id, pages);


    return html;
}

function getAllImages(id, pages){


    let data = {
        "id": window.img_page_id,
        "page": 1,
        "page_count": pages
    };
    window.web_tools.startImage(data, ["page"], getAllImagesCallBack);
}

function getAllImagesCallBack(data){
    let info = data["info"];

    for(let i in info){
        let item = info[i];
        if(item["complete"] == "True"){
            let id = item["_id"];
            let page = item["page"];
            let src = buildUrlParamByDict("response", {"prefix": this.prefix, "type": "image", "id": id, "page": page});
            let img = $("#page .imgs").find("img[page='"+page+"']");

            if(img.attr("load") == "1"){
                if(img.attr("src") != src){
                    img.attr("src", src);
                }
            }
            if(img.attr("data-original") != src){
                    img.attr("data-original", src);
            }

        }
    }

    let over = false;
    if("over" in data && data["over"]=="True"){
        over = true;
        console.log("get all image 完成");
    }
}



function getImages(id, pages, callback=true){
    window.img_page_id = id;
    window.img_page_num = 1;
    window.img_page_size = 30;
    window.img_page_count = pages;
    // if(( window.img_page_num-1)*window.img_page_size<=window.img_page_count){
    //     let data = {
    //         "id": window.img_page_id,
    //         "page": window.img_page_num,
    //         "page_count": window.img_page_size
    //     };
    //     window.image_load_pages.push(window.img_page_num);
    //     if(callback) {
    //         window.web_tools.startImage(data, ["page"], getImagesCallBack);
    //     }
    //     else{
    //         window.web_tools.startImage(data, ["page"], null);
    //     }
    // }
    if(callback && window.img_page_count>=1){
        getMoreImage(1);
    }
    else{
        let data = {
            "id": window.img_page_id,
            "page": 1,
            "page_count": 30
        };
        window.web_tools.startImage(data, ["page"], null);
    }

}
function getMoreImage(page_num){
    if(window.img_page_count <=0){
        return
    }
    if(window.get_flag){
        let group_num = (page_num / 30 | 0) + 1;
        for(let i=0;i<=1;i++){
            let new_group_num = group_num + i;
            if( ((new_group_num - 1) * window.img_page_size + 1) > window.img_page_count){
                return "";
            }

            if(window.image_load_pages.indexOf(new_group_num) < 0){
                window.img_page_num = new_group_num;
                print("加载页面分组" + window.img_page_num);
                 let data = {
                    "id": window.img_page_id,
                    "page": window.img_page_num,
                    "page_count": window.img_page_size
                };
                 window.image_load_pages.push(new_group_num);
                 window.web_tools.startImage(data, ["page"], getImagesCallBack);
            }
        }

    }
}

function getImagesCallBack(data){
    let info = data["info"];

    for(let i in info){
        let item = info[i];
        if(item["complete"] == "True"){
            let id = item["_id"];

            let page = item["page"];
            let src = buildUrlParamByDict("response", {"prefix": this.prefix, "type": "image", "id": id, "page": page});
            let img = $("#page .imgs").find("img[page='"+page+"']");
            if(img.attr("load") == "1"){
                if(img.attr("src") != src){
                    img.attr("src", src);
                }
            }
            if(img.attr("data-original") != src){
                    img.attr("data-original", src);
            }
        }
        if("real_url" in info[i]){
            let item = info[i];
            let real_url = item["real_url"];
            let page = item["page"];
            let img = $("#page .imgs").find("img[page='"+page+"']");
            img.attr("real_url", real_url);
        }

    }

    let over = false;
    if("over" in data && data["over"]=="True"){
        over = true;
        console.log("get image 完成");
    }

}

async function getComments(id){
    await window.web_tools.startComments([id], ["page"], getCommentsCallBack);
}

async function getCommentsCallBack(data){
    let info = data["info"];
        if(info.length > 0){
            let id = info[0]["_id"];
            if(info[0]["complete"] == "True"){
                print("重新加载评论");
                getForum(false);
            }
        }
}




async function SetHistory(id, index=-1){
    if(index>=0){
        let page_data = window.info_data["lists"][index];
        let lid = page_data["_id"]
        let data = await fetchApi("response", "GET", {"type": "history", "id": id, "prefix": window.prefix, "lid": lid});
    }
    else{
        let data = await fetchApi("response", "GET", {"type": "history", "id": id, "prefix": window.prefix});
    }
}


async function mhPage(index){
    let file = window.info_data["lists"][index];
    let id =  window.info_data["_id"];
    SetHistory(id, index);
    //console.log(window.info_data);
    window.page_title = file;
    let option = {"type": "unzip", "id": id, "index":index, "prefix": window.prefix}
    let data = await fetchApi("response", "GET", option);
    if (data["type"] == "success"){
        toastr.success(data["msg"], "成功");
        let html = "";
        let img_html = $("temp.temp-page-img-mh").html();
        for (let i in data["images"]){
            let page = data["images"][i];
            let zip = data["zip"];
            let url = buildUrlParamByDict("response", {"page": page, "zip": zip, "prefix": window.prefix, "type": "unzipjpg", "index": i});
            html += stringFormatByDict(img_html, {"url": url, "id": "img" + i, "index": parseInt(i) + 1});
        }
        return html;
    }
    else{
        toastr.error(data["msg"], "失败");
        return "";
    }
}



function toVolumn(page){
    if(page =="-1"){
        if(window.page_index == 0){
            toastr.error("已经是第一章", "警告");
        }
        else{
            getPage(window.page_index - 1);

        }
    }
    else if(page == "+1"){
        let count = getDefaultFromDict(window.info_data, "lists", []).length;
        if(window.page_index >= count-1){
            toastr.error("已经是最后一章", "警告");
        }
        else{
            getPage(window.page_index + 1);
        }
    }
}

function goPageNum(page_num){
    try{
        let img = $("#page .imgs img[class='lazy']").eq(page_num - 1);
        if(img && img.offset()){
            $(window).scrollTop(img.offset().top);
            page_scroll();
        }


    }
    catch (e){
        console.log(e);
    }

}


function buildSlider(max){
    let input = $("temp.temp-sliderinput").html();
    $(".page-change .slider").empty();

    let option ={};
    option["input_id"] = "page-slider-input";
    option["slider_id"] = "page-slider";
    option["min"] = 1;
    option["max"] = max;
    option["value"] = 1;
    $(".page-change .slider").append(stringFormatByDict(input, option));
    $(".page-change .slider #page-slider-input").slider();
    $("#menu .page-num").html(stringFormatByDict("{page}/{pagecount}", {"page": 1, "pagecount": $("#page .imgs img").length}));
    $('.page-change .slider #page-slider-input').on('slideStop', function () {
        let page = $('.page-change .slider #page-slider-input').val();
        goPageNum(page);
    });

    //pc版页面选择
    $("#pageselect").empty();
    for(let i=1;i<=max;i++){
        let option = $("<option></option>");
        option.attr("value", i);
        option.html(i + "/" + max);
        $("#pageselect").append(option);
    }
    $("#pageselect").off();
    $("#pageselect").on('change',function(){
        let page = $('#pageselect').val();
        goPageNum(page);
    });


}



function changeSlider(value) {
    var mySlider = $(".page-change .slider #page-slider-input").slider();
    mySlider.slider('setValue', value);
    $("#pageselect").val(value);
    getMoreImage(value);
}

function clearForum(){
    $("#forum-modal .list-group").empty();
    $(".forum-div .list-group").empty();
}
function buildForum(data){
    clearForum();
    for(let i in data){
        let forum = data[i];
        $("#forum-modal .list-group").append("<li class=\"list-group-item text-wrap\">"+forum+"</li>");
        $(".forum-div .list-group").append("<li class=\"list-group-item text-wrap\">"+forum+"</li>");
    }
}

async function getForum(update=true){
    let id = 0;
    if(window.prefix === "ex" ||  window.prefix === "bk"){
        id = window.info_data["_id"];
    }
    else if(window.prefix === "cm" || window.prefix === "mg"){
         id = window.img_page_id;
    }


    if(id !== 0){
        let data = await fetchApi("response", "GET",  {"id": id, "prefix": window.prefix, "type": "forum"});
        if("status" in data && data["status"] == "success"){
            buildForum(data["info"]["forums"]);
        }
        else if("status" in data && data["status"] == "error" && data["msg"] == "need update" && update){
            await getComments(id);

        }
    }
}

function showForum(){
    $("#forum-modal").modal();
}

function setImgTranslator(check){
    return
    if(check==false){
        $("#page .imgs img").each(function() {
           let url =  $(this).attr("src");
           if(url.indexOf("imagetran")>0){
               $(this).attr("src", url.replace("imagetran","image"));
           }

        });
    }
    else{
        tranTopImg();

        $("#page .imgs img").each(function() {
           let url =  $(this).attr("src");
           if($(this).attr("tran")=="2"){
               $(this).attr("src", url.replace("image","imagetran"));
           }
        });
    }
    //  $("#page .imgs img").each(function(){
    //       let url = $(this).attr("data-original");
    //       if(check){
    //           let new_url = url + "&translator=1";
    //           $(this).attr("data-original", new_url);
    //           if($(this).attr("load") == "1"){
    //               $(this).attr("src", new_url);
    //           }
    //       }
    //       else{
    //           let new_url = url.replace("&translator=1", "");
    //           $(this).attr("data-original", new_url);
    //           if($(this).attr("load") == "1"){
    //               $(this).attr("src", new_url);
    //           }
    //       }
    // });
}

function addTranslatorBtn(){

    window.auto_translator = false;
    let btn = $("<button>自动翻译</button>");
    btn.addClass("floating-button");
    btn.addClass("floating-button-uncheck");
    btn.click(function(){
        if(window.auto_translator){
            window.auto_translator = false;
            btn.removeClass("floating-button-check");
            btn.addClass("floating-button-uncheck");
            setImgTranslator(false);
        }
        else{
            window.auto_translator = true;
            btn.removeClass("floating-button-uncheck");
            btn.addClass("floating-button-check");
            setImgTranslator(true);

        }

    });
    $("#page").append(btn);
}


function addPageMenu(){
    const div = $('<div>');
    div.addClass("floating-div");


    // 创建菜单栏按钮
    const menuButton = $('<button>').text('工具');
    menuButton.addClass("menu-button");
    // 创建菜单列表
    const menuList = $('<ul>'); // 默认隐藏菜单列表
    menuList.css("display", "none");
    menuList.html(`
      <li class="translator-btn">自动翻译</li>
      <li class="gifplayer-btn">gif播放</li>
      <li class="bardecode-btn">条形解码</li>
      <li class="mosaicdecode-btn">马赛克解码</li>
    `);

    div.append(menuButton);
    div.append(menuList);
    $('#page').append(div);

    // 点击菜单栏按钮时切换菜单列表的显示状态
    menuButton.on('click', function() {
      if (menuList.css('display') === 'none') {
        menuList.slideDown(300);
      } else {
        menuList.slideUp(300);
      }
    });

    $(".bardecode-btn").on('click', function(){
        let btn = $(this);
        if(window.auto_decode == false){
            // 启动自动解码
            window.auto_decode = true;
            window.auto_decode_code = 0;
            decodeTopImg();
            btn.addClass("check");
        }
        else{
            window.auto_decode = false;
            btn.removeClass("check");
        }
        menuList.slideUp(300);
    });

    $(".mosaicdecode-btn").on('click', function(){
        let btn = $(this);
        if(window.auto_decode == false){
            // 启动自动解码
            window.auto_decode = true;
            window.auto_decode_code = 2;
            decodeTopImg();
            btn.addClass("check");
        }
        else{
            window.auto_decode = false;
            btn.removeClass("check");
        }
        menuList.slideUp(300);
    });

    $(".translator-btn").on('click', function(){
        let btn = $(this);
         if(window.auto_translator){
            window.auto_translator = false;
            btn.removeClass("check");
            setImgTranslator(false);
        }
        else{
            window.auto_translator = true;
            btn.addClass("check");
            setImgTranslator(true);
        }
    });
    
    $(".gifplayer-btn").on("click", function(){
        startGifPlayer();
        menuList.slideUp(300);
    });

}



function add_pages_over(){
    if(window.setting_mode == "test"){
        $(".imgs img").on("dblclick", function(){
            var imgUrl = $(this).attr('src'); // 获取图片的URL
            var link = document.createElement('a'); // 创建一个新的<a>标签
            link.href = imgUrl; // 设置链接的href为图片的URL
            link.download = ''; // 设置下载属性，这将触发浏览器的下载行为
            document.body.appendChild(link); // 将链接添加到文档中
            link.click(); // 模拟点击链接以下载图片
            document.body.removeChild(link); // 从文档中移除链接
        });
    }
    if(window.big_mode){
        $(".imgs img").on("load", function(){
            let img = $(this);
            //big_img(img, window.big_mode);
        });
    }

    if(window.manga_mode == "page"){
        console.log("打开分页阅读");
        window.page_num = 1;
        startGifPlayer();
    }

    if(window.prefix == "bs"){
        // bs对小说图片src进行修改
        $("#page .imgs img").each(function(){
            let img = $(this);
            let url = img.attr("data-src");
            if(url){

            }
            else{
                url = img.attr("src");
            }
            url = getCacheImgSrc(url, {'referer':'https://www.linovelib.com/'});
            // url = "/imgcache?url=" + encodeURIComponent(url);
            // url = url + "&headers=" + encodeURIComponent("{'referer':'https://www.linovelib.com/'}");
            img.attr("src", url);

            $("#page .read-content").each(function(){
                let last_p = $(this).find("p").last().clone();
                $(this).find("p").last().after(last_p);

            });

        });
    }

    page_scroll();

}


function big_img(img, big_type=1){
    //console.log(big_type);


    let src = img.attr("src");
    let params = getUrlParams(src);
    if("type" in params & params["type"] == "image"){
        console.log("放大图片" + src);
        img.off("error");
        img.off("load");
        img.on("error", function(){
            //img.attr("src", src);
        });
        img.on("load", function(){
            img.css("border-bottom", "3px solid  gold");
        });

        img.attr("src", src.replace("type=image", "type=imagebig&b=" + big_type));
    }

}