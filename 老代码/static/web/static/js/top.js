$(function() {
    window.prefix = getUrlParam("prefix");
    if(window.prefix == null){
        window.prefix = getStorageItem("prefix", "ex");
        window.location.href="/?prefix=" + window.prefix;
    }

    setStorageItem("prefix", window.prefix);




    getWebs();
    addSetOpt();
    buttonClick();
    getTags();
    searchTag();


    bigMode(getDefault(getCookie("bigmode"), "off"));


    //list 载入


    window.web_tools = new WebTools(window.prefix);
    window.col_count = getDefault(getCookie(window.prefix+"-col"), 8);
    setNavActive("list");
    //setListCol();

    bodyLoadMore();
    buttonBind();
    //menuResize();
    hashLoad();
    checkAccessSever();

});

async function checkAccessSever(){
    //判断是否因为ipv4跳到外网去了
    try {
        const response = await fetch('/ip');
        if (!response.ok) {
            // 如果响应状态码不是2xx，抛出错误
            throw new Error('Network response was not ok');
        }
        const data = await response.text(); // 假设返回的是纯文本
        toastr.error("当前为ipv4访问,低速模式");
        return true;
    } catch (error) {
        //console.error('Fetch error:', error);
        return false;
    }
}

function addSetOpt(){
    // 添加一些全局使用的菜单按钮
    /*
    <li>
        <a class="dropdown-item" mode="full" href="javascript:pageMode('full');">图片模式:正常</a>
    </li>
    <li>
        <a class="dropdown-item" mode="half"  href="javascript:pageMode('half');">图片模式:切半</a>
    </li>
    <li>
        <a class="dropdown-item" readmode="white" href="javascript:readMode('white');">阅读模式:白天</a>
    </li>
    <li>
        <a class="dropdown-item" readmode="black"  href="javascript:readMode('black');">阅读模式:黑夜</a>
    </li>

    <li>
        <a class="dropdown-item" bigmode="on"  href="javascript:bigMode('on');">自动放大:开启</a>
    </li>
    <li>
        <a class="dropdown-item" bigmode="off"  href="javascript:bigMode('off');">自动放大:关闭</a>
    </li>
    <li>
        <a class="dropdown-item"  href="/tpwout">登出</a>
    </li>
     */
    let html = `<li><a class="dropdown-item" {mode_name}="{mode_value}" href="javascript:{fun};">{title}</a></li>`
    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "mode", "mode_value": "full", "title": "图片模式:正常", "fun": "pageMode('full')"}));
    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "mode", "mode_value": "half", "title": "图片模式:切半", "fun": "pageMode('half')"}));

    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "readmode", "mode_value": "white", "title": "背景模式:白天", "fun": "readMode('white')"}));
    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "readmode", "mode_value": "black", "title": "背景模式:黑夜", "fun": "readMode('black')"}));

    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "bigmode", "mode_value": "off", "title": "自动放大:关闭", "fun": "bigMode('off')"}));
    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "bigmode", "mode_value": "scale", "title": "自动放大:放大", "fun": "bigMode('scale')"}));



    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "mangamode", "mode_value": "down", "title": "阅读模式:下拉", "fun": "mangaMode('down')"}));
    $("#opt_menu").append(stringFormatByDict(html, {"mode_name": "mangamode", "mode_value": "page", "title": "阅读模式:翻页", "fun": "mangaMode('page')"}));

    $("#opt_menu").append(`<li><a class="dropdown-item"  href="/tpwout">登出</a></li>`);





}
function menuResize(){
    if(window.innerWidth < 1268){
        console.log("缩放菜单栏");
    }
}




//随机取页模块的添加
function addRandomOrder(){

}


function buttonClick(){
    $(".top-logo").click(function(){
        location.reload();
    });

    $(".menu-open").click(function(){
        var menu = $(".menu-bolock-ul");
        if(menu.css("display") == "none"){
            $(".menu-open i").attr("class","fa fa-sort-down");
            menu.slideDown(300);
        }
        else{
            $(".menu-open i").attr("class","fa fa-sort-up");
            menu.slideUp(300);
        }
    });
    $(".loading").click(function(){

    });
    $(".load-close").click(function(){
        window.page_load = false;
        $(".loading").hide();
    });
    $(".btn-comment").click(function(){
        let search = $(".search-input").val();

        if(search.indexOf("c:") < 0){
            $(".search-input").val("c:" + search);
        }
        if(search !=""){
            $(".search-btn").click();
        }

    });


    $(".dropdown-item").on("click", function(){

    });

    $(".gif-icon").on("click", function(){
        startGifPlayer();
    });

    // $(".logo").on("click", function(){
    //     pageBig();
    // });
    $(".logo a").attr("href", "javascript:void(0);");




    // $(".phpage-num").on("click", function (){
    //     startGifPlayer();
    // });
}


function readMode(mode){
    if(mode=="white"){
        $("body").css("background-color", "#F9F9FF");
        $("section").css("background-color", "#F9F9FF");
        $(".imgs").css("background-color", "#f1f1f1");
        setCookie("readmode", "white");

    }
    else{
        $("body").css("background-color", "black");
        $("section").css("background-color", "black");
        $(".imgs").css("background-color", "#161819");
        //#161819
        setCookie("readmode", "black");
    }

    // $("#main_nav a[readmode]").attr("class", "dropdown-item");
    // $("#main_nav a[readmode='"+mode+"']").attr("class", "dropdown-item active");
    $(".setting .bg-colors button").attr("class", "btn btn-outline-danger");
    $(".setting .bg-colors button[value='"+mode+"']").attr("class", "btn btn-danger");
}

function sizeMode(mode){
    let size = "col-md-12";
    if(mode == "中"){
        size = "col-8"
    }
    else if(mode == "小"){
        size = "col-4"
    }
    //setCookie("sizemode", mode);
    setStorageItem("sizemode", mode);
    $("#page_content").attr("class", size);
    $(".setting .page-sizes button").attr("class", "btn btn-outline-dark");
    $(".setting .page-sizes button[value='"+mode+"']").attr("class", "btn btn-dark");
}

function proxiesMode(mode){
    let proxies_value = mode; //0: 不使用, 1:国内, 2:国外

    setStorageItem("proxiesmode", proxies_value);
    window.proxies_mode = proxies_value;
    $(".setting .cache-proxies button").attr("class", "btn btn-outline-success");
    $(".setting .cache-proxies button[value='"+mode+"']").attr("class", "btn btn-success");

}


function testMode(mode){
    setStorageItem("setting_mode", mode);
    window.setting_mode = mode;

    $(".setting .test-modes button").attr("class", "btn btn-outline-warning");
    $(".setting .test-modes button[value='"+mode+"']").attr("class", "btn btn-warning");
}

function bigMode(mode){
    if(mode=="noise"){
        window.big_mode = 1;
        setCookie("bigmode", "noise");
    }
    else if(mode=="scale"){
        window.big_mode = 2;
        setCookie("bigmode", "scale");
    }
    else{
        window.big_mode = false;
        setCookie("bigmode", "off");
    }

    $("#main_nav a[bigmode]").attr("class", "dropdown-item");
    $("#main_nav a[bigmode='"+mode+"']").attr("class", "dropdown-item active");
}

function mangaMode(mode){
    if(window.manga_mode != mode){
        setCookie("mangamode", mode);
        window.manga_mode = mode;
    }

    if(mode=="page"){
		if(window.page_type== "page"){
			startGifPlayer();
		}
    }
    else if(mode=="page_single"){
		if(window.page_type== "page"){
			startGifPlayer(true);
		}
    }

    //
    // $("#main_nav a[mangamode]").attr("class", "dropdown-item");
    // $("#main_nav a[mangamode='"+mode+"']").attr("class", "dropdown-item active");
    $(".setting .page-modes button").attr("class", "btn btn-outline-secondary");
    $(".setting .page-modes button[value='"+mode+"']").attr("class", "btn btn-success");
}




function pageMode(mode){
    //half full
    setCookie(window.prefix+"-pagemode", mode);
    //$("#main_nav a[mode]").attr("class", "dropdown-item");
    //$("#main_nav a[mode='"+mode+"']").attr("class", "dropdown-item active");
    $(".setting .img-modes button").attr("class", "btn btn-outline-warning");
    $(".setting .img-modes button[value='"+mode+"']").attr("class", "btn btn-warning");

    window.pagemode = mode;
}


function changeOrder(order_name, order_type){
    window.order = order_name;
    window.order_type = order_type;
    // $("#main_nav a[order]").attr("class", "dropdown-item");
    // $("#main_nav a[order='"+order_name+"']").attr("class", "dropdown-item active");
    $(".setting .orders button").attr("class", "btn btn-outline-secondary");
    $(".setting .orders button[value='"+order_name+"']").attr("class", "btn btn-secondary");
    toList(0);
    search();
}


async function getTags(){
    if(window.prefix=="ex")
    {
        await getExTags();
    }
    else if (window.prefix == "cm" || window.prefix == "bk" || window.prefix == "jb"  || window.prefix == "mg"){
        await getCmTags();
    }
    else{
        let data = await fetchApi("response", "GET", {"type": "tags", "prefix": window.prefix});
        let tag_html = "<li><a tag_id='{tag_id}' href='javascript:setTag(\"{tag_id}\", \"{tag_name}\");'>{tag_name}</a></li>";
        for(let tag_type in data){
            for(let index in data[tag_type]){
                let tag = data[tag_type][index];
                let option = {"tag_name":tag["tag_name"], "tag_id":tag["tag_id"]};
                $(".search-tag .tag-list").append(stringFormatByDict(tag_html, tag));
            }
        }
    }
}

async function getCmTags(){
    let data = await fetchApi("response", "GET", {"type": "tags", "prefix": window.prefix});
    let cell_tag_html = $("temp.temp-cell-tag-list").html();
    let tag_html = "<li><a tag_id='{tag_id}' href='javascript:setTag(\"{tag_id}\", \"{tag_name}\");'>{tag_name}</a></li>";
    if("每周必看" in data){
        $(".cell_tag_list").append(stringFormatByDict(cell_tag_html, {"namespace": "namespace0", "namespace_cn": "每周必看", "namespace_description": "每周必看"}));
         for(let index in data["每周必看"]) {
            let tag = data["每周必看"][index];
            let tag_name ="";
            if(tag["week_title"] != ""){
                tag_name = tag["week_title"];
                }
            else{
                tag_name = tag["week_time"];
            }
            let tag_id = "week_" + tag["week_id"];
            let option = {"tag_name": tag_name, "tag_id": tag_id};
            $("#collapse" + "namespace0" + " .tag-list").append(stringFormatByDict(tag_html, option));
        }
        delete data["每周必看"];
    }


    let row_index = 1;
    for (let row in data){
        $(".cell_tag_list").append(stringFormatByDict(cell_tag_html, {"namespace": "namespace" + row_index.toString(), "namespace_cn": row, "namespace_description": row}));
        for(let index in data[row]) {
            let tag = data[row][index];
            let option = {"tag_name": tag["tag_name"], "tag_id": tag["tag_id"]};
            $("#collapse" + "namespace" + row_index.toString() + " .tag-list").append(stringFormatByDict(tag_html, option));
        }
        row_index ++;
    }
}


function setTag(tag_id, tag_name){
    $('.search').addClass('search-open');
    let tag_insert_flag = false;
    $(".search-tag .active-tag-list a").each(function(){
        let a = $(this);
        let tag_id2 = a.attr("tag_id");
        if(tag_id2 == tag_id){
            // 有相同的tag_id
            tag_insert_flag = true;
            a.attr("tag_id", tag_id + ":-1");
            a.parent().css("background", "coral");
            $(".search-input").val("");
        }
        else if(tag_id2 == tag_id + ":-1"){
            tag_insert_flag = true;
            a.attr("tag_id", tag_id);
            a.parent().css("background", "bisque");
            $(".search-input").val("");
        }
    });


    if(tag_insert_flag == false){
        let tag_id2 = tag_id;
        let color = "bisque";
        if(tag_id.indexOf(":-1")>0){
            tag_id2 = tag_id.replace(":-1", "");
            color =  "coral";
        }
        let tag_html = `<li style='background: ${color}'><a tag_id='${tag_id}' href='javascript:changeTag("${tag_id2}");' >${tag_name}</a></li>`;
        $(".search-tag .active-tag-list").append(tag_html);
        $(".search-input").val("");
    }


}


function changeTag(tag_id){
    let a= $(".search-tag .active-tag-list a[tag_id='"+tag_id+"']");
    if(a.length>0){
        a.attr("tag_id", tag_id + ":-1");
        a.parent().css("background", "coral");
    }
    else{
        delTag(tag_id);
    }

}

function delTag(tag_id){
    $(".search-tag .active-tag-list a[tag_id='"+tag_id+"']").parent().remove();
    $(".search-tag .active-tag-list a[tag_id='"+tag_id+":-1']").parent().remove();
}

function clearTag(){
    $(".search-tag .active-tag-list").empty();
}

function searchHistory(){
    //将查询内容记录
    let search_str = $(".search .search-input").val();
    let tags = [];
    $(".search-tag .active-tag-list a").each(function(){
        let tag_id = $(this).attr("tag_id");
        let tag_name = $(this).html();
        tags.push(tag_id + "=" + tag_name);
    });
    if(search_str != ""){
        setSearchHistory(search_str);
    }
    else{
        setSearchHistory("tags:" + tags.join("&"));
    }
}

function setSearchHistory(search){
    //设置查询历史记录
    // window.localStorage
    let key = window.prefix + "-shistory";
    let searchHistory =  localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : [];
    if(!searchHistory.includes(search))
        searchHistory.push(search);
    if (searchHistory.length > 5) {
      searchHistory.shift(); // 如果长度超过5，就删除开头元素
    }
    window.localStorage.setItem(key, JSON.stringify(searchHistory));
}

function getSearchHistory(){
    //获取查询历史记录
    let key = window.prefix + "-shistory";
    let searchHistory =  localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : [];
    let button_temp = "<button class='btn btn-success  ml-1 mt-3 btn-shistory' title='{title}' search='{search}' type='{type}'>{title}</button>";
    $(".search-history").empty();
    searchHistory.forEach(function(value, index) {
        if(value.includes("tag")){
            let tags = value.replace("tags:", "").split("&");
            let title = "tags:";
            let search = "tags:";
            tags.forEach(function(value){
                title += value.split("=")[1] + "&";
                search += value.split("=")[0] + "&";
            });
            title = title.slice(0, -1);
            search = search.slice(0, -1);
            $(".search-history").append(stringFormatByDict(button_temp, {"title": title, "search": search, "type": "tag"}));
        }
        else{
            $(".search-history").append(stringFormatByDict(button_temp, {"title": value, "type": "str", "search": value}));
        }
        //console.log(value);
    });
    $(".btn-shistory").off("click");
    // 给 id 为 btn 的按钮重新绑定 click 事件
    $(".btn-shistory").on("click", function() {
      let type = $(this).attr("type");
      let search = $(this).attr("search");
      let title = $(this).attr("title");
      clearTag();
      $(".search .search-input").val("");
      if(type == "str"){
            $(".search .search-input").val(search);
      }
      else if(type == "tag"){
            let tags = search.replace("tags:", "").split("&");
            let names = title.replace("tags:", "").split("&");
            tags.forEach(function(value, index) {
                if(value != ""){
                    setTag(value, names[index]);
                }
            });

      }
      //$(".search-btn").click();
    });

}

function pageBig(){
    let li = $(".page-big");
    if(li.attr("mode") == "big"){
        li.removeClass("active");
        li.attr("mode", "");
        $("#page .container").removeClass("containerbig");
        noFullScreen();
    }
    else{
        li.addClass("active");
        li.attr("mode", "big");
        $("#page .container").addClass("containerbig");
        fullScreen();
    }
}


function hookKeyDown(){
    $("html").find("*").each(function(){
        let x = $(this);
        console.log(x);
        x.keydown(function(event){
            if(event.which==37 || event.which==38 || event.which==39 || event.which==40 ){
                //toastr.success(event.which);
                scrollOne();
            }
            return true;

        });

    });
}



function scrollUp(){

    $(window).scrollTop($(window).scrollTop()- 300);

}

function scrollDown(){
    $(window).scrollTop($(window).scrollTop()+ 300);
}

function scrollIsBottom(){
    //获取文档的总高度
    let scrollHeight = $(document).height();
    //获取window的高度
    let windowHeight = $(window).height();
    //获取window滚动条的垂直位置
    let scrollTop = $(window).scrollTop();
    //如果滚动到底部
    console.log(scrollHeight + windowHeight);
    if(scrollTop + windowHeight -100 == scrollHeight) {
        //执行一些操作，比如加载更多内容
        return true;
    }
    return false;
}



function yaoganScroll(type){
    let left_button = ["LEFT", "UP",  "L2", "X", "Y"]; // 上翻button
    let right_button = ["RIGHT", "DOWN", "R1", "R2", "A", "B"]; // 下翻button

    console.log(type);
     /*if(window.yangan_flag != true) {
         window.yangan_flag = true;
        setInterval(function(){window.yangan_flag = false}, 500);
     }else{
         return
     }*/

    if(window.gif_player){
        let gif_wheel_down_button = ["L1", "L2", "L3", "R1", "R2", "R3", "X", "Y"]
        let gif_left_button = ["LEFT", "UP"]; // 上翻button
        let gif_right_button = ["RIGHT", "DOWN"]; // 下翻button
        if(type=="up"){
            gifImgLoad("yg_up");
        }
        else if(type=="down"){
            gifImgLoad("yg_down");
        }
        else if(type=="upPage"){
            gifImgLoad("yg_left");
        }
        else if(type=="downPage"){
            gifImgLoad("yg_right");
        }
        else if(gif_left_button.includes(type)){
            gifImgLoad("yg_up");
        }
        else if(gif_right_button.includes(type)){
            gifImgLoad("yg_down");
        }
        // else if(type=="R3" || type=="L3"  || type=="L1" ){
        //     gifImgLoad("wheel_down", false);
        // }
        else if(gif_wheel_down_button.includes(type)){
            gifImgLoad("wheel_down", false);
        }

        return true;
    }


    if(type=="up"){
        if(window.scroll_timer == null){
            window.scroll_timer = setInterval(function(){$(window).scrollTop($(window).scrollTop()- 50);}, window.scroll_speed);
        }
    }
    else if(type=="down"){
        if(window.scroll_timer == null){
            window.scroll_timer = setInterval(function(){$(window).scrollTop($(window).scrollTop()+ 50);}, window.scroll_speed);
        }

    }
    else if(type=="stop"){
        clearInterval(window.scroll_timer);
        window.scroll_timer = null;
    }
    else if(type=="upPage"|| left_button.includes(type)){
        let height = $(window).height();
        $(window).scrollTop($(window).scrollTop()- height + 100);

        if(window.scroll_timer == null){
            window.scroll_timer = setInterval(function(){
                let height = $(window).height();
                $(window).scrollTop($(window).scrollTop()- height + 100);
            },300);
        }

    }
    else if(type=="downPage" || right_button.includes(type)){
        if(window.scroll_timer == null){
            let height = $(window).height();
            $(window).scrollTop($(window).scrollTop()+ height - 100);
            if(scrollIsBottom()) {
                //跳转下一章
                toVolumn('+1');
            }
            window.scroll_timer = setInterval(function(){
                let height = $(window).height();
                $(window).scrollTop($(window).scrollTop()+ height - 100);
            }, 300);
        }
    }
}


function yaogan(x, y, z, rz, key_code){
    x = Number(x), y = Number(y),z = Number(z),rz = Number(rz),key_code = Number(key_code);
    let str = stringFormatByDict("x:{x} y:{y} z:{z} rz:{rz} key:{key_code}", {"x": x, "y": y, "z": z, "rz": rz, "key_code": key_code});
    //toastr.success(str);
	//return;

    if(key_code == 24 && window.page_type=="page"){
        toVolumn('+1');
    }
    else if(key_code == 25 && window.page_type=="page"){
        toVolumn('-1');
    }
    else if(y>0.3){
        //开始向下移动
        //toastr.success("向下移动");
        yaoganScroll("down");
    }
    else if(y<-0.3){
        //开始向上移动
        //toastr.success("向上移动");
        yaoganScroll("up");
    }
    else if(y<=0.3 && y>=-0.3){
        //停止移动
        //toastr.success("停止移动");
        yaoganScroll("stop");
    }

    if(x>0.3){
        yaoganScroll("downPage");
    }
    else if(x<-0.3){
        yaoganScroll("upPage");
    }
}


function getpadButtons(buttons){
    let pressedButtons = [];
    for (let i = 0; i < buttons.length; i++) {
        if("pressed" in buttons[i]){
            let button = buttons[i];
            if(button["pressed"]){
                //console.log(button);
                switch (i) {
                    case 0:
                        pressedButtons.push("A");
                        break;
                    case 1:
                        pressedButtons.push("B");
                        break;
                    case 2:
                        pressedButtons.push("X");
                        break;
                    case 3:
                        pressedButtons.push("Y");
                        break;
                    case 4:
                        pressedButtons.push("L1");
                        break;
                    case 5:
                        pressedButtons.push("R1");
                        break;
                    case 6:
                        pressedButtons.push("L2");
                        break;
                    case 7:
                        pressedButtons.push("R2");
                        break;
                    case 8:
                        pressedButtons.push("BACK");
                        break;
                    case 9:
                        pressedButtons.push("START");
                        break;
                    case 10:
                        pressedButtons.push("L3");
                        break;
                    case 11:
                        pressedButtons.push("R3");
                        break;
                    case 12:
                        pressedButtons.push("UP");
                        break;
                    case 13:
                        pressedButtons.push("DOWN");
                        break;
                    case 14:
                        pressedButtons.push("LEFT");
                        break;
                    case 15:
                        pressedButtons.push("RIGHT");
                        break;
                }
            }
        }
    }
    if(pressedButtons.length > 0){
        //console.log(pressedButtons);
    }

    return pressedButtons;
}

//遥感侦听
let lastAxes = [];
let lastButtons = [];
function update() {
  var gamepad = navigator.getGamepads()[0];
  if (gamepad) {
		// 获取遥感摇杆状态
		const axes = gamepad.axes;


		 // 判断遥感状态是否变化
		if (axes.join('|') !== lastAxes.join('|')) {
			yaogan(axes[0], axes[1], axes[2], axes[3], 0);
		  //toastr.success(`Axes: ${axes[0]}, ${axes[1]}, ${axes[2]}, ${axes[3]}`);
		  
		  lastAxes = axes;
		}


        // 获取遥感摇杆状态
        const buttons = gamepad.buttons;
        //console.log(buttons);

        // 判断按键状态是否变化

        let now_buttons = getpadButtons(buttons);
        if(now_buttons.join('|') !== lastButtons.join('|')){
            if(now_buttons.length >0){
                console.log(now_buttons);
                yaoganScroll(now_buttons[0]);
            }
            else {
                console.log("stop");
                yaoganScroll("stop");
            }
            lastButtons = now_buttons;
        }


  }
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
//遥感侦听结束

function toptest(){
    //专门用于测试的过程
    yaoganScroll("downPage");
    yaoganScroll("stop");
}

function searchTag(){
     //const tags = ["apple", "banana", "orange", "peach", "grape", "pear"];

        // 加入一个功能tag标签
        let cell_tag_html = $("temp.temp-cell-tag-list").html();

    $(".cell_tag_list").append(stringFormatByDict(cell_tag_html, {"namespace": "tools", "namespace_cn": "查询工具", "namespace_description": "额外的查询工具"}));

    $("#collapsetools .tag-list").append(`<li><a title="查找已下载" href="javascript:void(0);" id="tool_img_load">查找已下载</a></li>`);
    $("#tool_img_load").on("click", function(){
        $(".search-input").val(`@image_load:2`);
    });

    $("#collapsetools .tag-list").append(`<li><a title="直连查询" href="javascript:void(0);" id="tool_search">直连查询</a></li>`);
    $("#tool_search").on("click", function(){
        $(".search-input").val(`$search:`);
    });

    $("#collapsetools .tag-list").append(`<li><a title="评论查询" href="javascript:void(0);" id="comments_search">评论查询</a></li>`);
    $("#comments_search").on("click", function(){
        $(".search-input").val(`$comments:`);
    });

  const input = $("#input");
  const list = $(".search_tags");
  let tag_html = "<li><a tag_id='{tag_id}' title='{title}' href='javascript:setTag(\"{tag_id}\", \"{tag_name}\");'>{tag_name}</a></li>";
  $("#input").on("input", function() {
    const query = input.val().toLowerCase();
    let matches = [];
    for(let tag in window.ex_tags){
        if(matches.length>=10) break;
        if(window.ex_tags[tag]["name"].indexOf(query)>=0 || window.ex_tags[tag]["id"].indexOf(query)>=0 || window.ex_tags[tag]["intro"].indexOf(query)>=0){
            matches.push(window.ex_tags[tag]);
            //console.log(window.ex_tags[tag]);
        }
    }

    // const matches = window.ex_tags.filter(tag => tag["name"].toLowerCase().startsWith(query)).slice(0, 10);
    list.empty();
    matches.forEach(match => list.append(stringFormatByDict(tag_html, {"tag_id": match["id"], "tag_name": match["name"], "title": match["intro"]})));
  });

}

async function getExTags(){
    let cell_tag_html = $("temp.temp-cell-tag-list").html();
    $(".tag-search-div").show();


    //专为ex设置
    let url = "/static/js/db.html.json";
    let regex = />([^<>]+)</g;
    let regex2 = />|<|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
    window.ex_tags = {};

    let tag_html = "<li><a tag_id='{tag_id}' title='{title}' href='javascript:setTag(\"{tag_id}\", \"{tag_name}\");'>{tag_name}</a></li>";
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        // data 是一个 json 对象
          console.log(data);
          for (let i in data["data"]){
              let row = data["data"][i];
              let namespace = row["frontMatters"]["key"];
              if(namespace == "rows") continue;
              let namespace_cn = row["frontMatters"]["name"];
              let namespace_description = row["frontMatters"]["description"];
              $(".cell_tag_list").append(stringFormatByDict(cell_tag_html, {"namespace": namespace, "namespace_cn": namespace_cn, "namespace_description": namespace_description}));
              let num=0;
              for (let tag in row["data"]){
                  num++;
                  let tag_name = row["data"][tag]["name"];
                  tag_name = tag_name.match(regex);
                  tag_name = tag_name.join("").replace(regex2, "");
                  window.ex_tags[tag] = {"intro": row["data"][tag]["intro"], "id":tag, "links": row["data"][tag]["links"], "name": tag_name, "namespace": namespace};
                  if(num<=100){

                    $("#collapse" + namespace + " .tag-list").append(stringFormatByDict(tag_html, {"tag_id": tag, "tag_name": tag_name, "title":row["data"][tag]["intro"] }));
                  }
              }

          }

      })
      .catch(error => {
        // 处理错误
        console.error(error);
      });

}



async function hashLoad(){
    //通过页面的hash判断加载页
    let hash_param = getHashParams();
    let page_type = getDefaultFromDict(hash_param, "t", "list");
    let page_value =  getDefaultFromDict(hash_param, "v", "1");
    if(page_type == "list" || page_type == "history" || page_type == "bookmark"){
        window.page_type = page_type;
        //window.page = parseInt(page_value) - 1;
        window.page = 0;
        window.page_count = window.page + 1;
        searchData();
    }
    else if(page_type == "info" || page_type == "page"){
        window.page_type = "info";
        let id = page_value;
        await getInfo(id);
        if(page_type == "page"){
            let index = getDefaultFromDict(hash_param, "i", "0");
            index = parseInt(index);
            getPage(index);
        }
    }

}

function isInteger(str) {
  return /^-?\d+$/.test(str);
}
function showPrompt(title, data, defaultValue) {
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
    titleElement.style.color = '#fff';
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