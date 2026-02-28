function load(){
    console.log("载入v2ray脚本");


    let btn1 = $("<button>全选</button>");
    let btn2 = $("<button>全否</button>");
    btn1.on("click", function(){
        let index = 0;
        let spans = $("span:contains('选择')");

        function clickNextButton() {
            if (index < spans.length) {
                let btn = $(spans[index]).closest('button');
                btn.click();
                index++;
            } else {
                clearInterval(intervalId); // 停止定时器
            }
        }

        let intervalId = setInterval(clickNextButton, 500); // 每0.5秒执行一次
    });


    btn2.on("click", function(){
        let index = 0;
        let spans = $("span:contains('取消')");

        function clickNextButton() {
            if (index < spans.length) {
                let btn = $(spans[index]).closest('button');
                btn.click();
                index++;
            } else {
                clearInterval(intervalId); // 停止定时器
            }
        }

        let intervalId = setInterval(clickNextButton, 500); // 每0.5秒执行一次
    });


    $(".navbar-brand").append(btn1);
    $(".navbar-brand").append(btn2);
}


load();