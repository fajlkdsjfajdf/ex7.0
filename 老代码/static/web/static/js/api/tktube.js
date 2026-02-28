// // ********************* tktube 的脚本*****************************

function load(){
    setCss();
    createFloatingButton();
}

async function getVideoSrc(url){
    try {
        const response = await fetch(url, {
            method: 'GET'
        });

        if (response.status == 200) {
            // 检查是否有Location头部信息
            console.log(response.url);
            return response.url;
        } else {
            console.log('Response status:', response.status);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
    return "";
}

async function downVideo(url){
    let path = "下载中/tktube/" + getCurrentDateString();
    let file = $(".content .headline h1").html() + ".mp4";
    downFile(url, path, file);
}

let interval = setInterval(function(){
    if($("video").length>0){
        let src = $("video").attr("src");
        if(src.indexOf("get_file")>=0){
            let button = $("<button>下载视频</button>");
            button.on("click",async function(){
                let url = await getVideoSrc(src);
                if(url){
                    downVideo(url);
                    //copyTextToClipboard(url);
                }
                else{
                    showMsgTip("未找到对应url");
                }
            });
            $(".tabs-menu").append(button);


            let button2 = $("<button>复制连接</button>");
            button2.on("click",async function(){
                let url = await getVideoSrc(src);
                if(url){
                    copyTextToClipboard(url);
                }
                else{
                    showMsgTip("未找到对应url");
                }
            });
            $(".tabs-menu").append(button2);
            clearInterval(interval);
        }
    }

    $("iframe").hide();

}, 500);

load();


