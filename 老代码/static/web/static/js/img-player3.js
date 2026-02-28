function startGifPlayer(rotate=false){
    if(document.querySelector("#videoContainer"))
        return
    let id = window.img_page_id;

    window.rotate = rotate;

    let imgs = [];
    $("#page .imgs img").each(function(){
        let img = $(this);
        if(img.attr("data-original")){
            imgs.push(img.attr("data-original"));
        }
        else{
            imgs.push(img.attr("src"));
        }
    });

    if(imgs)
        createGifPlayer(imgs, window.page_num);
}


function createGifPlayer(imgs, index=1) {
    let videoContainer = document.createElement('div');
    videoContainer.id = 'videoContainer';


    let div1 = document.createElement('div');
    div1.id = 'gifPlayer-div1'

    let div2 = document.createElement('div');
    div2.id = 'gifPlayer-div2'


    window.gif_imgs = imgs;
    window.gif_index = index - 1;


    let canvas = document.createElement('canvas');
    canvas.id = "gifcanvas";


    let toolsDiv = document.createElement('span');
    toolsDiv.className = "tools";


    let closeButton = document.createElement('span');
    closeButton.innerHTML = '<i class="fa fa-window-close"></i>';
    closeButton.addEventListener('click', function() {
        closeGifPlayer();
    });

    // let horizontalButton = document.createElement('span');
    // horizontalButton.innerHTML = '<i class="fa fa-arrows-alt"></i>';
    // horizontalButton.addEventListener('click', function() {
    //     let gif_imgs = [$("#gifPlayer"), $("#gifPlayerNext")];
    //
    //     if(this.className == "active"){
    //         this.className = "";
    //         gif_imgs[0].removeClass("rotate-img");
    //         gif_imgs[1].removeClass("rotate-img");
    //     }
    //     else{
    //         this.className = "active";
    //         gif_imgs[0].addClass("rotate-img");
    //         gif_imgs[1].addClass("rotate-img");
    //
    //     }
    //     //img.src = '/static/images/wait.gif';
    //
    //
    //
    //     gifImgResize();
    //
    // });


    let downOnePageBUtton = document.createElement('span');
    downOnePageBUtton.innerHTML = '<i class="fa fa-arrow-down"></i>';
    downOnePageBUtton.addEventListener('click', function() {
        gifImgLoad("wheel_down", false);
    });


    let bardecodeButton = document.createElement('span');
    bardecodeButton.innerHTML = '<i class="fa fa-barcode"></i>';
    bardecodeButton.addEventListener('click', function() {
        if(this.className == "active"){
            this.className = "";
            window.auto_decode = false;
        }
        else{
            this.className = "active";
            window.auto_decode = true;
            window.auto_decode_code = 0;
        }
        gifDecodeCheck();
    });

    let mosaicdeButton = document.createElement('span');
    mosaicdeButton.innerHTML = '<i class="fa fa-image"></i>';
    mosaicdeButton.addEventListener('click', function() {
        if(this.className == "active"){
            this.className = "";
            window.auto_decode = false;
        }
        else{
            this.className = "active";
            window.auto_decode = true;
            window.auto_decode_code = 1;
        }
        gifDecodeCheck();
    });

    let mosaicmrccButton = document.createElement('span');
    mosaicmrccButton.innerHTML = '<i class="fa fa-image"></i>';
    mosaicmrccButton.addEventListener('click', function() {
        if(this.className == "active"){
            this.className = "";
            window.auto_decode = false;
        }
        else{
            this.className = "active";
            window.auto_decode = true;
            window.auto_decode_code = 2;
        }
        gifDecodeCheck();
    });

    let fullwinButton = document.createElement('span');
    fullwinButton.className = "page-big";
    fullwinButton.innerHTML = '<i class="fa fa-arrows-alt"></i>';
    fullwinButton.addEventListener('click', function() {
        pageBig();

    });




    let imgdiv = document.createElement('div');
    imgdiv.className = "div-horizontal";
    imgdiv.id = 'gifPlayerDiv';
    // imgdiv.append(img2);
    // imgdiv.append(img);

    imgdiv.append(div1);
    imgdiv.append(div2);

    let pagenum = document.createElement('span');
    pagenum.innerHTML = `${index}/${imgs.length}`;
    pagenum.className= "page-num";


    toolsDiv.append(closeButton);
    toolsDiv.append(downOnePageBUtton);
    toolsDiv.append(fullwinButton);
    //toolsDiv.append(bardecodeButton);
    //toolsDiv.append(mosaicdeButton);
    // toolsDiv.append(mosaicmrccButton);
    toolsDiv.append(pagenum);
    //toolsDiv.append(horizontalButton);


    videoContainer.appendChild(imgdiv);
    //videoContainer.appendChild(canvas);
    videoContainer.appendChild(toolsDiv);

    // 添加视频容器到页面的 body 元素中
    document.body.appendChild(videoContainer);

    setGifImgSrc();

    window.gif_player = true;

    // 拦截鼠标和触摸事件
    window.addEventListener('wheel', handleEvent, {passive:false});
    window.addEventListener('touchstart', handleEvent, {passive:false});
    window.addEventListener('touchmove', handleEvent, {passive:false});
    window.addEventListener('touchend', handleEvent, {passive:false});
    window.addEventListener('keydown', handleEvent, {passive:false});
    window.addEventListener('resize', gifImgResize);
}
let time_skip = 200;       // 图片显示所需的时间



function setGifImgSrc(go_next=true){

    $("#gifPlayer-div1").hide();
    $('#gifPlayer-div1').fadeIn(time_skip);
    $("#gifPlayer-div1").empty();
    let img1 = $("<img id='gifPlayer'></img>");
    img1.on("load", function(){
        gifImgResize();
    });
    if(window.gif_imgs.length <= window.gif_index){
        gifEnd();
    }
    img1.attr("src", window.gif_imgs[window.gif_index]);
    img1.attr("data-original", window.gif_imgs[window.gif_index]);
    $("#gifPlayer-div1").append(img1);


    let next_index = window.gif_index + 1;
    if(window.gif_imgs.length >next_index)
    {
        // $("#gifPlayer-div1").empty();
        let img2 = $("<img id='gifPlayerNext'></img>");
        img2.on("load", function(){
            gifImgResize();
        });
        img2.attr("src", window.gif_imgs[next_index]);
        img2.attr("data-original", window.gif_imgs[next_index]);
        $("#gifPlayer-div1").prepend(img2);
    }
    else{
        let img2 = $("<img id='gifPlayerNext'></img>");
        $("#gifPlayer-div1").prepend(img2);
    }
    $("#gifPlayer-div1 img").on("dblclick", function(){
        reload_img($(this));
    });




    if(go_next){
        goPageNum(window.gif_index + 1);
    }
}

function gifDecodeCheck(){
    return ;
    let gif_imgs = [$("#gifPlayer"), $("#gifPlayerNext")];
    gif_imgs.forEach(function(img){
        let src = img.attr("src");
        if(src.indexOf("response")> -1){
            console.log(`图片${src}加载成功`);
            if(window.auto_decode & src.indexOf("imagedecode")==-1){
                let decode_src = src.replace("type=image", "type=imagedecode") + "&m=" + window.auto_decode_code;
                img.attr("src", decode_src);
                img.attr("class", "image-activate");
            }
            if(window.auto_decode == false & src.indexOf("imagedecode")>-1){
                img.attr("src", img.attr('data-original'));
                img.attr("class", "");
            }
        }
    });


}


function gifImgResize(){
    let img = $("#gifPlayer");
    let img2 = $("#gifPlayerNext");
    //img.hide();
    let canvas_rotate = false;  // 画布是否转向画
    let double_show = false; //是否双页面显示
    // img重新改写大小
    let pic_width = img.get(0).naturalWidth;
    let pic_height = img.get(0).naturalHeight;
    let pic2_width = img2.get(0).naturalWidth;
    let pic2_height = img2.get(0).naturalHeight;

    let div_width = $("#videoContainer").width() * 0.98;
    let div_height =  $("#videoContainer").height() * 0.98;





    // 计算img元素的最终宽度和高度
    let img_width, img_height;
    if(pic_width < div_width && pic_height < div_height){
        // 能完全容纳 撑满宽
        img_width = div_width;
        img_height = pic_height * (div_width / pic_width);
        if(img_height > div_height){
            //撑满高不够了，撑满高
            img_height = div_height;
            img_width = pic_width * (div_height / pic_height);
        }

    }
    else if(pic_width >= div_width && pic_height < div_height){
        // 宽不够, 高够
        img_width = div_width;
        img_height = pic_height * (div_width / pic_width);
    }
    else if(pic_width < div_width && pic_height >= div_height){
        // 宽够， 高不够
        img_height = div_height;
        img_width = pic_width * (div_height / pic_height);
    }
    else{
        // 首先已宽作为基准, 看高能否放下
        img_width = div_width;
        img_height = pic_height * (div_width / pic_width);
        if(img_height <= div_height){
            // 宽为基准, 高度等比例

        }
        else{
            // 高度为基准， 宽度等比例
            img_height = div_height;
            img_width = pic_width * (div_height / pic_height);
            console.log("高度超支")
        }
    }
    //判断双份的img是否能融入到div中
    if(img_height > img_width && pic2_height> pic2_width && div_height < div_width){
        //只有纵向显示的img和横向屏幕有dobule的效果
        if(img_width * 2 <= div_width){
            double_show = true;
        }
    }



    //gifImgDraw(img.attr('src'), img_width, img_height, canvas_rotate);
    setgifImg(img_width, img_height, canvas_rotate, double_show);

}

function setgifImg(img_width, img_height, canvas_rotate = false, double_show = false){
    let img = $("#gifPlayer");
    let div = $("#gifPlayerDiv");
    let img2 = $("#gifPlayerNext");
    let r = "20px";



    img.css("width", img_width);
    img.css("height", img_height);
    img.attr("width", img_width);
    img.attr("height", img_height);
    img.css("border-radius", r);



    window.gif_double_show = double_show;
    if(double_show){
        img2.css("width", img_width);
        img2.css("height", img_height);
        img2.attr("width", img_width);
        img2.attr("height", img_height);
        img2.css("display", "inline-block");
        img.css("border-radius", `0px ${r} ${r} 0px`);
        img2.css("border-radius", `${r} 0px 0px ${r}`);
    }
    else{
        img2.css("width", img_width);
        img2.css("height", img_height);
        img2.attr("width", img_width);
        img2.attr("height", img_height);
        //img2.css("display", "inline-block");
        img2.css("display", "none");
    }


}


function gifImgDraw(src, img_width, img_height, canvas_rotate = false){
    var img = new Image()
    //img.setAttribute("crossOrigin", 'Anonymous');//解决跨域问题
    img.onload = function () {
        var canvas = document.getElementById("gifcanvas");

        // 获取设备像素比
        let dpr = window.devicePixelRatio;
        // dpr = 2;
        canvas.width = img_width * dpr;
        canvas.height = img_height * dpr;
        canvas.style.width = img_width + "px";
        canvas.style.height = img_height  + "px";
        if(canvas_rotate){
            canvas.width = img_height  * dpr;
            canvas.height = img_width  * dpr;
            canvas.style.width = img_height + "px";
            canvas.style.height = img_width  + "px";
        }
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);//清空画布，重新画
        ctx.scale(dpr, dpr)
        var imgwidth = img.naturalWidth;
        var imgheight = img.naturalHeight;
        // 旋转画布90度
        if(canvas_rotate){
            ctx.rotate(90* Math.PI / 180);
            ctx.translate(0, -img_height);
        }

        ctx.drawImage(img, 0, 0, imgwidth, imgheight, 0, 0, img_width, img_height);

    }
    img.src = src;

}

function gifShowFrom(){
    let div = $("<div class='forum-div' id='gif-forum-div'></div>");


}

function gifEnd(){
    //toastr.warning("已经是最后一页");
    let forum_div = $("#forum-div");
    $(window).scrollTop(forum_div.offset().top - 100);
    closeGifPlayer();
}


function gifImgLoad(show_type, with_double=true) {
    if(document.getElementById('videoContainer')){
        let img = $("#gifPlayer");
        if(img.hasClass("rotate-img")){
            // 横屏状态, 需要把 touch_left 和 touch_right 互换
            if(show_type == 'touch_left') show_type ="touch_right";
            else if(show_type == 'touch_right') show_type ="touch_left";
        }


        if (window.gif_flag != true) {
            window.gif_flag = true;
            if (["wheel_down", "touch_left", "touch_up", "yg_right", "yg_down"].includes(show_type)) {
                // 载入下一张图片
                if(window.gif_index < window.gif_imgs.length - 1){
                    window.gif_index += 1;
                    if(window.gif_double_show && with_double && window.gif_imgs.length> window.gif_index - 1){
                        window.gif_index += 1;
                    }
                    setGifImgSrc();
                }
                else{
                    gifEnd();
                }



            }
            else if(["wheel_up", "touch_right", "touch_down", "yg_left", "yg_up"].includes(show_type)){
                window.show_forum = false;
                // 载入上一张图片
                if(window.gif_index > 0){
                    window.gif_index -= 1;
                    if(window.gif_double_show && with_double && window.gif_index >0){
                        window.gif_index -= 1;
                    }
                    setGifImgSrc();
                }
                else{
                    //toastr.warning("已经是第一页");
                }

            }

        }
        setTimeout(function(){window.gif_flag = false}, time_skip); // 1000毫秒后执行myFunction函数
        return true;
    }
    return false;
}
function closeGifPlayer(){
    let videoContainer = document.querySelector('#videoContainer');
    window.removeEventListener('wheel', handleEvent);
    window.removeEventListener('touchstart', handleEvent);
    window.removeEventListener('touchmove', handleEvent);
    window.removeEventListener('touchend', handleEvent);
    window.removeEventListener('keydown', handleEvent);
    window.removeEventListener('resize', gifImgResize);
    if (videoContainer && videoContainer.parentNode) {
        document.body.removeChild(videoContainer);
    }

    window.gif_player = false;
}




// 监听鼠标滚动事件和触摸滑动事件
function handleEvent(event) {
    // 阻止默认滚轮行为
  let prevent = true;

  if (event.type === 'wheel') {
    if (event.deltaY > 0) {
      gifImgLoad("wheel_down");
      console.log('向下滚动');
    } else if (event.deltaY < 0) {
      gifImgLoad("wheel_up");
      console.log('向上滚动');
    }
  } else if (event.type === 'touchstart') {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    check_move = false;
    prevent = false;
  } else if (event.type === 'touchend') {
    var endX = event.changedTouches[0].clientX;
    var endY = event.changedTouches[0].clientY;

    let change_x = Math.abs(endX - startX);
    let change_y = Math.abs(endY - startY);
    if(change_x > change_y) {
        // 左右滑动
        if (endX - startX > 0) gifImgLoad("touch_right");
        else if (endX - startX < 0) gifImgLoad("touch_left");
        else prevent = false;
    }
    else{
        //上下滑动
        if (endY - startY > 0) gifImgLoad("touch_down");
        else if (endY - startY < 0) gifImgLoad("touch_up");
        else prevent = false;
    }

    if(check_move != true){
        prevent = false;
    }

  }else if (event.type === 'touchmove'){
      check_move = true;
  }else if(event.type === 'keydown'){
      console.log(event.key);
      prevent = false;

      let key = event.key;
      if(key == 'ArrowUp' || key == 'ArrowLeft'){
        gifImgLoad("wheel_up");
      }
      else if(key == 'ArrowDown' || key == 'ArrowRight'){
        gifImgLoad("wheel_down");
      }


  }


  if(prevent == true){
      event.preventDefault();
  }



}