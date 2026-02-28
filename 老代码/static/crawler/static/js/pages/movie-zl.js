var jishu = 0;
var ova_ji = 0;
var bgm_data = [];
var bgm_item = null;
var bgm_post = "";
var use_bid = 0;
var trakt_data = [];
var img_data = {};
var send_data = null;
var ass_data = [];
var bgm_token = "";
var site_ids = {};
var log_timer;

$( document ).ready(function() {
    bgm_token =getUrlParam("token");
    $step = $("#step");
    step_load();
    ass_search_set();
    if(bgm_token == null){
        $("#bgmModal").modal();

        $(".login-bgm").click(function(){
            let temp = "dongman-zl";
            if($("#link_type").val() == "movie")
                temp = "movie-zl";
            let callback_url = window.location.protocol + "//"+ window.location.host + "/status?cls=ZhengliStatus&type=loginbgm&temp="+temp;
            $("#bgm-form input[name='redirect_uri']").val(callback_url);
            $("#bgm-form").submit();
        });
    }



    // Ajax
    $('#ajaxTree').jstree({
		'core' : {
			'check_callback' : true,
			'themes' : {
				'responsive': false
			},
            'data' : {
                'url' : function (node) {
                    let url = "/set?cls=ZhengliStatus&type=getfiles";

                    if(node.id != "#"){
                        if(node.parents.length >= 2){
                            console.log(node.parents);
                            // for(let i=node.parents.length-2; i--; i>=0){
                            //     console.log(node.parents[i]);
                            // }
                            let text = "";
                            for(let i=0;i<node.parents.length-1;i++){
                                text = node.parents[i] + "/" +text;
                            }
                            text = text + node.text;
                            url = "/set?cls=ZhengliStatus&type=getfiles&node=" + encodeURIComponent(text);
                        }
                        else{
                            url = "/set?cls=ZhengliStatus&type=getfiles&node=" + encodeURIComponent(node.text);
                        }

                    }
                    return url;
                },
                'data' : function (node) {
                    return { 'id' : node.id };
                }
            }
        },
        "types" : {
            'default' : {
                'icon' : 'fa fa-folder icon-state-info icon-md'
            },
            'file' : {
                'icon' : 'fa fa-file icon-state-default icon-md'
            }
        },
        "plugins" : [ "contextmenu", "dnd", "search", "state", "types", "wholerow" ]
    });
});



async function dongmanSearch() {
    $("#video").empty();
    $("#video_change").empty();
    let node = $('#ajaxTree').jstree(true).get_selected(true)[0];
    let text = "";
    if(node.parents.length >= 2){
        for(let i=0;i<node.parents.length-1;i++){
            text = node.parents[i] + "/" +text;
        }
        text = text + node.text;
    }
    else {
        text = node.text;
    }
    let html = $("temp.filetemp").html();
    let url = "status?cls=ZhengliStatus&type=searchfiles&ext=video&node=" + encodeURIComponent(text);
    let data = await fetchApi(url);
    $(".files").empty();
    let index = 0;
    for(let i in data){
        let file = data[i];
        $(".files").append(stringFormatByDict(html, {"parent": file["parent"], "file": file["file"], "size": file["size"], "path": file["fullpath"], "index": index}));
        index++;
    }


    bindingZhengliButton();
}

function showSearchModal() {
    bgm_data = [];
    trakt_data = [];
    use_bid = 0;
    ass_data = [];
    img_data = {};
    bgm_item = {};
    send_data = null;
    $(".search_img").empty();
    $step.toStep(0);
    show_step_info(0);
    $("#myModal input").val("");
    $("#myModal tbody").empty();
    $(".ass-search").empty();
    $(".ass-videos").empty();
    $(".ass-asss").empty();

    let node = $('#ajaxTree').jstree(true).get_selected(true)[0];
    $(".filename").val(node.text);
    $(".searchname").val(node.text);
    $('#myModal').modal();


    $("#video_change .link").each(function(){
        let a = $(this);
        let oldpath = a.attr("oldpath");
        let filename = a.attr("oldfilename");
        let path = a.attr("path");
        let append_a = $('<a href="javascript:void(0);" filename="'+filename+'" path="'+path+'" class="list-group-item"><h4 class="list-group-item-heading">' + filename +  ' </h4></a>');
        $(".ass-videos").append(append_a);
    });
}

async function bgmsearch() {
    let token = getUrlParam("token");
    let text = $("input.searchname").val();
    let url = "status?cls=ZhengliStatus&type=search&token={token}&search_text={text}&search_type=text";
    url = stringFormatByDict(url, {"token": token, "text": text})
    let data = await fetchApi(url);
    $(".bgm_data_list tbody").empty();
    data = data["list"];
    for(d in data){
        let type = data[d]["type"];

        let html = '<tr>';
        let img = data[d]["images"]["common"];
        console.log(data[d]);


        let title = data[d]["name"];
        let chinese = "";
        if ("name_cn" in data[d])
            chinese = data[d]["name_cn"];
        let bid = data[d]["id"];
        let url = "https://bgm.tv/subject/" + bid;
        html += "<td><img style='width:150px;' src='"+ img +"' /></td><td>"+ title+"</td><td>"+chinese+"</td>" ;
        html +="<td><button class='btn btn-default' onclick='go_url(\""+ url  +"\")'>查看</button></td>" ;
        html += "<td><button class='btn btn-default' bid='"+bid+"' onclick='startZhengli("+bid+");'>使用</button></td>" ;
        html += "</tr>";
        $(".bgm_data_list tbody").append(html);

    }
}

function go_url(url){
    window.open(url);
}

async function startZhengli(bid){
    let node = $('#ajaxTree').jstree(true).get_selected(true)[0];
    let text = "";
    let token = getUrlParam("token");
    if(node.parents.length >= 2){
        for(let i=0;i<node.parents.length-1;i++){
            text = node.parents[i] + "/" +text;
        }
        text = text + node.text;
    }
    else {
        text = node.text;
    }
    let url = "status?cls=ZhengliStatus&type=zhengli&token={token}&bid={bid}&node={node}";
    url = stringFormatByDict(url, {"token": token, "bid": bid, "node": encodeURIComponent(text)});
    let data = await fetchApi(url);
    toastr.success('成功:', data["msg"])
    $('#searchModal').modal('hide');
}


function bindingZhengliButton(){

    $(".use").click(function(){
        let path = $(this).parent().attr("path");
        showSearchModal(path);

    });

    



}


function get_end_video_str(old_path, video, oldfilename){
    return '<a href="javascript:void(0);" oldfilename="'+oldfilename+'" oldpath="'+ old_path + '" path="'+video+'" class="list-group-item video_change link"><h4 class="list-group-item-heading">' + video +  '</h4><button class="from">...</button></a>'
}



function title_change(season){
    jishu = 0;
    ova_ji = 0;
    $(".video.active").each(function(){
        jishu = jishu + 1;
        let old_path = $(this).attr("path");
        let index = old_path.lastIndexOf("/");
        title = old_path.substring(index + 1,old_path.length);

        let ji = pad(parseInt(season), 1);
        //let ji = pad(parseInt($(".ji-num").val()), 2) ;
        let num = pad(parseInt(jishu), 3);
        let pre_title =  "S" + ji + "E" + num + "  ";
        let video = "";
        if(title.indexOf(pre_title)>=0){
            video = "S"+ ji + "/" + title;
        }
        else{
            video = "S"+ ji + "/" + pre_title + title;
        }

        let a = $(get_end_video_str(old_path, video, title));
        a.css("height", $("#video a").eq($("#video_change a").length).outerHeight());
        $("#video_change").append(a);
    });
}


function pad(num, n) {
  var len = num.toString().length;
  while(len < n) {
    num = "0" + num;
    len++;
  }
  return num;
}


//对比字符串找差异
function levenshtein(str1,str2) {
	var len1 = str1.length;
	var len2 = str2.length;
	var arr = [];
	for (var y = 0; y <= len1; y++)
		arr[y] = [y];
	for (var x = 1; x <= len2; x++)
		arr[0][x] = x;
	for (var y = 1; y <= len1; y++)
		for (var x = 1; x <= len2; x++)
			arr[y][x] = Math.min(
				arr[y-1][x]+1,
				arr[y][x-1]+1,
				arr[y-1][x-1]+(str1[y-1]==str2[x-1]?0:1)
			);
	//console.table(arr);
	return 1 - arr[len1][len2] / Math.max(len1,len2);
}

//从数组中找到最接近的值
function getSameStr(str, str_array){


    let samelevel = 0;
    let samestr = "";
    for(let index in str_array){
        let str2 = str_array[index];
        let newsamelevel = levenshtein(str, str2);
        if(newsamelevel > samelevel){
            samelevel = newsamelevel;
            samestr = str2;
        }
    }

    return samestr;
}

function step_load(){

    $step.step({
        index: 0,
        time: 500,
        title: ["番组计划查询", "字幕查询", "trakt查询", "图片确认", "目录确认", "查看日志"]
    });
    show_step_info(0);

    $("#prevBtn").on("click", function() {
        $step.prevStep();
        show_step_info($step.getIndex());
    });

    $("#nextBtn").on("click", function() {
        $step.nextStep();
        show_step_info($step.getIndex());
    });
    setStepButton();

}


function show_step_info(step_index){
    $(".step-info").each(function(){
            let step_info = $(this);
            let index = parseInt(step_info.attr("index"));
            if(index == step_index){
                $(this).show();
            }
            else{
                $(this).hide();
            }

        });
}

function setStepButton(){
     /***********************番组计划查询********************************/
    $(".bgmsearch").click(async function(){
        let text = $(".form-control.searchname").val();
        let token = getUrlParam("token");
        let url = "/status?cls=ZhengliStatus&type=search&token={token}&search_text={text}&search_type=text";
        url = stringFormatByDict(url, {"token": token, "text": text})
        let data = await fetchApi(url);
        $(".bgm_data_list tbody").empty();
        data = data["list"];
        bgm_data = data;
        for(d in data){
            let type = data[d]["type"];
            let html = '<tr>';
            let img = data[d]["images"]["common"];
            console.log(data[d]);
            let title = data[d]["name"];
            let chinese = "";
            if ("name_cn" in data[d])
                chinese = data[d]["name_cn"];
            let bid = data[d]["id"];
            let url = "https://bgm.tv/subject/" + bid;
            html += "<td><img style='width:150px;' src='"+ img +"' /></td><td>"+ title+"</td><td>"+chinese+"</td>" ;
            html +="<td><button class='btn btn-default' onclick='go_url(\""+ url  +"\")'>查看</button></td>" ;
            html += "<td><button class='btn btn-default' bid='"+bid+"' onclick='bgmDataGet("+d+");'>使用</button></td>" ;
            html += "</tr>";
            $(".bgm_data_list tbody").append(html);

        }
    });

    /***********************traktTv查询********************************/

    $(".traktsearch").click(function(){
        site_ids = {};
        let search_text = $(".searchname2").val();
        let year =$(".searchyear2").val();

        let url = "/status?cls=ZhengliStatus&type=tarktsearch";

        $.post(url, {"text": search_text, "year": year}, function(data){
            if(data.length>0){
                console.log(data);
                trakt_data = data;
                $(".trakt_data_list tbody").empty();

                for(d in data){
                    d2 = data[d]["shows"][0];
                    let html = '<tr>';

                    let title = d2["title"];
                    let year = d2["year"];

                    html += "<td>"+ title+"</td><td>"+year+"</td>" ;
                    html +='<td><div class="btn-group btn-group-xs">';
                    for(id in d2["ids"]["ids"]){
                        let key =id;
                        let value = d2["ids"]["ids"][id];
                        let url ="";
                        if(key == "imdb"){
                            url ="https://www.imdb.com/title/" + value;
                            site_ids["imdb"] = value
                        }
                        else if(key == "slug"){
                            url ="https://trakt.tv/shows/" + value;
                            site_ids["trakt"] = value
                        }
                        else if(key == "tmdb"){
                            site_ids["tmdb"] = value
                        }
                        else if(key == "trakt"){
                            key = "fanart";
                            value = d2["ids"]["ids"]["tvdb"];
                            url ="https://fanart.tv/series/" + value;
                        }
                        else if(key == "tvdb"){
                            url ="https://thetvdb.com/?tab=series&id=" + value;
                            site_ids["tvdb"] = value
                        }
                        html += '<button type="button" class="btn btn-default" onclick="go_url(\''+ url +'\')">'+ key +'</button>';
                    }
                    html +='</div></td>' ;
                    html += "<td><button class='btn btn-default' onclick='traktDataGet("+d2["ids"]["ids"]["tvdb"]+");'>使用</button></td>" ;
                    html += "</tr>";
                    $(".trakt_data_list tbody").append(html);
                }

            }
            else{
                alert("没有数据");
            }
        });

    });


    $(".traktsearchid").click(function(){
        let tvdb_id = $(".searchid2").val();
        traktDataGet(tvdb_id);
    });


    /****************图像选择完成*********************/
    $(".img_set").click(function(){
        $(".search_img .active").each(function(){
            let url = $(this).attr("data-src");
            let title = $(this).parent().attr("type");
            if(title.indexOf("season")>=0)
                title = title.replace("season", "season" + pad(parseInt($(".ji-num").val()), 2));
            img_data[title] = url;
        });

        let i =0;
        $("div[type='fanart'] div").each(function(){
            if ($(this).hasClass("active")){

            }
            else{
                i++;
                let title = "fanart" + i;
                let url = $(this).attr("data-src");
                img_data[title] = url;
            }
        });

        console.log(img_data);
        link_set();

    });


    $(".info_start").click(function () {
        $step.nextStep();
        show_step_info($step.getIndex());
        link();
    });

    $(".ass_set").click(function(){
        ass_data = [];
        $(".ass-asss select").each(function(){
            let s = $(this);
            let ass_old_path = s.find("option:selected").attr("path");
            let newpath = s.attr("path");

            newpath  = newpath.substring(0, newpath.lastIndexOf("."));

            let ext = ass_old_path.substring(ass_old_path.lastIndexOf(".") + 1,ass_old_path.length);

            newpath = newpath + "." + ext;

            ass_data.push({"from": ass_old_path, "to": newpath});
            //console.log(ass_data);
            //let ass_name

        });
        $step.nextStep();
        show_step_info($step.getIndex());


    });
}



function bgmDataGet(index){
    let item = bgm_data[index];
    bgm_item = item;
    use_bid = item["id"];
    bgm_post  = item["images"]["large"];
    let start_play = "";
    if("start_play" in item){
        start_play = item["start_play"];
    }
    if(start_play != ""){
        start_play = new Date(start_play);
        start_play = start_play.getFullYear();
    }
    $(".filename2").val(item["name"]);
    $(".searchname2").val(item["name"]);
    $(".searchyear2").val(start_play);

    $(".ass-filename").val($('#ajaxTree').jstree(true).get_selected(true)[0].text);
    $(".ass-title").val(item["name"]);

    $(".ass-title-cn").val(item["name_cn"]);


    $step.nextStep();
    show_step_info($step.getIndex());
}


function traktDataGet(tvdb_id){
    console.log(tvdb_id);

    $step.nextStep();
    show_step_info($step.getIndex());

    let url = "/status?cls=ZhengliStatus&type=findimg";
    $("#loadingModal").show();
    $.post(url, {"id": tvdb_id}, function(data){
        if("poster" in data){
            console.log(data);
            $("#loadingModal").hide();
            let poster = data["poster"];
            poster.push(bgm_post);
            data["poster"] = poster;
            $(".search_img").empty();
            html ="";
            for(let key in data){

                html += "<h1 class='col-xs-12 col-sm-12'>" +key+  "</h1>";
                html +="<div type='"+ key +"'>";
                for (let i in data[key]){
                    let active = "";
                    if(i ==0) active = "active";
                    html += "<div class='col-xs-12 col-sm-4 "+ active +"'  data-src='"+data[key][i]+"'><img  src='" + data[key][i] +  "' /></div>";
                }
                html +="</div>"
            }
            $(".search_img").append(html);


           $(".search_img img").click(function(){
               let img = $(this);
               let divs = img.parent().siblings();
               divs.removeClass("active");
               $(this).parent().addClass("active");

           });

        }
    }).fail(function(){
        alert("查询失败");
        $("#loadingModal").hide();
    });

}

function ass_search_set(){
    $(".ass-filename-search").click(function(){
        let text = $(".ass-filename").val().trim();
        ass_search(text);
    });
    $(".ass-title-search").click(function(){
        let text = $(".ass-title").val().trim();
        ass_search(text);
    });
    $(".ass-title-search-cn").click(function(){
        let text = $(".ass-title-cn").val().trim();
        ass_search(text);
    });
}


function ass_search(text){
    let url = "/status?cls=ZhengliStatus&type=asssearch&text={text}";
    url = stringFormatByDict(url, {"text": text})
    $(".ass-search").empty();
    $.post(url, {"text": text}, function(data){
        if(data.length ==0){
            //alert("没有对应字幕");
            let a = $('<a  class="list-group-item "><h4 class="list-group-item-heading">没有数据</h4></a>');
            $(".ass-search").append(a);
        }
        else{
            console.log(data);
            for(let index in data){
                let href = data[index]["href"];
                let title = data[index]["title"];
                let a = $('<a href="javascript:void(0);" data="'+href+'"  class="list-group-item "><h4 class="list-group-item-heading">' + title +  ' </h4></a>');
                a.click(function(){
                    $(".ass-asss").empty();
                    let href = $(this).attr("data");
                    let url = "/status?cls=ZhengliStatus&type=asszip";
                    $.post(url, {"href": href}, function(zipdata){
                        console.log(zipdata);
                        $(".ass-videos a").each(function(){
                            let a = $(this);
                            let height = a.outerHeight();
                            let path = a.attr("path");
                            let filename = a.attr("filename");
                            let samefile = getSameStr(filename, zipdata["assfiles"]);
                            let samefile_sc = samefile.replace(".tc.", ".sc.");
                            if (samefile_sc in zipdata["assfiles"]){
                                samefile = samefile_sc;
                            }

                            selectpicker = $('<select class="selectpicker list-group-item"> </select>');
                            for(let index in zipdata["assfiles"]){
                                let ass_file = zipdata["assfiles"][index];
                                let option = $('<option>'+ass_file+'</option>');
                                option.val(ass_file);
                                option.attr("path", zipdata["asspaths"][index]);
                                selectpicker.append(option);
                            }
                            selectpicker.val(samefile);
                            selectpicker.css("height", height);
                            selectpicker.attr("assid", zipdata["id"]);
                            selectpicker.attr("filename", a.attr("filename"));
                            selectpicker.attr("path", a.attr("path"));
                            $(".ass-asss").append(selectpicker);

                        });

                    })

                });
                $(".ass-search").append(a);
            }
        }
    });
}


function link(){
    clearInterval(log_timer);
    log_timer = setInterval(function(){showlog()}, 5000);
    showlog();
    if(window.send_data !=null){

        let url = "/status?cls=ZhengliStatus&type=dongmanlink";
        let link_type = "anime";
        if($("#link_type").val() == "movie")
            link_type = "movie";
        console.log(link_type);
        $.post(url, {"link":JSON.stringify(window.send_data), "info": JSON.stringify(bgm_item), "ass_link": JSON.stringify(ass_data),
            "imgs": JSON.stringify(img_data), "site_ids":JSON.stringify(site_ids),"season": $(".ji-num").val() ,  "token": bgm_token, "link_type": link_type},
            function(data){
            clearInterval(log_timer);
            if(data =="sucess"){
                alert("完成");
            }
            else{
                alert(data);
            }

        }).fail(function(){
            clearInterval(log_timer);
        });
    }
}

function showlog() {
    let url = "/status?cls=ZhengliStatus&type=linklog";
    //let url = "/file_link_data?type=linklog";
    $.get(url, function(data){
        //console.log(data);
        // if(data.length >=10){
        //     data = data.slice(10);
        // }
        let html = "";
        for(let i in data){
            let msg = data[i];
            //console.log(msg);
            html += "<p>"+msg["datetime"]+":&nbsp"+msg["data"]+"</p>";
        }
        $(".link_log").html(html);

    });
}



function link_set(){
    //软连接查看
    let season = $(".ji-num").val();
    let title = "";
    let data = bgm_item;
    if("chinese_name" in data)
        title = data["chinese_name"];
    else if("name" in data)
        title = data["name"];
    else if("title" in data)
        title = data["title"];
    let num = 0;
    let path_new = title + "/" + "S" + pad(parseInt($(".ji-num").val()), 2)  ;
    send_data = new Array();

    $(".video_link").empty();
    $("#video_change .link").each(function(){
        let path1 = $(this).attr("oldpath");
        let path2 = $(this).attr("path");
        send_data.push({"from": path1, "to": path2});
        let a = '<a class="list-group-item"><h4>'+ path1+ '</h4> >> <h4>'+ path2 + '</h4> </a>';
        $(".video_link").append(a);
        num = num + 1;
    });
    console.log(send_data);
    $step.nextStep();
    show_step_info($step.getIndex());
}