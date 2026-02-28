function load(){
    setCss();
    // createFloatingButton();
    $("#app main").css("width", "100%");
    $(".moe-table-of-contents").css("max-height", "80vh");

    add_link();
}

function add_link(){
    $("dl").each(function(){
        let dd1 = $(this).find("dd").eq(0);
        let title = dd1.find("a").eq(0).html();
        if(title){
            title = title.replace("/", " ");
            let link_arr = [
                {"title": "番组计划", "link": `https://bangumi.tv/subject_search/${title}?cat=2`},
                {"title": "樱花动漫", "link": `https://yinghuadongman.me/s/${title}.html`},
                {"title": "mteam(外链)", "link": `https://kp.m-team.cc/browse?keyword=${title}`, "type": "open"},
                {"title": "番组计划(外链)", "link": `https://bangumi.tv/subject_search/${title}?cat=2`, "type": "open"},
                {"title": "樱花动漫(外链)", "link": `https://yinghuadongman.me/s/${title}.html`, "type": "open"},
            ];
            let new_dd = $("<dd>相关链接：</dd>");
            for(let i in link_arr){
                let link = link_arr[i];
                let link_button = $(`<button class="link-button">${link["title"]}</button>`);
                link_button.on("click", function(){
                    if("type" in link && link["type"]=="open"){
                        window.open(link["link"]);
                    }
                    else{
                        showIframe(link["link"], 1600, 800);
                    }
                });
                new_dd.append(link_button);
            }
            dd1.after(new_dd);
        }

        //console.log(dd1.html());
    });


}


setInterval(function(){
    //去广告

    $("iframe").each(function(){
        if($(this).attr("id") != "link_iframe"){
            $(this).hide();
        }
    });

    $("#mwe-popups-svg").next().hide();
    $(".stevrhgmNo_cfms0k").hide();
    $("a").each(function(){
        if($(this).html().trim() == "推广" || $(this).html().trim() == "加载中"){
            $(this).parent().addClass("hidden-important");
        }
    });
    $(".fc-ab-root").addClass("hidden-important");
    //console.log($("#mwe-popups-svg").next().html());
}, 100);


load();



