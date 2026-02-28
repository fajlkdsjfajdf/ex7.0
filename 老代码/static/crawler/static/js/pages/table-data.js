$(document).ready(function() {
    
    "use strict";
    
    
    // Datatables
    
    $('#main').dataTable();
    

    
    $('.date-picker').datepicker({
        orientation: "top auto",
        autoclose: true
    });


    function getCrawlerData(){


        let prefix = getUrlParam("prefix");
        $(".breadcrumb-header").html(prefix);
        let url = "status?cls=CrawlerStatus&type=getcrawlersdata&prefix=" + prefix;
        fetch(url, {
          method: 'GET',
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }).then(res => res.json())
        .catch(error => toastr.error('Error:', error))
        .then(data => {
            let table_html = $("temp.crawler-table").html();
            for(let child in data){
                let child_data = data[child];

                if (JSON.stringify(child_data) == '{}') {
                    console.log("没有记录");
                }
                else {
                    let trs_html = "";
                    for(let key in child_data) {
                        let value = child_data[key];
                        let background = "white";
                        let state = dictGet(value, "type", 1);
                        if(state==1)background = 'white';
                        if(state==2)background = 'red';
                        if(state==3)background = 'blue';
                        if(state==4)background = 'gray';
                        if(state==9)background = 'greenyellow';
                        let tr_html = "<tr style='background:"+background+"'>";
                        tr_html +="<td>"+ key +"</td>";
                        tr_html +="<td>"+ dictGet(value, "url") +"</td>";
                        tr_html +="<td>"+ dictGet(value, "msg") +"</td>";
                        tr_html +="<td>"+ dictGet(value, "type") +"</td>";
                        tr_html +="<td>"+ dictGet(value, "re_count") +"</td>";
                        tr_html +="<td>"+ dictGet(value, "date") +"</td>";
                        tr_html += "</tr>";
                        trs_html += tr_html;
                    }

                    if(child == "") child = "main";

                    $(".crawler-tables").append(StringFormatByDict(table_html, {"prefix": child}));

                    $("#" + child + " tbody").append(trs_html);
                    $("#" + child).dataTable();
                }


                // let table_is_append = false;
                // for(let key in child_data){
                //     if(table_is_append == false){
                //         $(".crawler-tables").append(StringFormatByDict(table_html, {"prefix": child}));
                //         table_is_append = true;
                //     }
                //
                // }

            }
        });

    }

    function update(){
        getCrawlerData();
        //setTimeout(update, 30000);
    }
    update();
});