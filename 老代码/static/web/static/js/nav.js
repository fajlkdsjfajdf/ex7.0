//***********************切换网站显示内容

function toInfo(flag=1){
    setscroll();
    divHide("info");
    windowScroll(flag);
}


function toList(flag=1){
    setscroll();
    divHide("list");
    windowScroll(flag);

    if($("#"+window.page_type+" .list-columns .cards").length== 0){
        $(".loading").show();
        searchData();
    }
    closeGifPlayer();

}

function toPage(flag=1) {
    setscroll();
    divHide("page");
    windowScroll(flag);
    closeGifPlayer();
}

function toSetting(flag=1) {
    setscroll();
    divHide("setting");
    windowScroll(flag);
}

function toHistory(flag=1){
    setscroll();
    divHide("history");
    windowScroll(flag);
    closeGifPlayer();

    if($("#"+window.page_type+" .list-columns .cards").length== 0){
        $(".loading").show();
        searchData();
    }
}

function toMark(flag=1){
    setscroll();
    divHide("bookmark");
    windowScroll(flag);
    if($("#"+window.page_type+" .list-columns .cards").length == 0){
        $(".loading").show();
        searchData();
    }
}


function setscroll(){
    $("#"+ window.page_type +"").attr("scroll", $(window).scrollTop());
}


function divHide(page_type){
    $("#list,#info,#page,#history,#bookmark").each(function(){
        let div = $(this);
        div.hide();
    });
    window.page_type = page_type;
    $("#"+ window.page_type).show();
    if(window.page_type == "page" || window.page_type == "info"){
        $(".menu-bolock").show();
    }
    else{
        $(".menu-bolock").hide();
    }

    if(window.page_type == "page"){
        $(".page-change").show();
    }
    else{
        $(".page-change").hide();
        $("#top").show();
    }
    setNavActive(page_type);


}

function windowScroll(flag){
    if(flag == 1){
        $(window).scrollTop($("#"+ window.page_type +"").attr("scroll"));
    }
    else{
        $(window).scrollTop(0);
    }
}

function setNavActive(nav){
    let search_class = "fa-home";
    $(".chat-icon").hide();
    switch (nav) {
        case "list":
            search_class = "fa-home";
            break;
        case "history":
            search_class = "fa-history";
            break;
        case "bookmark":
            search_class = "fa-bookmark";
            break;
        case "info":
            search_class = "fa-info";
            break;
        case "page":
            search_class = "fa-image";
            $(".chat-icon").show();
            break;
    }
    $("."+search_class+"").parent().parent().parent().children().removeClass("active");
    $("."+search_class+"").parent().parent().addClass("active");
    $(".phpage-bottom-menu").show();
}


function goBack(){
    switch (window.page_type) {
        case "list":
            toastr.warning("已经是首页");
            break;
        case "history":
            toList();
            break;
        case "bookmark":
            toList();
            break;
        case "info":
            toList();
            break;
        case "page":
            toInfo();
            break;


    }
    return "true";
}
