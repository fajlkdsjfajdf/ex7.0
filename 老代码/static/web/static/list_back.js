window.page_load = false;
window.col_count = 0;        //每行显示列数
window.page_type = "list";
window.page = 0;
window.page_history =0;
window.page_bookmark =0;
window.page_count =1;
window.page_count_history =1;
window.page_count_bookmark =1;
window.thumb_check_arr = {}; //thumb检测数组
window.web_tools = null;

$(function(){





    //searchData();

});






async function getList(prefix, page, search={}, retry=false){
    setHashParams("list", page.toString());

    if(window.page_load == false || retry){
        //加载一个等待栏
        let wait_html = $("temp.list-wait").html();
        //$("#"+window.page_type+" .list-columns").append("<div id='waitdiv' class='col-md-12'>wait...</div>");
        $("#"+window.page_type+" .list-columns").append(wait_html);
        //print("加载更多页面");
        window.page_load = true;
        let option ={};
        option["prefix"] = prefix;
        option["page"] = page;
        option["type"] = "list"
        option["search"] = getDefaultFromDict(search,"search_str");
        option["history"]  = getDefaultFromDict(search,"history");
        option["mark"]  = getDefaultFromDict(search,"mark");
        option["order"] = getDefaultFromDict(search,"order");
        option["order_type"] = getDefaultFromDict(search,"order_type");
        option["tags"] = getDefaultFromDict(search,"tags", "[]");
        option["next"] = window.next_gid;  //e绅士专用
        data = await fetchApi("response", "POST", option);
        if(data == null){
            //10s后重试
            setTimeout(getList(prefix, page, search), 10000, true);
        }
        else{
            let card_html = $(".temp-card-"+prefix).html();
            let list_div = $("<div class='row cards'></div>");
            list_div.attr("page", page);
            let list_data = data["data"];
            window.next_gid = getDefaultFromDict(data,"next_gid", 0);
            for(let d in list_data){
                item = list_data[d];
                list_fun[prefix]();
                // switch (prefix) {
                //     case "ex":
                //         item= exListData(item);
                //         break;
                //     case "av":
                //         item= avListData(item);
                //         break;
                //     case "jv":
                //         item= jvListData(item);
                //         break;
                //     case "jb":
                //         item= jbListData(item);
                //         break;
                //     case "cm":
                //         item= cmListData(item);
                //         break;
                //     case "bk":
                //         item = bkListData(item);
                //         break;
                //     case "mh":
                //         item = mhListData(item);
                //         break;
                //     case "lm":
                //         item = lmListData(item);
                //         break;
                //     case "ty":
                //         item= tyListData(item);
                //         break;
                //     case "tk":
                //         item = tkListData(item);
                //         break;
                //     case "mg":
                //         item = mgListData(item);
                //         break;
                //     case "lf":
                //         item = lfListData(item);
                //         break;
                //     case "cb":
                //         item = cbListData(item);
                //         break;
                //     case "bs":
                //         item = bsListData(item);
                //         break;
                //
                //
                // }
                list_div.append(stringFormatByDict(card_html, item));
            }
            $("#"+window.page_type+" .list-columns").append(list_div);
            imgLoad(list_data);
            $("#"+window.page_type+" .list-wait-div").remove();
            addOver();
            if(option["history"] == 1){
                window.page_history = data["page_num"];
                window.page_count_history = data["page_count"];
            }
            else if (option["mark"] ==1 ){
                window.page_bookmark = data["page_num"];
                window.page_count_bookmark = data["page_count"];
            }
            else{
                window.page = data["page_num"];
                window.page_count = data["page_count"];
            }
            window.page_load = false;
            $(".loading").hide();
        }
    }
}

var list_fun = {
    ex: function(){
        let d = {};
        d["_id"] = getDefaultFromDict(data, "_id", "");
        d["gid"] = getDefaultFromDict(data, "gid", "");
        d["title"] = getDefaultFromDict(data, "title_jpn", data["title"]);
        d["category"]= getDefaultFromDict(data, "category", "");
        d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
        d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
        d["language"] = getDefaultFromDict(data, "language", "未知语言");
        d["filecount"] = getDefaultFromDict(data, "filecount", 0);
        d["rating"] = parseFloat(getDefaultFromDict(data, "rating", 0)).toFixed(2);
        d["image_load"] = getDefaultFromDict(data, "image_load", 0)
        d["down"] = d["image_load"] >= 1?"已下载": "未下载";
        d["date"] = getDefaultFromDict(data, "date", "未知日期");
        d["background"] = d["down"] == "已下载"?"background-color: antiquewhite !important;" : "";
        return d;
    },
    mh: function(){
        let d = {};
        d["_id"] = getDefaultFromDict(data, "_id", "");
        d["title"] = getDefaultFromDict(data, "name_cn", data["name"]);
        d["img"] = getDefaultFromDict(data["images"], "large", "/static/images/waitindexpic.gif");

        d["volumes"] = getDefaultFromDict(data, "volumes", 0);
        d["rating"] = parseFloat(getDefaultFromDict(data["rating"], "score", 0)).toFixed(2);

        let infos = getDefaultFromDict(data, "infobox", []);
        d["date"] = "未知日期";
        for(let i in infos){
            let info = infos[i];
            let key = getDefaultFromDict(info, "key", "");
            if( key== "发售日" || key=="开始"){
                d["date"] = getDefaultFromDict(info, "value", "");
                if((typeof d["date"]) != "string"){
                    if(0 in d["date"] && "v" in d["date"][0])
                        d["date"] = d["date"][0]["v"];
                    else
                        d["date"] = JSON.stringify(d["date"]);
                }

            }
        }

        return d;
    },
    mh: function(){

    },
    mh: function(){

    },
    mh: function(){

    },
    mh: function(){

    },
    mh: function(){

    },
    mh: function(){

    },
    mh: function(){

    },
    mh: function(){

    },
}



function exListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["gid"] = getDefaultFromDict(data, "gid", "");
    d["title"] = getDefaultFromDict(data, "title_jpn", data["title"]);
    d["category"]= getDefaultFromDict(data, "category", "");
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["language"] = getDefaultFromDict(data, "language", "未知语言");
    d["filecount"] = getDefaultFromDict(data, "filecount", 0);
    d["rating"] = parseFloat(getDefaultFromDict(data, "rating", 0)).toFixed(2);
    d["image_load"] = getDefaultFromDict(data, "image_load", 0)
    d["down"] = d["image_load"] >= 1?"已下载": "未下载";
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["background"] = d["down"] == "已下载"?"background-color: antiquewhite !important;" : "";
    return d;
}


function mhListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "name_cn", data["name"]);
    d["img"] = getDefaultFromDict(data["images"], "large", "/static/images/waitindexpic.gif");

    d["volumes"] = getDefaultFromDict(data, "volumes", 0);
    d["rating"] = parseFloat(getDefaultFromDict(data["rating"], "score", 0)).toFixed(2);

    let infos = getDefaultFromDict(data, "infobox", []);
    d["date"] = "未知日期";
    for(let i in infos){
        let info = infos[i];
        let key = getDefaultFromDict(info, "key", "");
        if( key== "发售日" || key=="开始"){
            d["date"] = getDefaultFromDict(info, "value", "");
            if((typeof d["date"]) != "string"){
                if(0 in d["date"] && "v" in d["date"][0])
                    d["date"] = d["date"][0]["v"];
                else
                    d["date"] = JSON.stringify(d["date"]);
            }

        }
    }

    return d;
}

function lmListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title");

    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["volumes"] = getDefaultFromDict(data, "volumes", 0);

    d["date"] = getDefaultFromDict(data, "date", 0);


    return d;
}

function mgListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");

    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["title"] = getDefaultFromDict(data, "title");
    d["aid"] = getDefaultFromDict(data, "aid");
    d["list_title"] = getDefaultFromDict(data, "ep_status", "");
    d["rating"] = getDefaultFromDict(data, "rating", 0);
    d["date"] = getDefaultFromDict(data, "date", "");
    d["serial_status"] = getDefaultFromDict(data, "serial_status", "");
    let tags = getDefaultFromDict(data, "tags", []);
    if(tags.includes("连载中")){
        d["type1"] = "连载中";
    }
    else if(tags.includes("已完结")){
        d["type1"] = "已完结";
    }
    else{
        d["type1"] = "";
    }


    d["type2"] = getDefaultFromDict(tags, 0, "");
    return d;
}

function avListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    //d["img"] = getDefaultFromDict(data, "pic_l", "/static/images/waitindexpic.gif");
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "aid": data["aid"]});
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "fanhao");
    let stars = getDefaultFromDict(data, "stars", []);
    d["star1"] = getDefaultFromDict(getDefaultFromDict(stars, 0, null), "StarName", "");
    d["star2"] = getDefaultFromDict(getDefaultFromDict(stars, 1, null), "StarName", "");
    d["star3"] = getDefaultFromDict(getDefaultFromDict(stars, 2, null), "StarName", "");
    return d;
}

function jvListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["type"] = getDefaultFromDict(data, "type", "");
    //d["img"] = getDefaultFromDict(data, "pic_l", "/static/images/waitindexpic.gif");
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "aid", "aid");
    let stars = getDefaultFromDict(data, "stars", []);
    d["star1"] = getDefaultFromDict(getDefaultFromDict(stars, 0, null), "StarName", "");
    d["star2"] = getDefaultFromDict(getDefaultFromDict(stars, 1, null), "StarName", "");
    d["star3"] = getDefaultFromDict(getDefaultFromDict(stars, 2, null), "StarName", "");
    return d;
}

function jbListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "");
    d["title"] =d["fanhao"] + " " + getDefaultFromDict(data, "title", "未知名称");
    d["type"] = getDefaultFromDict(data, "type", "");

    let tk = getDefaultFromDict(data, "tk", []);
    let tk_list = [];
    for(let i in tk){
        let t = tk[i];
        tk_list.push(t["type"]);
    }
    let tk_str = tk_list.join("|");;
    d["tk"] = tk_str;
    const tk_tag = ["Mosaic", "破壞"];
    let containsAny = tk_tag.some(t => tk_str.includes(t));


    //d["img"] = getDefaultFromDict(data, "pic_l", "/static/images/waitindexpic.gif");
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "aid", "aid");
    let stars = getDefaultFromDict(data, "stars", []);
    d["star1"] = getDefaultFromDict(stars, 0, "");
    d["star2"] = getDefaultFromDict(stars, 1, "");
    d["star3"] = getDefaultFromDict(stars, 2, "");
    let av_file = getDefaultFromDict(data, "av_file", {});

    if("已解码"  in av_file){
        d["background"] = "background-color: antiquewhite !important;";
    }
    else{
        if(containsAny){
            d["background"] = "background-color: cadetblue !important;";
        }
        else{
            d["background"] = "";
        }
    }



    return d;
}

function lfListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "name_cn", "");
    if (d["title"] == "")
        d["title"] = getDefaultFromDict(data, "name", "");
    d["rating"] = getDefaultFromDict(data, "rating", {"score": 0})["score"];
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 2);
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["eps"] = getDefaultFromDict(data, "eps", 0);
    // d["fanhao"] = getDefaultFromDict(data, "aid", "aid");

    return d;
}


function tkListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["type"] = getDefaultFromDict(data, "type", "");
    //d["pic"] = getDefaultFromDict(data, "pic", "/static/images/waitindexpic.gif");
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "aid": data["aid"]});
    let stars = getDefaultFromDict(data, "stars", []);
    d["star1"] =getDefaultFromDict(stars, 0, "");
    return d;
}

function tyListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["img"] = getDefaultFromDict(data, "pic_l", "/static/images/waitindexpic.gif");

    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "fanhao");
    let stars = getDefaultFromDict(data, "stars", []);
    d["star1"] = getDefaultFromDict(getDefaultFromDict(stars, 0, null), "StarName", "");
    d["star2"] = getDefaultFromDict(getDefaultFromDict(stars, 1, null), "StarName", "");
    d["star3"] = getDefaultFromDict(getDefaultFromDict(stars, 2, null), "StarName", "");
    return d;
}

function cmListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title_jpn", data["title"]);
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": data["_id"]});
    d["language"] = getDefaultFromDict(data, "language", "未知语言");
    d["filecount"] = getDefaultFromDict(data, "filecount", 0);
    d["list"] = getDefaultFromDict(data, "list", []);
    d["listcount"] = d["list"].length;
    if(d["listcount"] > 1){
        // title后面显示最终章名称
        let end_list = d["list"][d["listcount"] - 1];
        let list_title = end_list["title"];
        list_title = list_title.replaceAll(" ", "");
        d["list_title"] = list_title;
    }
    else{
        d["list_title"] = "";
    }
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "albim_likes", 0)));
    d["down"] = getDefaultFromDict(data, "pic_down", 0) == 1?"已下载": "未下载";
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["background"] = d["down"] == "已下载"?"background-color: antiquewhite !important;" : "";
    d["readers"] = getNo(parseInt(getDefaultFromDict(data, "readers", 0)));
    let type = getDefaultFromDict(data, "types", []);
    d["type1"] = getDefaultFromDict(type, 0, "");
    d["type2"] = getDefaultFromDict(type, 1, "");

    let comment_info = getDefaultFromDict(data, "comment_info", {});
    d["comment"] = "";
    if("c" in comment_info){
        d["comment"] = `</br>pid: ${comment_info["pid"]} --  ${comment_info["c"]}`;
    }



    return d;
}


function cbListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title_jpn", data["title"]);
    d["thumb_load"]  = 2;
    d["img"] = getDefaultFromDict(data, "pic", "");
    d["language"] = getDefaultFromDict(data, "language", "未知语言");
    d["filecount"] = getDefaultFromDict(data, "filecount", 0);
    d["list"] = getDefaultFromDict(data, "list", []);
    d["listcount"] = d["list"].length;
    if(d["listcount"] > 1){
        // title后面显示最终章名称
        let end_list = d["list"][d["listcount"] - 1];
        let list_title = end_list["title"];
        list_title = list_title.replaceAll(" ", "");
        d["list_title"] = list_title;
    }
    else{
        d["list_title"] = "";
    }
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "albim_likes", 0)));
    d["down"] = getDefaultFromDict(data, "pic_down", 0) == 1?"已下载": "未下载";
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["background"] = d["down"] == "已下载"?"background-color: antiquewhite !important;" : "";
    d["readers"] = getNo(parseInt(getDefaultFromDict(data, "readers", 0)));

    d["type1"] = getDefaultFromDict(data, "type", "");
    d["type2"] = "";
    return d;
}

function bsListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title_jpn", data["title"]);
    d["thumb_load"]  = 2;
    let pic = getDefaultFromDict(data, "pic", "");
    d["pic"] = getCacheImgSrc(pic);


    d["list"] = getDefaultFromDict(data, "list", []);
    d["listcount"] = d["list"].length;
    if(d["listcount"] > 1){
        // title后面显示最终章名称
        let end_list = d["list"][d["listcount"] - 1];
        let list_title = end_list["title"];
        list_title = list_title.replaceAll(" ", "");
        d["list_title"] = list_title;
    }
    else{
        d["list_title"] = "";
    }
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "likes", 0)));

    d["date"] = getDefaultFromDict(data, "date", "未知日期");

    return d;
}

function bkListData(data){
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title_jpn", data["title"]);
    d["thumb_load"]  = getDefaultFromDict(data, "thumb_load", 0);
    d["img"] = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "cid": data["cid"]});
    d["language"] = getDefaultFromDict(data, "language", "未知语言");
    d["filecount"] = getDefaultFromDict(data, "pagesCount", 0);
    d["list"] = getDefaultFromDict(data, "list", []);
    d["listcount"] = d["list"].length;
    if(d["listcount"] > 1){
        // title后面显示最终章名称
        let end_list = d["list"][d["listcount"] - 1];
        let list_title = end_list["title"];
        list_title = list_title.replaceAll(" ", "");
        d["list_title"] = list_title;
    }
    else{
        d["list_title"] = "";
    }
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "totalLikes", 0)));
    d["down"] = getDefaultFromDict(data, "pic_down", 0) == 1?"已下载": "未下载";
    d["date"] = getDefaultFromDict(data, "updated_at", "未知日期").slice(0,10);
    d["background"] = d["down"] == "已下载"?"background-color: antiquewhite !important;" : "";
    d["readers"] = getNo(parseInt(getDefaultFromDict(data, "totalViews", 0)));
    let type = getDefaultFromDict(data, "categories", []);
    d["type1"] = getDefaultFromDict(type, 0, "");
    d["type2"] = getDefaultFromDict(type, 1, "");
    d["type3"] = getDefaultFromDict(type, 2, "");
    return d;
}




async function imgLoad(list_data){
    if(window.page_type== "list" || window.page_type== "bookmark" || window.page_type== "history") {
        // 建立一个list 图片查询,
        let down_id_list = [];
        $("#list,#history,#bookmark").find(".post-card img").each(function () {
            let id = $(this).attr("id");
            let thumb_load = $(this).attr("thumb_load");
            if (thumb_load == "2") {
                //response?prefix=ex&type=thumb&gid=2077769&timestamp=1702531631042
                let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": id});
                $(this).attr("src", src);
            }
            else if(thumb_load == "10"){
                $(this).attr("src", $(this).attr("data-original"));
            }
            else {
                down_id_list.push(id);
            }
        });
        if(["lm", "cb"].includes(window.prefix) == false){
            await window.web_tools.start("thumb", down_id_list, ["list", "bookmark", "history"], thumbCallBack);
        }


    }
    if(window.page_type== "info"){
        let thumb_img = $("#info .post-single-image img");
        let id = thumb_img.attr("id");
        let thumb_load = thumb_img.attr("thumb_load");
        if(thumb_load == 2){
            let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": id});
            thumb_img.attr("src", src);
        }
        else if(thumb_load == 3){
            let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": id, "thumbmodel": "fanart"});
            thumb_img.attr("src", src);
        }
        else if(thumb_load == "10" || thumb_load == 10){
            thumb_img.attr("src", thumb_img.attr("data-original"));
        }
    }
}

function thumbCallBack(data){
    let info = data["info"];
    for(let j in info){
        let item = info[j];
        if(item["complete"] == "True"){
            let _id = item["_id"];
            let img = $("#list,#history,#bookmark").find("img[id='"+_id+"']");
            if(img.attr("load") != 1){
                let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": _id});
                img.attr("src", src);
                img.attr("load", "1")
            }
        }
    }
}

function addOver(){
    //插入结束后，隐藏一些无效项
    $(".categorie").each(function(){
        let c = $(this);
        if(c.html().trim() == ""){
            c.hide();
        }
    });

}




function changeColumnCount(col_count){
    //改变每列的显示数量
    setCookie(window.prefix+"-col", col_count);
    // $("#main_nav a[col]").attr("class", "dropdown-item");
    // $("#main_nav a[col='"+col_count+"']").attr("class", "dropdown-item active");
    $(".setting .cols button").attr("class", "btn btn-outline-info");
    $(".setting .cols button[value='"+col_count+"']").attr("class", "btn btn-info");
    $("#list,#history,#bookmark").attr("class", "list-col-" + col_count);
    window.col_count = col_count;
}


/**************************主页加载更多页码*************************/
function bodyLoadMore(){

}


async function searchData(){
    let search = {};
    if(window.page_type =="bookmark"){
        if($("#bookmark .list-columns").html() == ""){
            window.page_bookmark = 0;
        }
        if(window.page_count_bookmark > window.page_bookmark || window.page_bookmark==0) {
            search["mark"] = 1;
            getList(window.prefix, window.page_bookmark + 1, search);
        }
        else{
            //printInfo("最后一页了");
        }
    }
    else if(window.page_type == "history"){
        if($("#history .list-columns").html() == ""){
            window.page_history = 0;
        }
        if(window.page_count_history > window.page_history || window.page_history==0) {
            search["history"] = 1;
            getList(window.prefix, window.page_history + 1, search);
        }
        else{
            //printInfo("最后一页了");
        }
    }
    else{
        if(window.page_count > window.page || window.page==0) {
            search["search_str"] = $(".search .search-input").val();
            search["order"] = getDefault(window.order);
            search["order_type"] = getDefault(window.order_type);
            //获取tag
            let tags = [];
            $(".search-tag .active-tag-list a").each(function(){
                let tag_id = $(this).attr("tag_id");
                tags.push(tag_id);
            });

            search["tags"] = JSON.stringify(tags);
            getList(window.prefix, window.page + 1, search);
        }
        else{
            printInfo("最后一页了");
        }
    }


}

function buttonBind(){
    $(".search .search-btn").click(function(){
        search();
    });
    $(".search .search-input").keypress(function(event){
        let keynum = (event.keyCode ? event.keyCode : event.which);
        if(keynum == '13'){
            search();
        }
    });

}


function search(){
        $(".loading").show();
        $(".list-columns").empty();
        window.page = 0;
        window.next_gid = 0;
        searchHistory();

        searchData();

        $('.search').removeClass('search-open');

        toList(0);
}


function setListCol(){

    let col_count = parseInt(window.col_count);
    if(window.innerWidth<=360){
        if(col_count>2)
            col_count = 2;
    }
    else if(window.innerWidth<=720){
        if(col_count>4)
            col_count = 4;
    }
    else if(window.innerWidth<=1280){
        if(col_count>6)
            col_count = 6;
    }
    else if(window.innerWidth >= 1281 && window.innerWidth<1920){
        if(col_count<4)
            col_count = 4
    }
    else if(window.innerWidth >= 1920 && window.innerWidth<2560){
        if(col_count<4)
            col_count = 4
    }
    else if(window.innerWidth >= 2560){
        if(col_count<6)
            col_count = 6
    }
    changeColumnCount(col_count);   //list每行显示列数
}