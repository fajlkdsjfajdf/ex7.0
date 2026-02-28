/* -----------------------------------------------
					Js Main
--------------------------------------------------
    Template Name: NoonPost. - Personal Blog HTML Template
--------------------------------------------------

Table of Content

	. Preloader
    . Navigation
    . Search
    . Back-top
    . Carousel-hero
    
----------------------------------- */
"use strict";

$(function () {
    "use strict";

    /* -----------------------------------
            Preloader
    ----------------------------------- */
    $('.loading').delay(500).fadeOut(500);


    /* -----------------------------------
            Navigation
    ----------------------------------- */
    $(window).on('scroll', function () {
        if ($(".navbar").offset().top > 50) {
            $(".navbar").addClass("navbar-scroll");
        } else {
            $(".navbar ").removeClass("navbar-scroll");
        }
    });

    $('.navbar-toggler').on('click', function () {
        $('.navbar-collapse').collapse('show');
    });




    /* -----------------------------------
           Search
    ----------------------------------- */
    $('.search-icon').on('click', function () {
        getSearchHistory();
        $('.search').addClass('search-open');
    });
    $('.close').on('click', function () {
        $('.search').removeClass('search-open');
    });


    /* -----------------------------------
           Back-top
    ----------------------------------- */
    $(window).on("scroll", function () {
        if ($(window).scrollTop() > 250) {
            $('.back-top').fadeIn(300);
        } else {
            $('.back-top').fadeOut(300);
        }
    });

    $('.back-top').on('click', function (event) {
        event.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, 300);
        return false;
    });

    /* -----------------------------------
       Carousel-hero
    -----------------------------------*/
    $(".carousel-hero .owl-carousel").owlCarousel({
        loop: true,
        stagePadding: 0,
        margin: 0,
        nav: true,
        autoplay: true,
        center: false,
        dots: false,
        mouseDrag: true,
        touchDrag: true,
        smartSpeed: 1000,
        autoplayHoverPause: false,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1,
            },
            768: {
                items: 1,
            },
            1200: {
                items: 1,
            },
        }
    });

    // 定时查询img加载事件
    //window.img_load_timer = setInterval(imgLoadCheck, 3000);
});


// function imgLoadCheck(){
//     $("img[src*='load=0']").each(function(){
//         let img = $(this);
//         let src = img.attr("src");
//         let url = src + "&check=1";
//         //fetchImgLoadCheck(url, img);
//     });
// }
//
// async function fetchImgLoadCheck(url, img){
//     let data = await fetchApi(url, "GET");
//     if(data["status"] == "success"){
//         let src = img.attr("src");
//         src = src + "&reload=1";
//         src = src.replace("load=0", "");
//         img.attr("src", src);
//
//     }
// }


