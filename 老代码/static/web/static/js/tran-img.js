// page页中,获取最上面的一张图, 并尝试转换

//setInterval(tranTopImg, 2000);
// setInterval(decodeTopImg, 5000);
async function tranTopImg(){
    if(window.page_type == "page" && window.auto_translator == true){
        let tran_imgs = [];
        $("#page .imgs img").each(function(){
            let img = $(this);
            if(img.attr("load") == "1" && img.attr("tran") !="2"){
                tran_imgs.push(img);
            }
        });
        if(tran_imgs.length >0){
            for(let i=0;i<tran_imgs.length;i++){
                let tran_img = tran_imgs[i];
                if(tran_img.attr("tid") == null){
                    // 开始转换.
                    let data = await fetchApi("response", "GET", {
                        "prefix": window.prefix,
                        "type": "imagetran",
                        "id": tran_img.attr("id"),
                        "page": tran_img.attr("page"),
                        "check": 1
                    });
                    if("status" in data && data["status"] == "wait"){
                        tran_img.attr("tran", 1);
                        if("id" in data){
                            tran_img.attr("tid", data["id"]);
                        }
                    }
                    else if ("status" in data && data["status"] == "success"){
                        tran_img.attr("tran", 2);
                        tran_img.attr("src", buildUrlParamByDict("response", {
                            "prefix": window.prefix,
                            "type": "imagetran",
                            "id": tran_img.attr("id"),
                            "page": tran_img.attr("page")
                        }));

                    }
                }
                else if (tran_img.attr("tid") != null && tran_img != "2") {
                    // 获取转换状态
                      let data = await fetchApi("response", "GET", {
                        "prefix": window.prefix,
                        "type": "imagetran",
                        "id": tran_img.attr("id"),
                        "page": tran_img.attr("page"),
                        "tid":tran_img.attr("tid"),
                        "check": 2
                    });
                    if("status" in data && data["status"] == "success"){
                        tran_img.attr("tran", 2);
                        tran_img.attr("src", buildUrlParamByDict("response", {
                            "prefix": window.prefix,
                            "type": "imagetran",
                            "id": tran_img.attr("id"),
                            "page": tran_img.attr("page")
                        }));
                    }

                }
            }

        }
    }
}


async function decodeTopImg(){
  if(window.page_type == "page" && window.auto_decode == true) {
      let tran_imgs = [];
      $("#page .imgs img").each(function () {
          let img = $(this);
          if (img.attr("load") == "1" && img.attr("decode") != "2") {
              tran_imgs.push(img);
          }
      });

      if(tran_imgs.length >0){
          let id =  tran_imgs[0].attr("id");
          let page = tran_imgs[0].attr("page");
          let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "imagedecode", "id": id, "page": page, "m": window.auto_decode_code});
          tran_imgs[0].attr("src", src);
          tran_imgs[0].attr("decode", "2");
      }
  }


}