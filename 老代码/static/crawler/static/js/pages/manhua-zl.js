$( document ).ready(function() {
    // bgm_token =getUrlParam("token");
    // if(bgm_token == null){
    //     $("#bgmModal").modal();
    //
    //     $(".login-bgm").click(function(){
    //         let callback_url = window.location.protocol + "//"+ window.location.host + "/status?cls=ZhengliStatus&type=loginbgm&temp=manhua-zl";
    //         $("#bgm-form input[name='redirect_uri']").val(callback_url);
    //         $("#bgm-form").submit();
    //     });
    // }
    //
    // $("button.bgmsearchid").click(function(){
    //     let bid = $("input.searchid").val();
    //     startZhengli(bid);
    //     }
    // );

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



async function manhuaSearch() {

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
    let url = "status?cls=ZhengliStatus&type=searchfiles&ext=zip&node=" + encodeURIComponent(text);
    let data = await fetchApi(url);
    $(".files").empty();
    for(let i in data){
        let file = data[i];
        $(".files").append(stringFormatByDict(html, {"filename": file["file"]}));
    }
}

async function showSearchModal() {
    // let node = $('#ajaxTree').jstree(true).get_selected(true)[0];
    // $("input.searchname").val(node.text);
    // $("#searchModal").modal();
    console.log("开始整理");
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
    let url = `status?cls=ZhengliStatus&type=lmzl&node=${encodeURIComponent(text)}`;
    console.log(url);
    let data = await fetchApi(url);
    toastr.success('成功:', data["msg"])
    //$('#searchModal').modal('hide');
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

