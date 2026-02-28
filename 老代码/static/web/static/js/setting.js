$(function() {



    window.scroll_speed = getStorageItem("scroll_speed", 50);
    $("#setting input[name='speed']").val(window.scroll_speed);

    $("#setting input[name='speed']").on("input", function(){
        window.scroll_speed = parseInt($("#setting input[name='speed']").val());
        setStorageItem("scroll_speed", window.scroll_speed);
    });

    window.setting_mode = getStorageItem("setting_mode", "normal");
    $("#setting input[value='"+ window.setting_mode +"']").prop("checked", true);;
    $("#setting input[name='mode']").on("change", function(){
        console.log($(this).val());
        setStorageItem("setting_mode", $(this).val());
        window.setting_mode = $(this).val();
    });

    //$(".setting").removeClass("setting-open");

    //关闭按钮
    $(".setting .close").on("click", function(){
        closeSetting();
        //window.removeEventListener('wheel', settingwheel);
    });

    //打开设置按钮
    $(".tool-icon").on("click", function(){
        $(".setting").addClass("setting-open");
        //window.addEventListener('wheel', settingwheel);
    });



    addSettingBtns();



});

function closeSetting(){
    $(".setting").removeClass("setting-open");
}

function settingwheel(event){
    event.preventDefault();
}


function addSetButtons(setting_ul, btns){
    //<li class="list-group-item"><button class="btn btn-outline-primary">百度</button></li>
    for(let i in btns){
        let item = btns[i];
        let li = $("<li class=''></li>");
        let btn = $("<button class='btn'></button>")
        btn.html(item["title"]);
        btn.addClass(item["class"]);
        btn.attr("value", item["value"]);
        btn.attr("value2", getDefaultFromDict(item, "value2", ""));
        btn.on("click", item["click"]);
        li.append(btn);
        setting_ul.append(li);

    }

}

async function getWebs() {
    let data = await fetchApi("response", "GET", {"type": "webs"});
    window.web_data = data;
    let btn_webs = [];
    let btn_orders = [];
    let btn_real_webs = [];
    for(let i in data){
        let item = data[i];
        // web按钮
        let web = {
            "title": item["title"],
            "value": item["title"],
        }
        if(item["prefix"].toLowerCase()== window.prefix){
            //当前web
            web["class"] = "btn-primary";
            window.cdn = getDefaultFromDict(item, "cdb", "");
            window.host_url = getDefaultFromDict(item, "url", "");

        }
        else
            web["class"] = "btn-outline-primary";
        web["click"] = function(){
            window.location.href = `/?prefix=${item["prefix"].toLowerCase()}`;
        }
        btn_webs.push(web);

        //排序按钮
        if(item["prefix"].toLowerCase()== window.prefix && "order" in item){
            let orders = item["order"];
            for(let j in orders){
                let order = orders[j];
                let order_data = {
                    "title": order["order_name"],
                    "value": order["order_field"],
                    "value2": order["order_type"]
                }
                if(j==0)
                    order_data["class"] ="btn-secondary";
                else
                    order_data["class"] ="btn-outline-secondary";
                order_data["click"] = function(){
                    changeOrder($(this).attr("value"), $(this).attr("value2"));
                    closeSetting();
                }
                btn_orders.push(order_data);

            }

        }
        // 真实网址按钮
        btn_real_webs.push({
            "title": item["title"],
            "value": item["url"],
            "class": "btn-outline-dark",
            "click": function(){
                window.open($(this).attr("value"));
            }
        });
    }

    addSetButtons($("#setting .webs"), btn_webs);
    addSetButtons($("#setting .orders"), btn_orders);
    addSetButtons($("#setting .real-webs"), btn_real_webs);
}

function addSettingBtns(){
    // 每行显示按钮
    let cols_list = [10, 8, 6, 4, 2, 1];
    let cols = [];
    for(let i in cols_list){
        cols.push({
            "title": cols_list[i] + "列",
            "value": cols_list[i],
            "class": "btn-outline-info",
            "click": function (){
                changeColumnCount($(this).attr("value"));
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .cols"), cols);
    setListCol();

    // 图片模式按钮
    let img_modes_list = ["正常", "切半"];
    let img_modes = [];
    for(let i in img_modes_list){
        let v = img_modes_list[i];
        let value = "full";
        if (v=="切半"){
            value = "half";
        }
        img_modes.push({
            "title": "" + img_modes_list[i],
            "value": value,
            "class": "btn-outline-success",
            "click": function (){
                let v = $(this).attr("value");
                pageMode(v);
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .img-modes"), img_modes);
    pageMode(getDefault(getCookie(window.prefix+"-pagemode"), "full"));

    // 阅读模式按钮
    let page_modes_list = ["下拉", "翻页", "翻页(单页)"];
    let page_modes = [];
    for(let i in page_modes_list){
        let v = page_modes_list[i];
        let value = "down";
        if (v=="翻页"){
            value = "page";
        }
        else if(v=="翻页(单页)"){
            value = "page_single";
        }
        else if(v=="横屏翻页"){
            value = "rotatepage";
        }
        page_modes.push({
            "title": "" + page_modes_list[i],
            "value": value,
            "class": "btn-outline-warning",
            "click": function (){
                let v = $(this).attr("value");
                mangaMode(v);
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .page-modes"), page_modes);
    mangaMode(getDefault(getCookie("mangamode"), "down"));


    // 图片页尺寸
    let page_sizes_list = ["大", "中", "小"];
    let page_sizes = [];
    for(let i in page_sizes_list){
        page_sizes.push({
            "title": "" + page_sizes_list[i],
            "value": page_sizes_list[i],
            "class": "btn-outline-dark",
            "click": function (){
                let v = $(this).attr("value");
                sizeMode(v);
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .page-sizes"), page_sizes);
    sizeMode(getStorageItem("sizemode", "大"));

    //缓存代理
    let cache_proxies_list = [{"t": "停用", "v": 0}, {"t": "国内", "v": 1}, {"t": "国外", "v": 2}]
    let cache_proxies = [];
    for(let i in cache_proxies_list){
        cache_proxies.push({
            "title": "" + cache_proxies_list[i]["t"],
            "value": cache_proxies_list[i]["v"],
            "class": "btn-outline-success",
            "click": function (){
                let v = $(this).attr("value");
                proxiesMode(v);
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .cache-proxies"), cache_proxies);
    proxiesMode(getStorageItem("proxiesmode", "国内"));


    // 背景颜色按钮
    let bg_colors_list = ["white", "black"];
    let bg_colors = [];
    for(let i in bg_colors_list){
        bg_colors.push({
            "title": "" + bg_colors_list[i],
            "value": bg_colors_list[i],
            "class": "btn-outline-danger",
            "click": function (){
                let v = $(this).attr("value");
                readMode(v);
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .bg-colors"), bg_colors);
    readMode(getDefault(getCookie("readmode"), "white"));

    // 运维模式
    let test_modes_list = ["test", "normal"];
    let test_modes = [];
    for(let i in test_modes_list){
        test_modes.push({
            "title": "" + test_modes_list[i],
            "value": test_modes_list[i],
            "class": "btn-outline-warning",
            "click": function (){
                let v = $(this).attr("value");
                testMode(v);
                closeSetting();
            }
        });
    }
    addSetButtons($("#setting .test-modes"), test_modes);
    testMode(getStorageItem("setting_mode", "normal"));


    //剩余一些功能键
    let other_buttons = [];
    other_buttons.push({
            "title": "登出",
            "value": "logout",
            "class": "btn-outline-primary",
            "click": function (){
                window.location.href="/tpwout";
            }
    });

    other_buttons.push({
        "title": "刷新",
        "value": "refush",
        "class": "btn-outline-primary",
        "click": function (){
            window.location.reload();
        }
    });

    other_buttons.push({
        "title": "全屏",
        "value": "refush",
        "class": "btn-outline-primary",
        "click": function (){
            pageBig();
        }
    });

    other_buttons.push({
        "title": "下载app",
        "value": "downapp",
        "class": "btn-outline-primary",
        "click": function (){
            window.open("/static/download/app.apk");
        }
    });

    addSetButtons($("#setting .other-settings"), other_buttons);


}






