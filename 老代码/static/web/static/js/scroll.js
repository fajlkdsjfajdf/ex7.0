window.pre_scroll = 0;
window.changepage = false;


function page_scroll()
{
    if($(".loading").is(":visible")){
        return;
    }


    if(window.page_type == "list" || window.page_type =="bookmark" || window.page_type =="history"){
        let body = $(this);
        let scrollTop = body.scrollTop();                         //目前所在的位置
        let scrollHeight = $(document).height();                    //文章一共有多长
        let windowHeight = body.height();                         //一页一共有多长
        if (scrollHeight - (scrollTop + windowHeight) <= 1000) {      //20的意思是预留长度，总不能翻页到最底下才加载把~

            searchData();
        }
        let scroll_page= 1;
        $('#' + window.page_type + ' .cards').each(function() {

            if($(this).attr('page')!=null){
                if($(window).scrollTop()>=$(this).offset().top){
                    scroll_page = $(this).attr('page')
                }
            }
        });
        if(window.scroll_page != scroll_page){
            window.scroll_page = scroll_page;
            let page_count = window.page_count;
            if(window.page_type == "bookmark")
                page_count = window.page_count_bookmark;
            if(window.page_type == "history")
                page_count = window.page_count_history;

            printInfo("第"+scroll_page+"页<br>" + "共"+ (page_count) +"页" );
        }
    }
    else if(window.page_type == "page"){
        let page_num = 1;
        let body = $(window);
        let scrollTop = body.scrollTop();                         //目前所在的位置
        if(scrollTop >= window.pre_scroll){
            //向下滑动
             $(".phpage-bottom-menu").hide();
             $("#top").hide();
        }
        else{
        }
        window.pre_scroll = scrollTop;

        let page_containers = $("#page .imgs img[class='lazy'], #page .page_div");


        page_containers.each(function(){

            let img = $(this);
            let img_top = img.offset().top;
            //console.log(img_top);
            if(img_top==0 && img.next().prop("nodeName") =="CANVAS"){
                img_top = img.next().offset().top;
            }

            if(img_top < scrollTop + 8000 && img.attr("load") != 1 && img_top > scrollTop -800){
                img.attr("src", img.attr("data-original"));
                img.attr("load", 1);
            }

            if(img_top <= scrollTop && (img.attr("class")=="lazy" || img.attr("class")=="page_div")){
                page_num = parseInt(img.attr("page"));
            }
        });
        $(".page-num").html(stringFormatByDict("{page}/{pagecount}", {"page": page_num, "pagecount": page_containers.length}));


        changeSlider(page_num);
        window.page_num = page_num;
        //滑动到底部尝试换页

        let countdownTime =1;
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight -100 && window.changepage == false)  {
            window.changepage = true;
            let count = getDefaultFromDict(window.info_data, "lists", []).length;
            if(window.page_index < count-1 )
            {

                let msg_box = toastr.info("即将前往下一章");

                setTimeout(function(){
                console.log("换页");
                toVolumn("+1");
                }, (countdownTime + 1)*1000);
            }



            setTimeout(function(){
              //console.log("等待5s重新激活换页");
              window.changepage = false;
            }, (countdownTime + 3)*1000);

        }
    }

}
$(function(){
    $(window).scroll(page_scroll);

});