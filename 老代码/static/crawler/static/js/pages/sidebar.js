$(document).ready(function() {


    function getCrawlers(){
         let url = "status?cls=CrawlerStatus&type=getcrawlers";
          fetch(url, {
              method: 'GET',
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }).then(res => res.json())
            .catch(error => toastr.error('Error:', error))
            .then(data => {
                let item_html = $("temp.crawlers-menu-item").html();
                for(let i in data){
                    let crawler = data[i];
                    $(".crawlers-menu").append(StringFormatByDict(item_html, crawler));
                }
            });
    }
    getCrawlers();
});