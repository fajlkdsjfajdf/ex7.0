var jishu = 0;
var ova_ji = 0;
var av_data = [];
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
var av_path = "";

$( document ).ready(function() {

    $step = $("#step");
    step_load();





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


async function autoAdd(){
    let is_uncensored = $("#ck_uncensored").is(':checked');
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
    //let url = "status?cls=ZhengliStatus&type=autoadd&ext=video&node=" + encodeURIComponent(text);
    let url = "status";

    let info = {
        'cls': 'ZhengliStatus',
        'type': 'autoadd',
        'is_uncensored': is_uncensored,
        'node': encodeURIComponent(text)
    }

    let data = await fetchApi(url, "GET", info);
    alert(data["msg"]);
}

function showSearchModal(path) {

    av_path = path;
    $(".filename").val(path);
    //$(".searchname").val(path.search(/[A-Za-z][A-Za-z0-9]{1,6}-\\d{2,5}/i));

    let pattern = /[A-Za-z][A-Za-z0-9]{1,6}-\d{2,5}/;
    let search = pattern.exec(path);
    if(search!= null && search.length >0)
        $(".searchname").val(search[0]);
    else
        $(".searchname").val(path);
    $("#myModal tbody").empty();
    $('#myModal').modal();
}


async function bindingZhengliButton(){

    $(".use").click(function(){
        let path = $(this).parent().attr("path");
        showSearchModal(path);

    });

    let url = "status?cls=ZhengliStatus&type=getavlink";
    let link_data = await fetchApi(url);
    console.log(link_data);
    $("#video a").each(function(){
        let a = $(this);
        let path = a.attr("path");
        for(let i=0;i<link_data.length;i++){
            let file_path = link_data[i]["file_path"];
            if(path.indexOf(file_path)>=0){
                a.css("background", "red");
                break;
            }
            let pattern = /[A-Za-z][A-Za-z0-9]{1,6}-\d{2,5}/;
            let search = pattern.exec(path);
            if(search && search.length >0){
                let fanhao = search[0];
                if(file_path.indexOf(fanhao)>=0){
                    a.css("background", "red");
                    console.log(fanhao);
                    break;
                }

            }
        }

    });



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
        let url = "/status?cls=ZhengliStatus&type=searchyouma&search_text={text}&search_type=text";
        url = stringFormatByDict(url, {"text": text})
        let data = await fetchApi(url);
        $(".bgm_data_list tbody").empty();

        av_data = data;
        for(d in data){
            let type = "";
            let html = '<tr>';
            let img = data[d]["pic_l"];
            //img = "/proxy?url=" + img;
            console.log(data[d]);
            let title = data[d]["title"];
            let chinese = data[d]["fanhao"];
            let id = data[d]["_id"];
            let url = "";
            html += "<td><img style='width:350px;' src='"+ img +"' /></td><td>"+ title+"</td><td>"+chinese+"</td>" ;
            //html += "<td><iframe style='width:350px;' src='"+ img +"' /></td><td>"+ title+"</td><td>"+chinese+"</td>" ;
            html += "<td><button class='btn btn-default' id='"+id+"' onclick='avDataGet("+d+");'>使用</button></td>" ;
            html += "</tr>";
            $(".bgm_data_list tbody").append(html);

        }
    });







}


async function avDataGet(index){
    let is_uncensored = $("#ck_uncensored").is(':checked');
    //console.log(is_uncensored);

    let item = av_data[index];

    let id = item["_id"];
    let url = "/status?cls=ZhengliStatus&type=youmaavlink";
    let data = await fetchApi(url, "POST", {"item": item, "path": av_path, "is_uncensored": is_uncensored});
    alert(data);
}



function link(){
    clearInterval(log_timer);
    log_timer = setInterval(function(){showlog()}, 5000);
    showlog();
    if(window.send_data !=null){

        let url = "/status?cls=ZhengliStatus&type=dongmanlink";
        $.post(url, {"link":JSON.stringify(window.send_data), "info": JSON.stringify(bgm_item), "ass_link": JSON.stringify(ass_data),
            "imgs": JSON.stringify(img_data), "site_ids":JSON.stringify(site_ids),"season": $(".ji-num").val() ,  "token": bgm_token},
            function(data){
            clearInterval(log_timer);
            if(data["state"] =="success"){
                alert("完成");
            }
            else{
                alert(data["msg"]);
            }

        }).fail(function(){
            clearInterval(log_timer);
        });
    }
}




