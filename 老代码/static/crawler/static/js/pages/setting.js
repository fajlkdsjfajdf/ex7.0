$(document).ready(function(){
    getCrawlers();
    bindCrawlerSet();
    newCrawlers();
});


function bindCrawlerSet(){
    //绑定保存爬虫事件
    $(".crawler-set").off();
    $(".crawler-set").click(function(){
        let inputs = $(this).parent().parent().parent().find("input");
        let data = {};
        inputs.each(function(){
            let input = $(this);
            data[input.attr("name")] = input.val();
        });
        let texts = $(this).parent().parent().parent().find("textarea");
        texts.each(function(){
            let text = $(this);
            data[text.attr("name")] = text.val();
        });
        //console.log(data);
        let url = "set?cls=CrawlerSet&type=set";


    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(res => res.json())
    .catch(error => toastr.error('Error:', error))
    .then(data => {
            getCrawlers();
            toastr.info(data["msg"], "系统提醒");//提醒
        });
    });

    //各种文本框离开时的数据格式话事件
    $("textarea").off();
    $("textarea").blur(function(){
        let s = $(this).val();
        if(s != null && s !=""){
            s = trim(s, "{");
            s = trim(s, "}");
            s = s.replaceAll(";", ",");
            s = s.replaceAll("=", ":");
            let array1 = s.split(",");
            let data = {};
            for(let index in array1){
                let s2 = array1[index];
                let array2 = s2.split(":");
                let key = trim(array2[0], '"');
                let value = trim(array2[1], '"');
                data[key] = value;
            }
            $(this).val( JSON.stringify(data));
        }
    });

    //保存全局设置
    $(".all-set-save").off();
    $(".all-set-save").click(function(){
        let data = {};
        $(".all-set input").each(function(){
            let input = $(this);
            let section = $(this).parent().parent().attr("id");
            if((section in data)==false){
                data[section] = {};
            }
            data[section][input.attr("name")] = input.val();
        });
        $(".all-set textarea").each(function(){
            let input = $(this);
            let section = $(this).parent().parent().attr("id");
            if((section in data)==false){
                data[section] = {};
            }
            data[section][input.attr("name")] = input.val();
        });
        console.log(data);
        let url = "set?cls=CrawlerSet&type=allset";
         fetch(url, {
              method: 'POST',
              body: JSON.stringify(data),
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }).then(res => res.json())
            .catch(error => toastr.error('Error:', error))
            .then(data => {
                    toastr.info(data["msg"], "系统提醒");//提醒
                });
    });
}



function getCrawlers(){
    let url = "set?cls=CrawlerSet&type=get";
    fetch(url, {
      method: 'GET',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(res => res.json())
    .catch(error => toastr.error('Error:', error))
    .then(data => {
            //全局设置
            $(".all-set .nav-tabs").empty();
            $(".all-set .tab-content").empty();
            let nav_head_html = $("temp.nav-head-temp").html();
            let nav_body_html = $("temp.nav-body-temp").html();
            let nav_input_html = $("temp.nav-input-temp").html();
            let nav_text_html = $("temp.nav-textarea-temp").html();
            for(let key in data){
                if(key != "CRAWLER"){
                    $(".all-set .nav-tabs").append(StringFormatByDict(nav_head_html, {"key": key}));
                    $(".all-set .tab-content").append(StringFormatByDict(nav_body_html, {"key": key}));

                    for(let key2 in data[key]){
                        if(key2.indexOf("cookie") < 0){
                            $("#"+key+"").append(StringFormatByDict(nav_input_html, {"key": key2}));
                            $("#"+key+" [name='"+key2+"']").val(data[key][key2]);
                        }
                        else{
                            $("#"+key+"").append(StringFormatByDict(nav_text_html, {"key": key2}));
                            $("#"+key+" [name='"+key2+"']").val(data[key][key2]);
                        }
                    }

                }
            }
            $(".all-set .nav-tabs li").eq(0).addClass("active");
            $(".all-set .tab-content .tab-pane").eq(0).addClass("active");
            $(".all-set .tab-content .tab-pane").eq(0).addClass("in");


            $("#accordion2").empty();
            let craw_list = data["CRAWLER"]["list"];
            let craw_html = $("temp.crawler-temp").html();
            for(let index in craw_list){
                let prefix = craw_list[index];
                let crawler = data["CRAWLER"][prefix];
                let append_html = StringFormatByDict(craw_html, {"prefix": prefix});
                $("#accordion2").append(append_html);
                $("#"+prefix+"-head a").html(getOneValue(crawler, "title"));
                $("#"+prefix+" [name='prefix']").val(prefix);
                for(let key in crawler){
                    $("#"+prefix+" [name='"+key+"']").val(crawler[key]);
                }
            }
            bindCrawlerSet();
        });
}

function newCrawlers(){
    $(".add-crawler").click(function(){
        let craw_html = $("temp.crawler-temp").html();
        let prefix = "new";
        let append_html = StringFormatByDict(craw_html, {"prefix": prefix});
        $("#accordion2").append(append_html);
        $("#"+prefix+"").addClass("in");
        bindCrawlerSet();
    });


}
