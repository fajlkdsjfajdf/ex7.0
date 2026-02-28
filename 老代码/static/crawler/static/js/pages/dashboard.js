$(document).ready(function() {
    
    "use strict";

/* Inspired by Lee Byron's test data generator. */
function stream_layers(n, m, o) {
  if (arguments.length < 5) o = 0;
  function bump(a) {
    var x = 1 / (.1 + Math.random()),
        y = 2 * Math.random() - .5,
        z = 10 / (.1 + Math.random());
    for (var i = 0; i < m; i++) {
      var w = (i / m - y) * z;
      a[i] += x * Math.exp(-w * w);
    }
  }
  return d3.range(n).map(function() {
      var a = [], i;
      for (i = 0; i < m; i++) a[i] = o + o * Math.random();
      for (i = 0; i < 5; i++) bump(a);
      return a.map(stream_index);
    });
};

/* Another layer generator using gamma distributions. */
function stream_waves(n, m) {
  return d3.range(n).map(function(i) {
    return d3.range(m).map(function(j) {
        var x = 20 * j / m - i / 3;
        return 2 * x * Math.exp(-.5 * x);
      }).map(stream_index);
    });
};

function stream_index(d, i) {
  return {x: i, y: Math.max(0, d)};
};
    var nvddata1 = function() {
        let layers = stream_layers(5,10+Math.random()*100,.1);

        return layers.map(function(data, i) {
            var a = i + 1;
            return {
                key: 'Product' + a,
                values: data
            };
        });
    };


    nv.addGraph(function() {
    var chart = nv.models.multiBarChart()
    .color(['#0070E0','#637282','#F1C205'])

    chart.xAxis
        .tickFormat(d3.format(',f'));

    chart.yAxis
        .tickFormat(d3.format(',.1f'));

    d3.select('#chart1 svg')
        .datum(nvddata1())
        .transition().duration(500)
        .call(chart)
        ;

    nv.utils.windowResize(chart.update);

    return chart;
});

    


    var chart2 = function () {

        // We use an inline data source in the example, usually data would
        // be fetched from a server

        var plot_data = [],
            totalPoints = 50;
        
        function getServiceData() {
            let url = "status?cls=ServiceStatus";

            fetch(url, {
              method: 'GET',
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }).then(res => res.json())
            .catch(error => toastr.error('Error:', error))
            .then(data => {
                //console.log(data);
                let server_html = $(".server-status").html();
                let system_info = data["system"];
                let use_memory = (data["use_memory"] / 1024 / 1024 / 1024).toFixed(1) + " GB";
                let memory1 = (data["memory"][3] / 1024 /1024 / 1024).toFixed(1);
                let memory2 = (data["memory"][0] / 1024 /1024 / 1024).toFixed(0);
                let memory = memory1 + "/" + memory2 + "GB";
                let cpu = data["cpu"];
                let dict = {"system_info": system_info, "use_memory": use_memory, "cpu": cpu, "memory": memory};
                // let ip_content = "ipv4: " + data["ipv4"] + "</br>  ipv6: " + data["ipv6"]
                // $(".ip-content").html(ip_content);
                $(".server-load").empty();
                $(".server-load").append(StringFormatByDict(server_html, dict));
                plot_data.push(cpu);
                if(plot_data.length > totalPoints){
                    plot_data = plot_data.slice(1);
                }
                let show_data = [];
                for(let i=0; i<50; i++){
                    if(i<plot_data.length){
                        show_data.push([i, plot_data[i]]);
                    }
                    else{
                        show_data.push([i, 0]);
                    }
                }
                plot2.setData([show_data]);
                plot2.draw();
            });
        }

        var plot2 = $.plot("#chart2", [getRandomData()], {
            series: {
                shadowSize: 0   // Drawing is faster without shadows
            },
            yaxis: {
                min: 0,
                max: 75
            },
            xaxis: {
                min: 0,
                max: 50
            },
            colors: ["#5893DF"],
            legend: {
                show: false
            },
            grid: {
                color: "#AFAFAF",
                hoverable: true,
                borderWidth: 0,
                backgroundColor: '#FFF'
            },
            tooltip: true,
            tooltipOpts: {
                content: "Y: %y",
                defaultTheme: false
            }
        });


        function getRandomData() {

            if (plot_data.length > 0)
                plot_data = plot_data.slice(1);

            // Do a random walk

            while (plot_data.length < totalPoints) {

                var prev = plot_data.length > 0 ? plot_data[plot_data.length - 1] : 50,
                    y = prev + Math.random() * 10 - 5;

                if (y < 0) {
                    y = 0;
                } else if (y > 75) {
                    y = 75;
                }

                plot_data.push(y);
            }

            // Zip the generated y values with the x values

            var res = [];
            for (var i = 0; i < plot_data.length; ++i) {
                res.push([i, plot_data[i]])
            }

            return res;
        }

        function update() {
            // plot2.setData([getServiceData()]);
            // plot2.draw();
            getServiceData();
            getLogs();
            setTimeout(update, 5000);
        }

        update();
    };

    chart2();
    
    


     function getAllCrawler(){
         let url = "status?cls=CrawlerStatus&type=getall";
          fetch(url, {
              method: 'GET',
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }).then(res => res.json())
            .catch(error => toastr.error('Error:', error))
            .then(data => {
                let tab_html = $("temp.crawler-list-tab").html();
                let content_html = $("temp.crawler-list-tab-content").html();
                for(let i in data){
                    let crawler_data = data[i];
                    $(".crawler-list ul").append(StringFormatByDict(tab_html, crawler_data));
                    $(".crawler-list .tab-content").append(StringFormatByDict(content_html, crawler_data));
                }

                $(".crawler-list ul li").eq(0).addClass("active");
                $(".crawler-list .tab-content .tab-pane").eq(0).addClass("active");
            });
     }
     getAllCrawler();






});


function getAllCrawlerStatus(){
    let url = "status?cls=CrawlerStatus&type=getallstatus";
    fetch(url, {
          method: 'GET',
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }).then(res => res.json())
        .catch(error => toastr.error('Error:', error))
        .then(data => {
            let task_item_html = $("temp.task-item").html();
            let task_status_html = $("temp.task-status tbody").html();
            let start_button_html = $("temp.start_button").html();
            let stop_button_html = $("temp.stop_button").html();
            $(".crawler-task-status").empty();
            $(".crawler-task-complete").empty();
            window.crawler_data = data;
            for(let i in data){
                let crawler_data = data[i];
                crawler_data["index"] = i;
                //crawler_data["all_memory"] = crawler_data["memory"]["all_memory"];
                if(crawler_data["count"]!=0 && crawler_data["complete"] == crawler_data["count"]){
                    crawler_data["bar"] = "progress-bar-success";
                    crawler_data["width"] = "100%";
                    crawler_data["check"] = "fa-check";
                }
                else{
                    let width =0;
                    if(crawler_data["count"]!=0)
                        width = parseInt(crawler_data["complete"] / crawler_data["count"] * 100);
                    crawler_data["bar"] = "progress-bar-info";
                    crawler_data["width"] = width + "%";
                    crawler_data["check"] = "";

                }

                if(crawler_data["run_status"] == "等待运行"){
                    crawler_data["label_status"] = "label-default";
                    crawler_data["button"]= StringFormatByDict(start_button_html, crawler_data);
                    //crawler_data["stop_button"] = StringFormatByDict(stop_button_html, crawler_data);
                    crawler_data["stop_button"] ="";
                }
                else if(crawler_data["run_status"] == "开始运行"){
                    crawler_data["label_status"] = "label-warning";
                    crawler_data["button"]= "";
                    crawler_data["stop_button"] = StringFormatByDict(stop_button_html, crawler_data);
                }
                else{
                    crawler_data["label_status"] = "label-success";
                    crawler_data["button"]= StringFormatByDict(start_button_html, crawler_data);
                    crawler_data["stop_button"] ="";
                }
                $(".crawler-task-complete").append(StringFormatByDict(task_item_html, crawler_data));
                $(".crawler-task-status").append(StringFormatByDict(task_status_html, crawler_data));
            }
        });
 }
 function updateAllCrawlerStatus(){
     getAllCrawlerStatus();
     setTimeout(updateAllCrawlerStatus, 10000);
 }
 updateAllCrawlerStatus();


function startCrawler(prefix, child){
     let url = "status?cls=CrawlerStatus&type=startone&prefix=" + prefix + "&child=" + child;
      fetch(url, {
          method: 'GET',
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }).then(res => res.json())
        .catch(error => toastr.error('Error:', error))
        .then(data => {
            if(data["status"] == "sucess"){
                toastr.success(data["msg"], "启动成功");
            }
            else{
                toastr.warning(data["msg"], "启动失败");
            }
            getAllCrawlerStatus();
        });
 }

 function stopCrawler(prefix, child){
     let url = "status?cls=CrawlerStatus&type=stopone&prefix=" + prefix + "&child=" + child;
      fetch(url, {
          method: 'GET',
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }).then(res => res.json())
        .catch(error => toastr.error('Error:', error))
        .then(data => {
            if(data["status"] == "sucess"){
                toastr.success(data["msg"], "停止成功");
            }
            else{
                toastr.warning(data["msg"], "停止失败");
            }
            getAllCrawlerStatus();
        });
 }


 function getMemorys(index){
    let data = window.crawler_data[index];
    let title = data["title"];
    $("#myModalLabel").html(title);

    let table = $("<table class='table table-bordered'></table>");
    let tbody = $("<tbody></tbody>");
    for(let key in data["memory"]){
        if(key != "all_memory"){
            let tr = $("<tr></tr>");
            tr.append("<td scope='row'>"+key+"</td>");
            tr.append("<td >"+data["memory"][key]["type"].replace("<class '", "").replace("'>", "")+"</td>");
            tr.append("<td >"+data["memory"][key]["size"]+"</td>");
            tr.append("<td >"+data["memory"][key]["count"]+"</td>");

            tbody.append(tr);
        }
    }
    table.append(tbody);
    $('#myModal .modal-body').empty();
    $('#myModal .modal-body').append(table);

    $('#myModal').modal();
 }

 async function snap2(){
    let url = "status?cls=ServiceStatus&type=snap2";
    let data = await fetchApi(url);
    console.log(data);
    let title = "快照变化";
    $("#myModalLabel").html(title);

    let table = $("<table class='table table-bordered'></table>");
    let tbody = $("<tbody></tbody>");
    for(let i in data){
        let d= data[i];
        d = d.replace("<", "").replace(">", "");
        let tr = $("<tr></tr>");
        tr.append("<td >"+d+"</td>");

        tbody.append(tr);
    }
    table.append(tbody);
    $('#myModal .modal-body').empty();
    $('#myModal .modal-body').append(table);
    $('#myModal').modal();
 }

  async function snap3(){
    let url = "status?cls=ServiceStatus&type=snap3";
    let data = await fetchApi(url);
    console.log(data);
    let title = "连接ip";
    $("#myModalLabel").html(title);

    let table = $("<table class='table table-bordered'></table>");
    let tbody = $("<tbody></tbody>");
    for(let i in data){
        let d= data[i];
        d = d.replace("<", "").replace(">", "");
        let tr = $("<tr></tr>");
        tr.append("<td >"+d+"</td>");

        tbody.append(tr);
    }
    table.append(tbody);
    $('#myModal .modal-body').empty();
    $('#myModal .modal-body').append(table);
    $('#myModal').modal();
 }

 async function snap1(type){
    let url = "status?cls=ServiceStatus&type=snap1";
    let data = await fetchApi(url);
    toastr.success('成功:', data["msg"])


 }
 async function biliblimanga_login(){
    let url = "status?cls=ServiceStatus&type=bilibilimanga_login";

    let data = await fetchApi(url);
    toastr.success('成功:', data["msg"]);
    window.location.href = data["check_url"];

 }

 async function getLogs(){
    let url = "status?cls=CrawlerStatus&type=getlog";
    let data = await  fetchApi(url);
    $(".server-log-table").empty();
    for(let i in data){
        let info = data[i];
        let type = info[0];
        let msg = info[1];
        let date = info[2];
        date = parseDate(date);

        let type_msg = "INFO"
        let bg = "#F1F1F1"
        if(type== 30){
            type_msg = "WARNING"
            bg = "yellow"
        }
        else if(type==40){
            type_msg = "ERROR"
            bg = "red"
        }
        let html = "<tr style='background: {bg}'><td>{type_name}</td><td>{date}</td><td>{msg}</td></tr>";
        $(".server-log-table").append(stringFormatByDict(html, {"type_name": type_msg, "msg": msg, "bg": bg, "date": date}));
    }
 }
