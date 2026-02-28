$(async function() {
    const scraper = new WebScraper();
    let opetions = {
        method: "GET",
        mode: 'cors',
        headers:{
            'X-Custom-Header': 'custom-value',
            'cookie': 'ipb_member_id=659743; ipb_pass_hash=be0d9201bc978c65a1de243619d46da0; igneous=c41592436; sk=l1mvcdjm6qn8x043yc37y7uvyv5j; u=659743-0-sw1mwax9zxk; hath_perks=m1.m2.m3.a.t1.t2.t3.p1.p2.s.q-f242e45806'
        }
    }
    let html = await scraper.fetchJson("https://exhentai.org/", opetions);
    console.log(html);
    // $.get("https://example.com/", function(data){
    //    console.log(data);
    // });
});