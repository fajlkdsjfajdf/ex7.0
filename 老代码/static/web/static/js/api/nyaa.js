function load(){
    setCss();
    createFloatingButton();
    clearNews();
    loadButton();
    loadInfo();

}

function loadButton(){
    $("td[class='text-center']").each(function(){
        let td = $(this);
        let aa = $(this).find("a").eq(1);
        if(aa.length>0){
            //console.log(aa.attr("href"));
            let a = $('<a  style="cursor:pointer;"><i class="fa fa-fw fa-copy"></i></a>');
            a.attr("down", aa.attr("href"));
            a.on("click", function(){
                let href = $(this).attr("down");
                copyTextToClipboard(href);
                // let href = $(this).attr("down");
                // let textarea = $('');
                // showTable("url", 1500, 200);
                // let input_name = $('<textarea  id="path_txt" style="width:1400px;margin-left: 45px; margin-top: 30px;height:150px;"></textarea>');
                // $("#down_div").append(input_name);
                // $("#path_txt").val($("#path_txt").val() + href + "\r\n") ;
                //
            });
            td.append(a);
        }

    });
}

function clearNews(){
    $("div[class='container']").children().each(function(){
        if($(this).attr("id")!=null){
            $(this).css("display", "none");
        }
    });

    //修改表格格式
    $(".torrent-list tr").each(function(){
        let tr = $(this);
        let img = tr.find("img").first();
        img.css({"width": "500px", "height": "auto"});
        let td2 = tr.find("td[colspan='2']").first();
        td2.css({"max-width": "400px"});
        let a = td2.find("a").first();
        a.css({"white-space": "normal"});
    });
}

async function loadInfo(){
    let fanhao_list = [];
    $("td[colspan='2'] a").each(function(){
        let str = $(this).html();
        let fanhao = getFanhao(str);
        if(fanhao){
            if(fanhao in fanhao_list == false){
                fanhao_list.push(fanhao);
            }
            let str = $(this).html();
            $(this).attr("fanhao", fanhao);
            $(this).parent().prepend("<p style='color: red; font-size:16px;font-weight: bold'>"+ fanhao +"</p>");
            //$(this).html("<span style='color:red;font-size:16px;font-weight: bold;margin-right: 10px;'>" + fanhao + "</span>" + str);

            $(this).parent().append("<div class='tags'></div>");
            $(this).parent().append("<div class='file_info'></div>");
        }
    });
    console.log(fanhao_list);
    window.fanhao_list = fanhao_list;
    setInfo();

}

async function setInfo(){
    let fanhao_list = window.fanhao_list;
    let data = await getAvInfo(fanhao_list);
    if(data){
        window.av_data = data;
        for(let i=0;i<data.length;i++){
            let info = data[i];
            let fanhao = info["fanhao"];
            window.fanhao_list = removeItem(window.fanhao_list, fanhao);
            let pic_l = getAvThumb(info);

            let tags = info["tags"];
            let stars = info["stars"];
            let pics = info["PicList"];
            let files = info["av_file"];
             $("a[fanhao='"+fanhao+"']").each(function(){
                let a = $(this);
                let img = a.parents("tr").first().find("img").first();
                img.attr("src", pic_l);
                let tags_idv = a.parent().find("div[class='tags']");
                for(let i in stars){
                    let star = stars[i];
                    tags_idv.append(buildTag(star, "aqua"));
                }
                for(let i in tags){
                    let tag = tags[i];
                    tags_idv.append(buildTag(tag));
                }
                if(files){
                    let file_div= a.parent().find("div[class='file_info']");

                    file_div.append(buildFileInfo(files));
                }

                img.parent().attr("href", "javascript:void(0);");
                img.on("click", function(){
                    showCovers(pics);
                });

                a.parent().parent().attr("has_info", 1);


            });


        }
        if(getShowMode() == 2){
            $(".table-responsive tbody tr").each(function(){
                if($(this).attr("has_info") == null){
                    $(this).hide();
                }
            });
        }
        else if(getShowMode() == 3){
            $(".table-responsive tbody tr").each(function(){
                if($(this).attr("has_info") == null){
                    $(this).hide();
                }
                else if($(this).find(".love").length == 0){
                    $(this).hide();
                }
            });
        }

    }

    console.log(window.fanhao_list);
    if(window.forced_retrieval && window.fanhao_list.length > 0){
        setTimeout(setInfo, 10000);
    }
}

setInterval(function(){
    //去广告
    $("video").parent().parent().hide();
}, 500);


load();



