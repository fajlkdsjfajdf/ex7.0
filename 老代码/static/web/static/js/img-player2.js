// 常量定义
const VIEWER_CONFIG = {
    fadeInTime: 200,
    marginRatio: 0.98,
    borderRadius: '20px'
};

// 图片查看器核心类
class ComicViewerCore {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.isDoublePage = false;
    }

    // 计算最佳图片尺寸
    calculateBestFitSize(imgSize, containerSize) {
        const ratio = imgSize.width / imgSize.height;
        let width = containerSize.width;
        let height = width / ratio;

        if (height > containerSize.height) {
            height = containerSize.height;
            width = height * ratio;
        }

        return { width, height };
    }

    // 判断是否应该显示双页
    shouldShowDoublePage(img1, img2, container) {
        const isPortrait = img => img.height > img.width;
        const isLandscape = size => size.width > size.height;

        return isPortrait(img1) &&
               isPortrait(img2) &&
               isLandscape(container) &&
               (img1.width * 2 <= container.width);
    }
}

// 全局查看器实例
const viewerCore = new ComicViewerCore();

function startGifPlayer(rotate = false) {
    if (document.querySelector("#videoContainer")) return;

    window.rotate = rotate;
    viewerCore.images = [];

    $("#page .imgs img").each(function() {
        const src = $(this).attr("data-original") || $(this).attr("src");
        viewerCore.images.push(src);
    });

    if (viewerCore.images.length) {
        createGifPlayer(viewerCore.images, window.page_num);
    }
}

function createGifPlayer(imgs, index = 1) {
    const videoContainer = document.createElement('div');
    videoContainer.id = 'videoContainer';

    const viewerHTML = `
        <div id="gifPlayerDiv" class="div-horizontal">
            <div id="gifPlayer-div1"></div>
            <div id="gifPlayer-div2"></div>
        </div>
        <span class="tools">
            <span class="close-btn"><i class="fa fa-window-close"></i></span>
            <span class="down-btn"><i class="fa fa-arrow-down"></i></span>
            <span class="fullscreen-btn page-big"><i class="fa fa-arrows-alt"></i></span>
            <span class="page-num">${index}/${imgs.length}</span>
        </span>
    `;

    videoContainer.innerHTML = viewerHTML;
    document.body.appendChild(videoContainer);

    // 事件绑定
    videoContainer.querySelector('.close-btn').addEventListener('click', closeGifPlayer);
    videoContainer.querySelector('.down-btn').addEventListener('click', () => gifImgLoad("wheel_down", false));
    videoContainer.querySelector('.fullscreen-btn').addEventListener('click', pageBig);

    viewerCore.currentIndex = index - 1;
    setGifImgSrc();

    // 全局事件监听
    const passiveOpt = { passive: false };
    ['wheel', 'touchstart', 'touchmove', 'touchend', 'keydown'].forEach(event => {
        window.addEventListener(event, handleEvent, passiveOpt);
    });
    window.addEventListener('resize', gifImgResize);
}

function setGifImgSrc(goNext = true) {
    const container = $("#gifPlayer-div1");
    container.hide().empty().fadeIn(VIEWER_CONFIG.fadeInTime);

    const currentImg = $(`<img id="gifPlayer">`)
        .attr({
            src: viewerCore.images[viewerCore.currentIndex],
            'data-original': viewerCore.images[viewerCore.currentIndex]
        })
        .on('load', gifImgResize);

    container.append(currentImg);

    // 预加载下一张图片
    const nextIndex = viewerCore.currentIndex + 1;
    if (nextIndex < viewerCore.images.length) {
        const nextImg = $(`<img id="gifPlayerNext">`)
            .attr({
                src: viewerCore.images[nextIndex],
                'data-original': viewerCore.images[nextIndex]
            })
            .on('load', gifImgResize);
        container.prepend(nextImg);
    } else {
        container.prepend($('<img id="gifPlayerNext">'));
    }

    container.find('img').on('dblclick', function() {
        reload_img($(this));
    });

    if (goNext) {
        goPageNum(viewerCore.currentIndex + 1);
    }
}

function gifImgResize() {
    const img = $("#gifPlayer")[0];
    const img2 = $("#gifPlayerNext")[0];
    const container = $("#videoContainer")[0];

    if (!img || !img2 || !container) return;

    const imgSize = { width: img.naturalWidth, height: img.naturalHeight };
    const img2Size = { width: img2.naturalWidth, height: img2.naturalHeight };
    const containerSize = {
        width: container.clientWidth * VIEWER_CONFIG.marginRatio,
        height: container.clientHeight * VIEWER_CONFIG.marginRatio
    };

    // 计算单页最佳尺寸
    const singleSize = viewerCore.calculateBestFitSize(imgSize, containerSize);

    // 判断是否显示双页
    viewerCore.isDoublePage = viewerCore.shouldShowDoublePage(
        imgSize,
        img2Size,
        containerSize
    );

    // 应用尺寸
    setgifImg(singleSize.width, singleSize.height, false, viewerCore.isDoublePage);
}

function setgifImg(width, height, rotate = false, doubleShow = false) {
    const img = $("#gifPlayer");
    const img2 = $("#gifPlayerNext");
    const borderRadius = VIEWER_CONFIG.borderRadius;

    img.css({
        width: width,
        height: height,
        'border-radius': doubleShow ? `0 ${borderRadius} ${borderRadius} 0` : borderRadius
    }).attr({ width, height });

    img2.css({
        width: width,
        height: height,
        'border-radius': doubleShow ? `${borderRadius} 0 0 ${borderRadius}` : borderRadius,
        display: doubleShow ? 'inline-block' : 'none'
    }).attr({ width, height });
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