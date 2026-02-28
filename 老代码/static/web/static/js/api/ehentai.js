function load(){
    console.log("载入ehentai脚本");
    setCss();
    createFloatingButton(false);
    createButton();
    getLink();
}

function createButton(){
    $(".gl3c a").attr("target", "_blank");

    // 添加链接
    let $button_link = $('<button  class="login-btn" style="top:80px;">链接项目</button>');
    $button_link.on("click", function(){
        setItemLink();
    });
    $("body").append($button_link);

    // 删除链接
    let $button_dellink = $('<button  class="login-btn" style="top:130px;">删除链接</button>');
    $button_dellink.on("click", function(){
        delLink();
    });
    $("body").append($button_dellink);

    // 批量映射
    let $button_batchlink = $('<button  class="login-btn" style="top:190px;">批量映射</button>');
    $button_batchlink.on("click",async function(){
        showTable("", 800, 600);
         let p = $(`<p>
         开始页码：<input type="text" id="page_start" value="1"/> 
         结束页码: <input type="text" id="page_end"  value="1"/>  
         偏转页码: <input type="text" id="page_f"  value="+"/>  <input type="text" id="page_p"  value="0"/>  
         操作: <input type="button" id="btn_apply"  value="应用"/><input type="button" id="btn_ok"  value="提交"/>
         </p>`);
        $("#down_div").append(p);
        $("#down_div").append("<div id='imgs_div'></div>");
        $("#btn_ok").on("click",async function(){
            if(window.link_data){
                let login_code = getCookie("login_code");
                let item_unmosaic_url = window.location.href;
                let item_unmosaic_params = extractehentaiParam(item_unmosaic_url);
                let gid =parseInt(item_unmosaic_params["gid"]);
                 let data = await fetchApi(apiHost+ "response_api", "POST", {
                    "prefix": "ex",
                    "type": "apisearch",
                    "code": login_code,
                    "fun": "link_data",
                    "gid": gid,
                     "link_data": window.link_data

                });
                if("status" in data && data["status"] == "success"){
                    alert("完成");
                }

            }
        });

        $("#btn_apply").on("click", function(){
            let page_start = parseInt($("#page_start").val());
            let page_end = parseInt($("#page_end").val());
            let page_p = parseInt($("#page_p").val());
            let page_f = $("#page_f").val();
            window.link_data = [];
            $("#imgs_div").empty();
            for(let i= page_start; i<=page_end; i++){
                let p2 = $(`<p>${i}</p>`);

                let src_1 = window.images_unmosaic[i -1]["t"];
                let $img_1 = $(`<img width=350 src="${src_1}"/>`);

                let src_2 = "";
                let page2 = i;
                if(page_f == "+"){
                    page2 = i + page_p;
                }
                else{
                    page2 = i - page_p;
                }
                window.link_data.push([i, page2]);
                if(window.images_mosaic.hasOwnProperty(page2 -1 )){
                    src_2 = window.images_mosaic[page2 -1]["t"];;
                }
                let $img_2 = $(`<img id="img_masaic" width=350 src="${src_2}"/>`);
                p2.append($img_1);
                p2.append($img_2);
                $("#imgs_div").append(p2);
            }
            console.log(window.link_data);
        });


    });
    $("body").append($button_batchlink);
}




async function setItemLink(click=false){
    if(click == false){
        showTable("", 300, 250);
         let p = $(`<p>
            <textarea rows="7"  type="text" id="mosaic_url" style="width:250px;" placeholder="请输入有修的网址"></textarea>
            <br><br>
            <label><input type="radio" name="theme" value="light"> light</label>
            <label><input type="radio" name="theme" value="mosaic"> mosaic</label>
            <label><input type="radio" name="theme" value="bar" checked> bar</label>
            <br><br>
            <button class="itemlink-ok">确定</button>
            <button class="itemlink-cancle">取消</button>
         </p>`);
        $("#down_div").append(p);
        $(".itemlink-ok").on("click",async function(){
            await setItemLink(true);
            $("#down_div").remove();
            $("#down_divbg").remove();
        });
        $(".itemlink-cancle").on("click", function(){
            $("#down_div").remove();
            $("#down_divbg").remove();
        });

    }
    else{
        let login_code = getCookie("login_code");
        if(login_code){
            let item_mosaic_url = $("#mosaic_url").val();
            let mosaic_type = $('input[name="theme"]:checked').val();
            console.log(item_mosaic_url);

            let item_unmosaic_url = window.location.href;
            let item_mosaic_params = extractehentaiParam(item_mosaic_url);
            let item_unmosaic_params = extractehentaiParam(item_unmosaic_url);
            if(item_mosaic_url && item_unmosaic_url && item_mosaic_params && item_unmosaic_params){
                let item_unmosaic_gid = item_unmosaic_params["gid"];     //无修的gid
                let item_ummosaic_token = item_unmosaic_params["token"];   //无修的token
                let item_mosaic_gid = item_mosaic_params["gid"];       //有修的gid
                let item_mosaic_token = item_mosaic_params["token"];     //有修的token
                let data = await fetchApi(apiHost+ "response_api", "POST", {
                    "prefix": "ex",
                    "type": "apisearch",
                    "code": login_code,
                    "fun": "link_item",
                    "link": {
                        "item_unmosaic_gid": parseInt(item_unmosaic_gid),
                        "item_ummosaic_token": item_ummosaic_token,
                        "item_mosaic_gid": parseInt(item_mosaic_gid),
                        "item_mosaic_token": item_mosaic_token,
                        "mosaic_type": mosaic_type
                    }

                });
                if("status" in data && data["status"] == "success"){
                    window.location.reload();
                }
            }


        }
    }




    // return null;
}

async function delLink(){
    let login_code = getCookie("login_code");
    let item_unmosaic_url = window.location.href;
    let item_unmosaic_params = extractehentaiParam(item_unmosaic_url);
    if(item_unmosaic_url && item_unmosaic_params) {
           let data = await fetchApi(apiHost+ "response_api", "POST", {
                "prefix": "ex",
                "type": "apisearch",
                "code": login_code,
                "fun": "link_del",
                "item_unmosaic_gid": parseInt(item_unmosaic_params["gid"])
            });
            if("status" in data && data["status"] == "success"){
                window.location.reload();
            }
    }
}

async function getLink(){



    //获取是否有链接项目
    let login_code = getCookie("login_code");
    let item_unmosaic_url = window.location.href;
    let item_unmosaic_params = extractehentaiParam(item_unmosaic_url);
    if(item_unmosaic_url && item_unmosaic_params) {
         let data = await fetchApi(apiHost+ "response_api", "POST", {
                "prefix": "ex",
                "type": "apisearch",
                "code": login_code,
                "fun": "get_link",
                "item_unmosaic_gid": parseInt(item_unmosaic_params["gid"])
         });
         if("status" in data && data["status"] == "success"){
                let info = data["info"];
                let item_unmosaic_gid = info["item_unmosaic_gid"];     //无修的gid
                let item_ummosaic_token = info["item_ummosaic_token"];   //无修的token
                let item_mosaic_gid = info["item_mosaic_gid"];       //有修的gid
                let item_mosaic_token = info["item_mosaic_token"];     //有修的token
                if(item_mosaic_gid && item_mosaic_token){
                    let $btn = $(`<button  class="login-btn" style="top:250px;">link->${item_mosaic_gid}</button>'`);
                    $btn.on("click", function(){

                        window.open(`https://${window.location.host}/g/${item_mosaic_gid}/${item_mosaic_token}/`);
                    });
                    $("body").append($btn);
                    getImageList(item_unmosaic_gid, item_ummosaic_token, item_mosaic_gid, item_mosaic_token);
                }

         }
    }
}

async function getImageList(item_unmosaic_gid, item_ummosaic_token, item_mosaic_gid, item_mosaic_token){
    // 先尝试从本地服务器获取，获取不到再去请求e绅士
    window.images_unmosaic  = await getMpv(item_unmosaic_gid);
    window.images_mosaic = await  getMpv(item_mosaic_gid);
    if(!window.images_unmosaic || !window.images_mosaic){
        let url_unmosaic = `https://${window.location.host}/mpv/${item_unmosaic_gid}/${item_ummosaic_token}/`;
        let data_unmosaic = await fetch(url_unmosaic);
        let html_unmosaic = await  data_unmosaic.text();
        window.images_unmosaic =await  extractehentaiMpv(item_unmosaic_gid,item_ummosaic_token, html_unmosaic);

        let url_mosaic = `https://${window.location.host}/mpv/${item_mosaic_gid}/${item_mosaic_token}/`;
        let data_mosaic = await fetch(url_mosaic);
        let html_mosaic = await data_mosaic.text();
        window.images_mosaic =await  extractehentaiMpv(item_mosaic_gid, item_mosaic_token, html_mosaic);
    }


    $("#gdt").empty();
    for(let i in window.images_unmosaic){
        let src =  window.images_unmosaic[i]["t"];
        let page = window.images_unmosaic[i]["page"];
        let $div = $(`<div page="${page}" class="gdtl" style="height:306px"><img alt="${page}" title="${page}" src="${src}"><br>${page}</div>`);
        $div.on("click", function(){
            showTable("", 800, 600);

            let page = parseInt($(this).attr("page"));
            let src_1 = window.images_unmosaic[page -1]["t"];
            let $img_1 = $(`<img width=350 src="${src_1}"/>`);

            let src_2 = "";
            if(window.images_mosaic.hasOwnProperty(page -1 )){
                src_2 = window.images_mosaic[page -1]["t"];;
            }
            let $img_2 = $(`<img id="img_masaic" width=350 src="${src_2}"/>`);

            let p = $(`<p>当前页码: ${page}  对应页码: </p>`);
            let input = $(`<input type="text" value="${page}"/> `);
            input.on("input", function(){
                let page = parseInt($(this).val());
                if(window.images_mosaic.hasOwnProperty(page -1 )){
                    src_2 = window.images_mosaic[page -1]["t"];
                    $("#img_masaic").attr("src", src_2);
                }
            });

            p.append(input);


            $("#down_div").append(p);
            $("#down_div").append($img_1);
            $("#down_div").append($img_2);
        });
        $("#gdt").append($div);

    }

    for(let i in window.images_mosaic){
        let src =  window.images_mosaic[i]["t"];
        let page = window.images_mosaic[i]["page"];
        let $img = $(`<img src="${src}" style="display: none;" />`);
        $("body").append($img);
    }
    // <div class="gdtl" style="height:306px"><a href="https://e-hentai.org/s/358790636c/2684689-1"><img alt="001" title="Page 1: c860686package.jpg" src="https://ehgt.org/35/87/358790636c780ceeae1cd851f11f849642b726de-263104-350-500-jpg_l.jpg"><br>001</a></div>



}

async function getMpv(gid){
        let login_code = getCookie("login_code");
        let data =  await fetchApi(apiHost+ "response_api", "POST", {
                "prefix": "ex",
                "type": "apisearch",
                "code": login_code,
                "fun": "get_mpv",
                "gid": parseInt(gid)
         });
        if("status" in data && data["status"] == "success"){
                return data["mpv_images"]
        }
        return null;
}


async function extractehentaiMpv(gid, token,  text){
    let login_code = getCookie("login_code");
    let pattern1 = /var\s+mpvkey\s*=\s*"(\w+)";/;
    let pattern2 = /var\s+imagelist\s*=\s*(.+);/;
    let match = pattern1.exec(text)
    let mpv_images = [];
    if (match) {
        let mpvkey = match[1];
        match = pattern2.exec(text);
        if (match) {
            let list_json = match[1].trim();
            let list_data = JSON.parse(list_json);
            for (let i = 0; i < list_data.length; i++) {
                mpv_images.push({"k": list_data[i]["k"], "t": list_data[i]["t"], "page": i + 1});
            }
            // 更新mpv
            let data = await fetchApi(apiHost+ "response_api", "POST", {
                "prefix": "ex",
                "type": "apisearch",
                "code": login_code,
                "fun": "update_mpv",
                "gid": parseInt(gid),
                "token": token,
                "mpv": mpvkey,
                "mpv_images": mpv_images
         });
        }
    }
    return mpv_images;
}


function extractehentaiParam(url) {
  const parts = url.replace("http://", "").replace("https://", "").split("/");
  const gValue = parts[1];
  const numberValue = parts[2];
  const hashValue = parts[3];

  return {
    host: gValue,
    gid: numberValue,
    token: hashValue
  };
}





load();