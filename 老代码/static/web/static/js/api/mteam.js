// ********************* mteam 的脚本*****************************

const passkey = "d6e0983d9a2c3e8b499fc458075cda29";
var first_a_href = "";
function load() {
	reload();
	
    let url = window.location.href;
    if(url.indexOf("torrents")>=0 || url.indexOf("adult")>=0 || url.indexOf("browse")>=0 ){
        console.log("mteam 脚本已载入");
        setCss();
        resizeImg();
        setImgError();
        loadButton();
        createFloatingButton();
    }
    if(url.indexOf("adult")>=0){
        loadInfo();
    }


}

function reload(){
	$('a[href*="/detail/"]').attr("check", 0);
	$('.fanahao').remove();
	$('.tags').remove();
	$('.file_info').remove();
    $('.copybutton').remove();
}



function resizeImg(){
    $("colgroup").find("col").eq(1).attr("style", "");
    $("thead").find("th").eq(1).attr("style", "width:600px;");
    $(".ant-image-img").attr("style", "width:auto;height:auto;max-width:100%;");
    // $("img[alt*='torrent']").css('width','auto');
    // $("img[alt*='torrent']").css('height','auto');
    // $("img[alt*='torrent']").css('max-width','600px');
}

function setImgError(){
    $('img').error(function () {   //加载图片 出现404状态时触发
        //$(this).attr("src", "Image/default.jpg");  //将加载不到的图片 的src属性 修改成默认 图片 ，注意：默认图片必须保证存在，否则 会一直 调用 此函数
        let img = $(this);
        let tr = img.parents(".torrenttr").parent();
        //tr.css('display','none');
    });
}

function loadButton(){


    let button_html = `<button type="button" class="ant-btn css-i8jq0z ant-btn-circle ant-btn-primary ant-btn-sm ant-btn-icon-only ant-btn-background-ghost mr-2"><span class="ant-btn-icon"><span role="img" aria-label="download" class="anticon anticon-download"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/klEQVR4nO3XUQrCQAwE0FxipXhRfz1jEYunGb+EUlLb3U6ypczA4l/JM9NFzbgB6UxmNpBn6wJBb8xvCMYz0BPDhIyzz0Kar3oIxjPKDJO+GSbEemIeZEhXzDNgq2XPO8O6Lt+kbwsrW93EMO/+j5ndgyCbNWPf/Ucx2JhnFcOETISXEjvmcWvGhAwEDBrOGHH338zsdaBmaDx0CANTk1BIJgbRkCwMMiAZGGRBojHIhERiEAGp/W12CQjOCKmNIE60EUZULSeqFiOqlhNVixFVy4mqxYiq5UTVYkTVcqJqRVSr9a8yzraRy0AogSDt0Ub+RdU6a7XQ4Qhii3wBuJ0AhigWdm0AAAAASUVORK5CYII=" style="width: 1em;height: 1em;"></span></span></button>`;
	const auth = localStorage.getItem("auth");
	headers = {
        "Authorization": auth,
        "Accept": "application/json, text/plain, */*",
        "version": "1.1.0",
        "visitorid": "78e62cfa909310ebe065db67e8b9f098",
        "ts": getCurrentSecondstamp(),
        "webversion": 0
    }
    $(".ant-spin-container table tr").each(function(){
        let tr = $(this);
		let key = getDetailId(tr);
        
        let button = tr.find("td").eq(2).find("button").eq(0);
        let copy_button = $(button_html);
        copy_button.on("click",async function(){
            let url = 'https://api.m-team.cc/api/torrent/genDlToken';
			
            let post_data = {"id": key};
            let data = await fetchApi(url, "POST", post_data, true, headers);
            if(data){
                copyTextToClipboard(data["data"]);
            }
        });
		copy_button.attr("id", key);
        copy_button.addClass("copybutton");
        button.before(copy_button);
        console.log(button.attr('type'));
    });
}

function getDetailId(trElement) {
  const aTag = trElement.find('a[href*="detail"]');
  if (aTag.length > 0) {
    const href = aTag.attr('href');
    const id = href.split('/').pop();
    if (!isNaN(id)) {
      return parseInt(id, 10);
    }
  }
  return null;
}

async function loadInfo(){
    //尝试通过番号获取信息

    let fanhao_list = [];
    $(".av-info-div").remove();

    let button_html = `<button type="button" class="ant-btn css-i8jq0z ant-btn-circle ant-btn-primary ant-btn-sm ant-btn-icon-only ant-btn-background-ghost mr-2"><span class="ant-btn-icon"><span role="img" aria-label="download" class="anticon anticon-download"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/klEQVR4nO3XUQrCQAwE0FxipXhRfz1jEYunGb+EUlLb3U6ypczA4l/JM9NFzbgB6UxmNpBn6wJBb8xvCMYz0BPDhIyzz0Kar3oIxjPKDJO+GSbEemIeZEhXzDNgq2XPO8O6Lt+kbwsrW93EMO/+j5ndgyCbNWPf/Ucx2JhnFcOETISXEjvmcWvGhAwEDBrOGHH338zsdaBmaDx0CANTk1BIJgbRkCwMMiAZGGRBojHIhERiEAGp/W12CQjOCKmNIE60EUZULSeqFiOqlhNVixFVy4mqxYiq5UTVYkTVcqJqRVSr9a8yzraRy0AogSDt0Ub+RdU6a7XQ4Qhii3wBuJ0AhigWdm0AAAAASUVORK5CYII=" style="width: 1em;height: 1em;"></span></span></button>`;
	const auth = localStorage.getItem("auth");
	const headers = {Authorization: auth}

    $('a[href*="/detail/"]').each(function() {
        let a = $(this);
        if(a && a.attr("check")!= "1"){
            a.attr("check", 1);
            let fanhao = getFanhao(a.text());
            if(fanhao){
                a.attr("fanhao", fanhao);
                if(fanhao in fanhao_list == false){
                    fanhao_list.push(fanhao);
                }

                let key = getDetailId(a.parent());

                let copy_button = $(button_html);
                copy_button.on("click",async function(){
                    let url = 'https://api.m-team.io/api/torrent/genDlToken';

                    let post_data = {"id": key};
                    let data = await fetchApi(url, "POST", post_data, true, headers);
                    if(data){
                        copyTextToClipboard(data["data"]);
                    }
                });
                copy_button.attr("id", key);
                copy_button.addClass("copybutton");


                let div = $("<div class='av-info-div'></div>");
                let p = $("<p class='fanhao' style='color: red; font-size:16px;font-weight: bold'>"+ fanhao +"</p>");
                p.append(copy_button);
                div.append(p);

                div.append("<div class='tags'></div>");
                div.append("<div class='file_info'></div>");




                a.parent().append(div);



            }

        }
    });
    console.log(fanhao_list);
    window.fanhao_list = fanhao_list;
    setInfo();

}

async function setInfo(){
    let data = await getAvInfo(fanhao_list);
    if(data){
        window.av_data = data;
        for(let i=0;i<data.length;i++){
            let info = data[i];
            let fanhao = info["fanhao"];
            window.fanhao_list = removeItem(window.fanhao_list, fanhao);
            //let pic_l = info["pic_l"];
            let pic_l = getAvThumb(info);
            let tags = info["tags"];
            let stars = info["stars"];
            let pics = info["PicList"];
            let files = info["av_file"];
            let a = $("a[fanhao='"+fanhao+"']");
            let img = a.parents("tr").first().find("img").eq(1);
            img.attr("src", pic_l);
            img.off();
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
            // img.on("click", function(){
            //     showCovers(pics);
            // });
            let button_html=`<button class="ant-btn css-1gwm2nm ant-btn-circle ant-btn-primary ant-btn-sm ant-btn-icon-only ant-btn-background-ghost mr-2"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50" style="width: 1em;height: 1em;"><path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path></svg></button>`;
            let button = $(button_html);
            button.on("click", function(){
                showCovers(pics);
            });
            a.parent().find("p").eq(0).append(button);
        }
    }
    if(window.forced_retrieval && window.fanhao_list.length > 0){
        setTimeout(setInfo, 10000);
    }
}


function interval_job(){
    //定期观察列表中的第一个a标签的herf的值来判断列表是否改变
    let a = $('td a[href*="/detail/"]').eq(0);
    let href = a.attr("href");
    if(first_a_href != href){
        first_a_href = href;
        load();
    }
}
setInterval(interval_job, 1000);

// 创建一个观察器实例
// const observer = new MutationObserver(function(mutations) {
//   mutations.forEach(function(mutation) {
//     if (mutation.type === 'childList') {
//         mutation.addedNodes.forEach(function(node) {
//             // console.log(node.nodeName);
// 			const nodes = ["SPAN", "DIV"]
//             if(nodes.includes(node.nodeName) && window.tabel_load == false){
//                 window.tabel_load = true;
//                 load();
//                 setTimeout(function() {
//                   window.tabel_load = false;
//                 }, 5000);
//
//             }
//       });
//     }
//   });
// });
//
// window.tabel_load = false;
// // 配置观察选项
// const config = { childList: true, subtree: true };
//
// // 传入目标节点和观察选项
// observer.observe(document.body, config);

//load();
