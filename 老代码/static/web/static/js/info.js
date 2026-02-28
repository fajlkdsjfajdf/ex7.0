async function getInfo(id) {
  setHashParams("info", id.toString());

  $(".loading").show();
  window.web_tools.cleanInfo();
  window.info_id = id;

  let option = { type: "info", id: id, prefix: window.prefix };
  let data = await fetchApi("response", "GET", option);
  let info_html = $(".temp-info-" + window.prefix).html();
  data = info_fun[window.prefix](data);
  $("#info .info").empty();
  $("#info .info").append(stringFormatByDict(info_html, data));
  $(".post-single-body").css("word-wrap", "break-word");
  window.info_data = data;
  addButtons(data["buttons"]);
  addTags(data["tags"]);
  addLists(data["lists"]);
  addNails(data["nail_count"]);

  imgLoad();
  infoLoad(data);
  addOver();
  buildSearch();
  clearForum();

  toInfo(0);
  infoImgLoad();
  $(".loading").hide();
}

const info_fun = {
  ex: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title", "");
    d["gid"] = getDefaultFromDict(data, "gid", "0");
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 0);
    d["forums"] = getDefaultFromDict(data, "forums", []);
    d["token"] = getDefaultFromDict(data, "token", "0");
    d["title_jpn"] = getDefaultFromDict(data, "title_jpn", "");
    d["mpvkey"] = getDefaultFromDict(data, "mpvkey", "");
    d["update_mpv"] = getDefaultFromDict(data, "update_mpv", "");
    d["mpv_images"] = getDefaultFromDict(data, "mpv_images", "");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      gid: data["gid"],
    });
    d["date"] = new Date(data["date"]).format("yyyy-MM-dd");
    d["rating"] = parseFloat(getDefaultFromDict(data, "rating", 0)).toFixed(2);
    d["category"] = getDefaultFromDict(data, "category", "");
    d["uploader"] = getDefaultFromDict(data, "uploader", "");
    d["filecount"] = getDefaultFromDict(data, "filecount", 0);
    d["images"] = getDefaultFromDict(data, "images", []);
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["tags"].unshift(d["category"]);
    d["is_down"] = getDefaultFromDict(data, "image_load", 0);
    d["list_count"] = 1;
    d["lists"] = [
      {
        update_time: d["date"],
        read_time: getDefaultFromDict(data, "read_history", ""),
        _id: getDefaultFromDict(data, "_id", "0"),
        is_down: getDefaultFromDict(data, "image_load", ""),
        title: "单本",
      },
    ];

    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));
    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }

    let page_count = parseInt(d["filecount"]);
    if (page_count > 30) page_count = 30;
    d["nail_count"] = page_count;
    d["nail_count"] = 0;
    d["buttons"] = [
        {
          "title": "跳转E绅士",
          "type": "link",
          "value": `https://e-hentai.org/g/${d["gid"]}/${d["token"]}`
        },
        {
          "title": "跳转Ex绅士",
          "type": "link",
          "value": `https://exhentai.org/g/${d["gid"]}/${d["token"]}`
        }
    ];
    return d;
  },
  av: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      aid: data["aid"],
    });
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "fanhao");
    d["mteam_url"] = "https://kp.m-team.cc/adult.php?search=" + d["fanhao"];
    d["niyaa_url"] = "https://sukebei.nyaa.si/?q=" + d["fanhao"];
    d["Length"] = getDefaultFromDict(data, "Length", "0");
    d["Director"] = getDefaultFromDict(data, "Director", "");
    d["Studio"] = getDefaultFromDict(data, "Studio", "");
    d["Label"] = getDefaultFromDict(data, "Label", "");
    d["Series"] = getDefaultFromDict(data, "Series", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    let pics = getDefaultFromDict(data, "PicList", []);
    let lists = [];
    for (let i in pics) {
      let src = buildUrlParamByDict("response", {
        type: "loc.thumbnail",
        prefix: self.prefix,
        num: parseInt(i) + 1,
        id: d["aid"],
      });
      lists.push(src);
    }
    d["lists"] = { pics: lists };

    d["lists"] = { stars: getDefaultFromDict(data, "stars", []), pics: lists };

    return d;
  },
  jv: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 0);
    d["url"] = getDefaultFromDict(data, "url", 0);
    d["type"] = getDefaultFromDict(data, "type", 0);
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      aid: data["aid"],
    });
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "fanhao");
    d["mteam_url"] = "https://kp.m-team.cc/adult.php?search=" + d["fanhao"];
    d["niyaa_url"] = "https://sukebei.nyaa.si/?q=" + d["fanhao"];
    d["Length"] = getDefaultFromDict(data, "Length", "0");
    d["Director"] = getDefaultFromDict(data, "Director", "");
    d["Studio"] = getDefaultFromDict(data, "Studio", "");
    d["Label"] = getDefaultFromDict(data, "Label", "");
    d["Series"] = getDefaultFromDict(data, "Series", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["PicList"] = getDefaultFromDict(data, "PicList", []);
    d["nail_count"] = d["PicList"].length;
    let pics = getDefaultFromDict(data, "PicList", []);
    let lists = [];
    for (let i in pics) {
      let src = buildUrlParamByDict("response", {
        type: "loc.thumbnail",
        prefix: self.prefix,
        num: parseInt(i) + 1,
        id: d["aid"],
      });
      lists.push(src);
    }
    d["lists"] = { pics: lists };

    d["lists"] = { stars: getDefaultFromDict(data, "stars", []), pics: lists };

    return d;
  },
  jb: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 2);
    d["url"] = getDefaultFromDict(data, "url", 0);
    d["type"] = getDefaultFromDict(data, "type", 0);
    if (d["type"] == "有码") {
      d["type_str"] = "content_censored";
    } else {
      d["type_str"] = "content_uncensored";
    }
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      aid: data["aid"],
    });
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "fanhao");
    d["mteam_url"] = "https://kp.m-team.cc/browse/adult?keyword=" + d["fanhao"];
    d["niyaa_url"] = "https://sukebei.nyaa.si/?q=" + d["fanhao"];
    d["tktube_url"] =
      `https://tktube.com/zh/search/${d["fanhao"].replace("-", "--")}/`;

    d["Length"] = getDefaultFromDict(data, "Length", "0");
    d["Director"] = getDefaultFromDict(data, "Director", "");
    d["Studio"] = getDefaultFromDict(data, "Studio", "");
    d["Label"] = getDefaultFromDict(data, "Label", "");
    d["Series"] = getDefaultFromDict(data, "Series", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["PicList"] = getDefaultFromDict(data, "PicList", []);
    d["nail_count"] = d["PicList"].length;
    let pics = getDefaultFromDict(data, "PicList", []);
    let lists = [];
    for (let i in pics) {
      let src = pics[i];
      //let src = buildUrlParamByDict("response", {"type": "loc.thumbnail", "prefix": self.prefix,"num": parseInt(i) + 1 , "id": d["aid"]});
      lists.push(src);
    }
    d["lists"] = { pics: lists };

    d["lists"] = { stars: getDefaultFromDict(data, "stars", []), pics: lists };
    d["other_info"] = "";
    let tk = getDefaultFromDict(data, "tk", []);
    if (tk.length > 0) {
      console.log(tk);
      let other_info = "";
      for (let t in tk) {
        other_info += `<li style="margin-top:10px;"><a target="_blank" href="https://tktube.com/zh/videos/${tk[t]["aid"]}/${tk[t]["token"]}/"> ${t}: [${tk[t]["type"]} ]  ${tk[t]["title"]} </a></li>`;
      }
      d["other_info"] = other_info;
    }

    d["buttons"] = [
        {
          "title": "跳转Javbooks",
          "type": "link",
          "value": `${d["url"]}/${d["type_str"]}/${d["aid"]}.htm`
        },
        {
          "title": "mteam查询",
          "type": "link",
          "value": d["mteam_url"]
        },
      {
          "title": "niyaa查询",
          "type": "link",
          "value": d["niyaa_url"]
        },
      {
          "title": "tktube查询",
          "type": "link",
          "value": d["tktube_url"]
        },
    ];

    return d;
  },
  tk: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");

    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 0);
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["type"] = getDefaultFromDict(data, "type", "");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      aid: data["aid"],
    });
    d["Length"] = getDefaultFromDict(data, "Length", "0");
    d["summary"] = getDefaultFromDict(data, "summary", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["tags"].unshift("type:" + d["type"]);
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["token"] = getDefaultFromDict(data, "token", "");
    d["nail"] = getDefaultFromDict(data, "PicList", []);
    d["nail_count"] = d["nail"].length;
    let pics = getDefaultFromDict(data, "PicList", []);
    let lists = [];
    for (let i in pics) {
      let src = buildUrlParamByDict("response", {
        type: "loc.thumbnail",
        prefix: self.prefix,
        num: parseInt(i) + 1,
        id: d["aid"],
      });
      lists.push(src);
    }
    d["lists"] = { pics: lists };

    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));
    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }

    d["buttons"] = [
        {
          "title": "跳转tk",
          "type": "link",
          "value": `https://tktube.com/videos/${d["aid"]}/${d["token"]}/`
        }
    ];

    return d;
  },
  ty: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["title"] = getDefaultFromDict(data, "title", "未知名称");
    d["img"] = getDefaultFromDict(
      data,
      "pic_l",
      "/static/imgages/waitindexpic.gif",
    );
    d["date"] = getDefaultFromDict(data, "date", "未知日期");
    d["fanhao"] = getDefaultFromDict(data, "fanhao", "fanhao");
    d["Length"] = getDefaultFromDict(data, "Length", "0");
    d["mteam_url"] = "https://kp.m-team.cc/adult.php?search=" + d["fanhao"];
    d["Series"] = getDefaultFromDict(data, "Series", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["lists"] = {
      stars: getDefaultFromDict(data, "stars", []),
      pics1: getDefaultFromDict(data, "PicList1", []),
      pics2: getDefaultFromDict(data, "PicList2", []),
    };

    return d;
  },
  lf: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");

    d["url"] = getDefaultFromDict(data, "url", "");
    d["title"] = getDefaultFromDict(data, "name_cn", "");
    if (d["title"] == "") d["title"] = getDefaultFromDict(data, "name", "");
    d["forums"] = getDefaultFromDict(data, "forums", []);
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 3);
    d["aid"] = getDefaultFromDict(data, "id", "");
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "albim_likes", 0)));

    d["summary"] = getDefaultFromDict(data, "summary", "");
    let infostr = "";
    let infobox = getDefaultFromDict(data, "infobox", []);
    for (let i in infobox) {
      let info = infobox[i];
      infostr = infostr + `${info["key"]} : ${info["value"]} ;  <br>`;
    }
    d["summary"] = infostr + d["summary"];

    d["create_time"] = getDefaultFromDict(data, "date", "");

    d["tags"] = getDefaultFromDict(data, "tags", []);

    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);

    d["emby_url"] = getDefaultFromDict(data, "emby_url", "");
    d["series"] = getDefaultFromDict(data, "series", []);

    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    d["buttons"] = [
        {
          "title": "跳转番组计划",
          "type": "link",
          "value": `${d["url"]}/subject/${d["aid"]}`
        }];
    return d;
  },
  cm: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      aid: data["aid"],
    });
    d["url"] = getDefaultFromDict(data, "url", "");
    d["title"] = getDefaultFromDict(data, "title", "");
    d["forums"] = getDefaultFromDict(data, "forums", []);
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 0);
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "albim_likes", 0)));
    d["readers"] = getNo(parseInt(getDefaultFromDict(data, "readers", 0)));
    d["filecount"] = getDefaultFromDict(data, "filecount", 0);
    d["summary"] = getDefaultFromDict(data, "summary", "");
    d["create_time"] = new Date(data["create_time"]).format("yyyy-MM-dd");
    d["update_time"] = new Date(data["update_time"]).format("yyyy-MM-dd");
    let type = getDefaultFromDict(data, "types", []);
    d["type1"] = getDefaultFromDict(type, 0, "");
    d["type2"] = getDefaultFromDict(type, 1, "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    let author = getDefaultFromDict(data, "author", []);
    d["author1"] = getDefaultFromDict(author, 0, "");
    d["author2"] = getDefaultFromDict(author, 1, "");
    d["author3"] = getDefaultFromDict(author, 2, "");
    d["author4"] = getDefaultFromDict(author, 3, "");
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["cdn"] = getDefaultFromDict(data, "cdn", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    d["buttons"] = [
        {
          "title": "跳转禁漫天堂",
          "type": "link",
          "value": `${d["url"]}/album/${d["aid"]}`
        }];

    return d;
  },
  bs: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["img"] =
      "/imgcache?url=" +
      encodeURIComponent(getDefaultFromDict(data, "pic", ""));
    d["url"] = getDefaultFromDict(data, "url", "");
    d["url"] = "https://www.bilinovel.com";

    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["link_url"] = d["url"] + "/novel/" + d["aid"] + ".html";

    d["title"] = getDefaultFromDict(data, "title", "");
    d["author"] = getDefaultFromDict(data, "author", "");
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "likes", 0)));
    d["summary"] = getDefaultFromDict(data, "summary", "");
    d["update_time"] = new Date(data["update_time"]).format("yyyy-MM-dd");
    d["tags"] = getDefaultFromDict(data, "tags", []);

    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);

    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    d["buttons"] = [
        {
          "title": "跳转哔哩轻小说",
          "type": "link",
          "value": d["link_url"]
        }];
    return d;
  },
  cb: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");

    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["img"] = getDefaultFromDict(data, "pic", "");
    d["title"] = getDefaultFromDict(data, "title", "");
    d["type"] = getDefaultFromDict(data, "type", "");
    d["author"] = getDefaultFromDict(data, "author", "");
    d["summary"] = getDefaultFromDict(data, "content", "");

    let comments = getDefaultFromDict(data, "comments", "");
    let comments_html = "";
    for (let i in comments) {
      comments_html = comments_html + `<p>${comments[i]}</p>`;
    }
    d["comments2"] = comments_html;

    d["lists"] = getDefaultFromDict(data, "reco", []);

    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));
    for (let i in window.web_data) {
      let web = window.web_data[i];
      if (web["title"] == "禁漫天堂") {
        d["url"] = web["url"];
      }
    }
    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    d["buttons"] = [
        {
          "title": "跳转深夜食堂",
          "type": "link",
          "value": `${d["url"]}/blog/${d["aid"]}`
        }];
    return d;
  },
  bk: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      cid: data["cid"],
    });
    d["title"] = getDefaultFromDict(data, "title", "");
    d["cid"] = getDefaultFromDict(data, "cid", "");
    d["forums"] = getDefaultFromDict(data, "forums", []);
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 0);
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "totalLikes", 0)));
    d["readers"] = getNo(parseInt(getDefaultFromDict(data, "totalViews", 0)));
    d["filecount"] = getDefaultFromDict(data, "pagesCount", 0);
    d["summary"] = getDefaultFromDict(data, "description", "");
    d["create_time"] = new Date(data["created_at"]).format("yyyy-MM-dd");
    d["update_time"] = new Date(data["updated_at"]).format("yyyy-MM-dd");
    let type = getDefaultFromDict(data, "categories", []);
    d["type1"] = getDefaultFromDict(type, 0, "");
    d["type2"] = getDefaultFromDict(type, 1, "");
    d["type3"] = getDefaultFromDict(type, 2, "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    let author = getDefaultFromDict(data, "author", "").split(/[ ,、]+/);
    d["author1"] = getDefaultFromDict(author, 0, "")
      .replace("(", "")
      .replace(")", "");
    d["author2"] = getDefaultFromDict(author, 1, "")
      .replace("(", "")
      .replace(")", "");
    d["author3"] = getDefaultFromDict(author, 2, "")
      .replace("(", "")
      .replace(")", "");
    d["author4"] = getDefaultFromDict(author, 3, "")
      .replace("(", "")
      .replace(")", "");
    let chineseTeam = getDefaultFromDict(data, "chineseTeam", "").split(
      /[ ,、]+/,
    );
    d["chineseTeam1"] = getDefaultFromDict(chineseTeam, 0, "")
      .replace("(", "")
      .replace(")", "");
    d["chineseTeam2"] = getDefaultFromDict(chineseTeam, 1, "")
      .replace("(", "")
      .replace(")", "");
    d["chineseTeam3"] = getDefaultFromDict(chineseTeam, 2, "")
      .replace("(", "")
      .replace(")", "");
    d["chineseTeam4"] = getDefaultFromDict(chineseTeam, 3, "")
      .replace("(", "")
      .replace(")", "");
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["cdn"] = getDefaultFromDict(data, "cdn", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));
    // for(let i in window.web_data){
    //     let web = window.web_data[i];
    //     if(web["db"] == "comic18"){
    //         d["url"] = web["url"];
    //     }
    // }
    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }

    return d;
  },
  mh: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["img"] = getDefaultFromDict(
      data["images"],
      "large",
      "/static/waitindexpic.gif",
    );
    d["title"] = getDefaultFromDict(data, "name_cn", data["name"]);
    d["rating"] = parseFloat(
      getDefaultFromDict(data["rating"], "score", 0),
    ).toFixed(2);
    d["summary"] = getDefaultFromDict(data, "summary", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["id"] = data["id"];
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));
    d["lists_history"] = getDefaultFromDict(data, "lists_history", {});

    d["date"] = "";
    d["end_date"] = "";
    d["author1"] = "";
    d["author2"] = "";
    let infos = getDefaultFromDict(data, "infobox", []);
    for (let i in infos) {
      let info = infos[i];
      let key = getDefaultFromDict(info, "key", "");
      if (key == "发售日" || key == "开始") {
        d["date"] = getDefaultFromDict(info, "value", "");
        if (typeof d["date"] != "string") {
          if (0 in d["date"] && "v" in d["date"][0])
            d["date"] = d["date"][0]["v"];
          else d["date"] = JSON.stringify(d["date"]);
        }
      } else if (key == "结束") {
        d["end_date"] = getDefaultFromDict(info, "value", "");
        if (typeof d["end_date"] != "string") {
          if (0 in d["end_date"] && "v" in d["end_date"][0])
            d["end_date"] = d["end_date"][0]["v"];
          else d["end_date"] = JSON.stringify(d["end_date"]);
        }
      } else if (key == "作者" || key == "原作") {
        d["author1"] = getDefaultFromDict(info, "value", "");
        if (typeof d["author1"] != "string") {
          if (0 in d["author1"] && "v" in d["author1"][0])
            d["author1"] = d["author1"][0]["v"];
          else d["author1"] = JSON.stringify(d["author1"]);
        }
      } else if (key == "作画") {
        d["author2"] = getDefaultFromDict(info, "value", "");
        if (typeof d["author2"] != "string") {
          if (0 in d["author2"] && "v" in d["author2"][0])
            d["author2"] = d["author2"][0]["v"];
          else d["author2"] = JSON.stringify(d["author2"]);
        }
      }
    }

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    return d;
  },
  lm: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      id: data["_id"],
    });
    d["title"] = getDefaultFromDict(data, "title");

    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["id"] = data["id"];
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));
    d["lists_history"] = getDefaultFromDict(data, "lists_history", {});

    d["date"] = getDefaultFromDict(data, "date", 0);

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    return d;
  },
  mg: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    d["img"] = buildUrlParamByDict("response", {
      prefix: window.prefix,
      type: "thumb",
      aid: data["aid"],
    });
    d["url"] = getDefaultFromDict(data, "url", "");
    d["title"] = getDefaultFromDict(data, "title", "");
    d["forums"] = getDefaultFromDict(data, "forums", []);
    d["thumb_load"] = getDefaultFromDict(data, "thumb_load", 0);
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["rating"] = getNo(parseInt(getDefaultFromDict(data, "rating", 0)));

    d["summary"] = getDefaultFromDict(data, "plot", "");

    d["update_time"] = new Date(data["update_time"]).format("yyyy-MM-dd");
    let type = getDefaultFromDict(data, "types", []);

    d["tags"] = getDefaultFromDict(data, "tags", []);
    let author = getDefaultFromDict(data, "author", []);
    if (typeof author === "string") {
      author = [author];
    }
    d["author1"] = getDefaultFromDict(author, 0, "");
    d["author2"] = getDefaultFromDict(author, 1, "");
    d["author3"] = getDefaultFromDict(author, 2, "");
    d["author4"] = getDefaultFromDict(author, 3, "");
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["cdn"] = getDefaultFromDict(data, "cdn", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }

    return d;
  },
  km: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    let img = getDefaultFromDict(data, "imageUrl", "");
    d["img"] = getCacheImgSrc(img);
    d["title"] = getDefaultFromDict(data, "title", "");
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["update_time"] = new Date(data["update_time"]).format("yyyy-MM-dd");
    d["views"] = getDefaultFromDict(data, "views", "");
    d["favoriteCount"] = getDefaultFromDict(data, "favoriteCount", "");
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["status"] = getDefaultFromDict(data, "status", "");
    d["url_link"] = window.host_url + "/comic/" + d["aid"];
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    d["buttons"] = [
        {
          "title": "跳转宅漫画",
          "type": "link",
          "value": d["link_url"]
        },
        {
          "title": "绑定bilibili评论",
          "type": "bili_comments",
          "value": d["aid"]
        },
    ];

    return d;
  },
  ym: function(data) {
    let d = {};
    d["_id"] = getDefaultFromDict(data, "_id", "");
    let img = getDefaultFromDict(data, "pic", "");
    d["img"] = getCacheImgSrc(img);
    d["title"] = getDefaultFromDict(data, "title", "");
    d["aid"] = getDefaultFromDict(data, "aid", "");
    d["update_time"] = "";
    d["views"] = "";
    d["favoriteCount"] = "";
    d["tags"] = getDefaultFromDict(data, "tags", []);
    d["status"] = getDefaultFromDict(data, "status", "");
    d["url_link"] = window.host_url + "/" + d["aid"] + "yy/";
    d["list_count"] = getDefaultFromDict(data, "lists", []).length;
    d["lists"] = getDefaultFromDict(data, "lists", []);
    d["bookmark"] = parseInt(getDefaultFromDict(data, "bookmark", 0));

    if (d["bookmark"] == 0) {
      d["btn_type"] = "btn-info";
      d["bookmark_state"] = "加入收藏";
      d["bookmark"] = 1; //设为1加入收藏
    } else {
      d["btn_type"] = "btn-success";
      d["bookmark_state"] = "已收藏";
      d["bookmark"] = 0; //设为0取消收藏
    }
    d["buttons"] = [
        {
          "title": "跳转yy漫画",
          "type": "link",
          "value": d["link_url"]
        },
        {
          "title": "绑定bilibili评论",
          "type": "bili_comments",
          "value": d["aid"]
        },
    ];
    return d;
  },
};

function lmInfo(data) {}

function mgInfo(data) {}

function addButtons(buttons){
  // 在tags上方插入一个放按钮的地方
  $("#info .info .post-single-footer").before("<div class='info-buttons post-single-footer'></div>");
  for(let i in buttons){
    let button = buttons[i];
    let btn = $("<button class='btn btn-success ml-1 mt-1'></button>");

    if(button["type"] == "link"){
      btn.append('<i class="icon_link"></i>');
      btn.on("click", function(){
        window.open(button["value"]);
      });
    }
    else if(button["type"] == "bili_comments"){
      btn.append('<i class="icon_link"></i>');
      btn.on("click", function(){
        getBilibiliManga(button["value"]);
      });
    }
    btn.append(`<span style="margin-left:5px;">${button["title"]}</span>`);
    $("#info .info .info-buttons").append(btn);

  }
}

function addTags(tags) {
  let tag_html =
    "<li><a href=\"javascript:setTag('{tag_id}', '{tag_name}')\">{tag_name}</a></li>";
  for (let i in tags) {
    let tag = tags[i];


    switch (window.prefix) {
      case "ex":
        let tag_name = tag;
        if (tag_name in window.ex_tags) {
          tag_name =
            window.ex_tags[tag_name]["namespace"] +
            ":" +
            window.ex_tags[tag_name]["name"];
        }
        tag = { tag_id: tag, tag_name: tag_name };
        break;
      case "mh":
        tag = { tag_id: tag["name"], tag_name: tag["name"] };
        break;
      default:
        tag = { tag_id: tag, tag_name: tag };
        break;

    }
    $("#info .info .tags .list-inline").append(
      stringFormatByDict(tag_html, tag),
    );
  }
}

function getLatestDate(arr) {
  let latestDate = null;
  for (let i = 0; i < arr.length; i++) {
    if (
      arr[i].read_history &&
      (!latestDate || new Date(arr[i].read_history) > new Date(latestDate))
    ) {
      latestDate = arr[i].read_history;
    }
  }
  return latestDate;
}

function addLists(lists) {
  let list_html =
    '<tr class="{class}"><td><a href="javascript:getPage({chapter})">{file_title}</a></td><td>{update_time}</td><td>{read_time}</td><td>{file_state}</td></tr>';

  let last_read = getLatestDate(lists);

  for (let i in lists) {
    if (["ex", "bk", "mg", "km", "ym"].includes(window.prefix)) {
      let d = {};
      let list = lists[i];
      d["update_time"] = getDefaultFromDict(list, "update_time", "未知时间");
      if (window.prefix == "bk") {
        d["update_time"] = getDefaultFromDict(
          list,
          "updated_at",
          "未知时间",
        ).slice(0, 10);
      }

      d["read_time"] = getDefaultFromDict(list, "read_time", "尚未阅读");
      d["read_history"] = getDefaultFromDict(list, "read_history", "尚未阅读");
      d["chapter"] = i;
      d["file_state"] = parseInt(getDefaultFromDict(list, "is_down", 0));
      d["file_title"] = getDefaultFromDict(list, "title", "未知标题");
      d["class"] = "";
      if (d["update_time"] != "未知时间")
        d["update_time"] = new Date(d["update_time"]).format("yyyy-MM-dd");
      else d["update_time"] = "";
      if (d["read_time"] != "尚未阅读") {
        d["read_time"] = new Date(d["read_time"]).format("yyyy-MM-dd");
        d["class"] = "read";
      }
      if (d["read_history"] != "尚未阅读") {
        d["read_time"] = new Date(d["read_history"]).format("yyyy-MM-dd");
        if (last_read && d["read_history"] == last_read) {
          d["class"] = "lastread";
        } else {
          d["class"] = "read";
        }
      }
      if (d["file_state"] == 0) {
        d["file_state"] = "未下载";
      } else if (d["file_state"] == 2) {
        d["file_state"] = "已下载";
      } else if (d["file_state"] == 3) {
        d["file_state"] = "正在@home下载";
      } else if (d["file_state"] == 5) {
        d["file_state"] = "等待下载";
      } else if (d["file_state"] == 1) {
        d["file_state"] = "已下载";
      }
      $("#info .info .chapters tbody").append(stringFormatByDict(list_html, d));
    } else if (window.prefix == "cm") {
      let list_html =
        '<tr class="{class}"><td><a href="javascript:getPage({chapter})">{file_title}</a></td><td>{pid}</td><td>{update_time}</td><td>{read_time}</td><td>{file_state}</td></tr>';

      let d = {};
      let list = lists[i];
      d["update_time"] = getDefaultFromDict(list, "update_time", "未知时间");
      if (window.prefix == "bk") {
        d["update_time"] = getDefaultFromDict(
          list,
          "updated_at",
          "未知时间",
        ).slice(0, 10);
      }

      d["read_time"] = getDefaultFromDict(list, "read_time", "尚未阅读");
      d["read_history"] = getDefaultFromDict(list, "read_history", "尚未阅读");
      d["pid"] = getDefaultFromDict(list, "pid", "0");
      d["chapter"] = i;
      d["file_state"] = parseInt(getDefaultFromDict(list, "is_down", 0));
      let ft = getDefaultFromDict(list, "title", "");
      let fj =  getDefaultFromDict(list, "order", "");
      let file_title = `第${fj}集  ${ft}`;
      d["file_title"] = file_title;
      d["class"] = "";
      if (d["update_time"] != "未知时间")
        d["update_time"] = new Date(d["update_time"]).format("yyyy-MM-dd");
      else d["update_time"] = "";
      if (d["read_time"] != "尚未阅读") {
        d["read_time"] = new Date(d["read_time"]).format("yyyy-MM-dd");
        d["class"] = "read";
      }
      if (d["read_history"] != "尚未阅读") {
        d["read_time"] = new Date(d["read_history"]).format("yyyy-MM-dd");
        if (last_read && d["read_history"] == last_read) {
          d["class"] = "lastread";
        } else {
          d["class"] = "read";
        }
      }
      if (d["file_state"] == 0) {
        d["file_state"] = "未下载";
      } else if (d["file_state"] == 2) {
        d["file_state"] = "已下载";
      } else if (d["file_state"] == 3) {
        d["file_state"] = "正在@home下载";
      } else if (d["file_state"] == 5) {
        d["file_state"] = "等待下载";
      } else if (d["file_state"] == 1) {
        d["file_state"] = "已下载";
      }

      $("#info .info .chapters tbody").append(stringFormatByDict(list_html, d));
    } else if (window.prefix == "bs") {
      let list_html =
        '<tr class="{class}"><td><a href="javascript:getPage({chapter})">{v_title}</a></td><td><a href="javascript:getPage({chapter})">{title}</a>></td><td>{read_time}</td></tr>';

      let d = {};
      let list = lists[i];

      d["read_time"] = getDefaultFromDict(list, "read_time", "尚未阅读");
      d["read_history"] = getDefaultFromDict(list, "read_history", "尚未阅读");
      d["chapter"] = i;

      d["v_title"] = getDefaultFromDict(list, "v_title", "未知标题");
      d["title"] = getDefaultFromDict(list, "title", "未知标题");
      d["class"] = "";
      if (d["read_time"] != "尚未阅读") {
        d["read_time"] = new Date(d["read_time"]).format("yyyy-MM-dd");
        d["class"] = "read";
      }
      if (d["read_history"] != "尚未阅读") {
        d["read_time"] = new Date(d["read_history"]).format("yyyy-MM-dd");
        if (last_read && d["read_history"] == last_read) {
          d["class"] = "lastread";
        } else {
          d["class"] = "read";
        }
      }
      $("#info .info .chapters tbody").append(stringFormatByDict(list_html, d));
    } else if (window.prefix == "mh") {
      let d = {};
      let list = lists[i];
      d["chapter"] = i;
      d["file_state"] = 1;
      d["file_title"] = list;
      d["update_time"] = "";
      d["read_time"] = "";
      let key = i.toString();
      if (key in window.info_data["lists_history"]) {
        let read_history = window.info_data["lists_history"][key];
        d["read_time"] = new Date(read_history).format("yyyy-MM-dd");
        d["class"] = "read";
      }
      $("#info .info .chapters tbody").append(stringFormatByDict(list_html, d));
    } else if (window.prefix == "mg" || window.prefix == "lm") {
      let d = {};
      let list = lists[i];
      d["chapter"] = i;
      d["file_state"] = 0;
      d["file_title"] = list["title"];
      d["read_time"] = list["read_history"] || "";
      d["update_time"] = "";
      if (d["read_time"] != "") {
        d["class"] = "read";
        d["read_time"] = new Date(d["read_time"]).format("yyyy-MM-dd");
      }
      $("#info .info .chapters tbody").append(stringFormatByDict(list_html, d));
    } else if (window.prefix == "cb") {
      let d = {};
      let list = lists[i];
      let data = list_fun["cm"](list);
      data["img"] = data["img"].replace("prefix=cb", "prefix=cm");
      data["url"] = "/?prefix=cm#t=info&v=" + list["_id"];
      let cm_card_html = $("#temp .temp-list-cb").html();

      $("#info .info .cards").append(stringFormatByDict(cm_card_html, data));
    } else if (window.prefix == "lf") {
      let d = {};
      let list = lists[i];
      let html = "<tr>";
      html += `<td>${getDefaultFromDict(list, "ep", "")}</td>`;
      html += `<td>${getDefaultFromDict(list, "type", "")}</td>`;
      html += `<td>${getDefaultFromDict(list, "dpi", "")}</td>`;
      html += `<td>${getDefaultFromDict(list, "mask", "")}</td>`;
      html += `<td>${getDefaultFromDict(list, "device", "")}</td>`;
      html += "</tr>";
      let tr = $(html);
      tr.attr("id", list["_id"]);
      tr.css("cursor", "pointer");
      tr.on("click", function () {
        // let id = $(this).attr("id");
        // let video_url = `response?prefix=${window.prefix}&type=file&id=${id}`;
        // console.log(video_url);
        // SetHistory(window.info_data["_id"]);
        // createVideoPlayer(video_url);
        let emby_url = window.info_data["emby_url"];
        let series = window.info_data["series"];
        if (series.length > 0) {
          let id = series[0]["id"];
          let server_id = series[0]["server_id"];
          for (let i in series) {
            if (series[i]["media_name"].indexOf("破解") >= 0) {
              id = series[i]["id"];
              server_id = series[i]["server_id"];
            }
          }
          if (isMobileBrowser()) {
            emby_url = `emby://items/serverId=${server_id}&itemId=${id}`;

            window.open(emby_url);
          } else {
            emby_url = `${emby_url}/web/index.html#!/item?id=${id}&serverId=${server_id}`;
            window.open(emby_url);
          }
          // http://ainizai0904.asuscomm.com:8074/

          // emby_url = `emby://items?serverId=${server_id}&itemId=${id}`;
          // window.open(emby_url);
        }

        //let data =await fetchApi("response", "POST", {"prefix": window.prefix ,"type": "data", "url": url, "link_type": "link2"});
      });
      $("#info .info .chapters tbody").append(tr);
    }
  }

  if (window.prefix == "av") {
    let stars = getDefaultFromDict(lists, "stars", []);
    let pics = getDefaultFromDict(lists, "pics", []);
    let star_html = $("temp.temp-stars").html();
    let pic_html = $("temp.temp-pics").html();
    for (let s in stars) {
      let star = stars[s];
      $("#info .info .stars").append(stringFormatByDict(star_html, star));
    }
    for (let p in pics) {
      let pic = pics[p];
      $("#info .info .tags .list-inline").append(
        stringFormatByDict(pic_html, { pic: pic }),
      );
    }
  } else if (window.prefix == "jv") {
    let stars = getDefaultFromDict(lists, "stars", []);
    let tag_html =
      "<li><a href=\"javascript:setTag('{tag_id}', '{tag_name}')\">{tag_name}</a></li>";
    for (let s in stars) {
      let star = stars[s];
      let tag = { tag_id: star["StarName"], tag_name: star["StarName"] };
      $("#info .info .stars").append(stringFormatByDict(tag_html, tag));
    }
  } else if (window.prefix == "ty") {
    let stars = getDefaultFromDict(lists, "stars", []);
    let pics1 = getDefaultFromDict(lists, "pics1", []);
    let pics2 = getDefaultFromDict(lists, "pics2", []);
    let star_html = $("temp.temp-stars").html();
    let pic_html = $("temp.temp-pics").html();
    for (let s in stars) {
      let star = stars[s];
      $("#info .info .stars").append(stringFormatByDict(star_html, star));
    }
    for (let p in pics1) {
      let pic = pics1[p];
      $("#info .info .pics1").append(
        stringFormatByDict(pic_html, { pic: pic }),
      );
    }
    for (let p in pics2) {
      let pic = pics2[p];
      $("#info .info .pics2").append(
        stringFormatByDict(pic_html, { pic: pic }),
      );
    }
  }
}

async function boomark(mark) {
  let id = window.info_data["_id"];
  let data = await fetchApi("response", "GET", {
    type: "bookmark",
    id: id,
    mark: mark,
    prefix: window.prefix,
  });
  toastr.success(data["msg"], "成功");

  if (data["bookmark"] == 1) {
    $("#info .btn-bookmark").removeClass("btn-info");
    $("#info .btn-bookmark").addClass("btn-success");
    $("#info .btn-bookmark span").html("已收藏");
    $("#info .btn-bookmark").attr("onclick", "javascript:boomark(0);");
  } else {
    $("#info .btn-bookmark").removeClass("btn-success");
    $("#info .btn-bookmark").addClass("btn-info");
    $("#info .btn-bookmark span").html("加入收藏");
    $("#info .btn-bookmark").attr("onclick", "javascript:boomark(1);");
  }
}

function buildSearch() {
  //建立search标签的事件
  $("search").click(function () {
    let search = $(this);
    let key = search.attr("key");
    let value = search.html();
    let type = search.attr("type");
    let search_text = "";
    if (type == null || type == "")
      search_text = stringFormatByDict("@{key}:{value}", {
        key: key,
        value: value,
      });
    else if (type == "search") search_text = value;
    else
      search_text = stringFormatByDict("@{key}:${type}-{value}", {
        key: key,
        value: value,
        type: type,
      });
    $(".search-input").val(search_text);
    $(".search").addClass("search-open");
  });
}

async function videoPlayer(url) {
  //$(".info .post-single-image img").hide();
  //$(".info .post-single-image video").show();
  $("body, html").stop().animate({
    scrollTop: 0,
  });
  if (window.prefix == "tk") {
    let data = await fetchApi("response", "POST", {
      prefix: window.prefix,
      type: "data",
      url: url,
      link_type: "link2",
    });
    if ("url" in data) {
      // $(".info .post-single-image video source").attr("src", data["url"]);
      $(".info .post-single-image img").hide();
      $(".info .post-single-image video").show();

      // 获取video元素
      var video = document.getElementById("myVideo");
      // 设置视频链接
      video.src = data["url"];
      // 加载视频
      video.load();

      $(".info .post-single-image video")[0].play();
    }
  } else {
    $(".info .post-single-image video").attr("src", url);
    $(".info .post-single-image video")[0].play();
  }
}

async function clearHistory(id) {
  $(".chapters .read").removeClass("read");
  if (window.prefix == "cm" || window.prefix == "bk" || window.prefix == "mg" || window.prefix == "bs") {
    //直接刷新page
    window.web_tools.startInfo([id], ["info"], function(data) {
      let info = data["info"];
      if (info.length > 0) {
        let id = info[0]["_id"];
        if (id == window.info_data["_id"] && info[0]["complete"] == "True") {
          getInfo(window.info_id);
        }
      }
    });
  }
}

function addNails(count) {
  let html = $("temp.temp-nail").html();
  for (let i = 1; i <= count; i++) {
    let src = buildUrlParamByDict("response", {
      prefix: this.prefix,
      type: "nail",
      id: window.info_id,
      page: i,
    });
    let h = stringFormatByDict(html, { page: i, url: src });
    h = h.replace('src="/static/images/wait.gif"', 'src="' + src + '"');
    $("#info .info .pics").append(h);
  }
  if (window.prefix == "jb") {
    $("div.pics div").attr("class", "col-lg-6 col-sm-12 mb-2");
  }

}

async function infoLoad(data) {
  //info加载完成事件
  let id = data["_id"];

  if (window.prefix == "ex") {
    //ex 直接刷新page
    window.web_tools.startPage([id], ["info"], pageCallBack);
  } else if (window.prefix == "tk") {
    window.web_tools.startNail([id], ["info"], nailCallBack);
    window.web_tools.startPage([id], ["info"], pageCallBack);
  } else if (window.prefix == "jv") {
    window.web_tools.startNail([id], ["info"], nailCallBack);
  } else if (window.prefix == "jb") {
    window.web_tools.startNail([id], ["info"], nailCallBack);
  }

  //插入历史记录
  if (["jb", "cb", "tk", "lf"].includes(window.prefix)) {
    SetHistory(id);
  }
}

async function pageCallBack(data) {
  if (window.prefix == "ex") {
    // 获取nail
    //window.web_tools.startNail([])
    let info = data["info"];
    if (info.length > 0) {
      let id = info[0]["_id"];
      if (id == window.info_data["_id"] && info[0]["complete"] == "True") {
        //window.web_tools.startNail([id], ["info"], nailCallBack);
      }
    }
  } else if (window.prefix == "tk") {
    let info = data["info"];
    if (info.length > 0) {
      let id = info[0]["_id"];
      if (id == window.info_data["_id"] && info[0]["complete"] == "True") {
        let videos = info[0]["video"];
        $(".info .infotk").empty();
        for (let key in videos) {
          let url = "";
          url = videos[key];
          url = getTkVideoUrl(url);
          let temp = $("temp.temp-player-button-tk").html();
          $(".info .infotk").append(
            stringFormatByDict(temp, { pixed: key, video: url }),
          );
        }
        $(".info .btn-player").click(async function () {
          let video = $(this).attr("video");

          let real_url_data = await fetchApi("response", "POST", {
            prefix: window.prefix,
            type: "realurl",
            url: video,
          });
          if (
            "status" in real_url_data &&
            real_url_data["status"] == "success"
          ) {
            let real_url = real_url_data["url"];
            createVideoPlayer(real_url);
          } else {
            toastr.error("获取视频真实地址错误");
          }
        });
      }
    }
  }
}

function nailCallBack(data) {
  let info = data["info"];
  for (let i in info) {
    let item = info[i];
    if (item["complete"] == "True") {
      let id = item["_id"];
      if (id == window.info_data["_id"]) {
        let page = item["page"];
        let src = buildUrlParamByDict("response", {
          prefix: this.prefix,
          type: "nail",
          id: id,
          page: page,
        });
        if (
          $("#info .info .pics")
            .find("img[page='" + page + "']")
            .attr("src") != src
        ) {
          $("#info .info .pics")
            .find("img[page='" + page + "']")
            .attr("src", src);
        }
      }
    }
  }
}

async function bindBilibiliManga(aid, url){
    let data = await fetchApi("response", "GET", {
      prefix: window.prefix,
      type: "bind",
      url: url,
      aid: aid,
    });
    toastr.info(data["msg"]);
}

async function getBilibiliManga(aid) {
  let title = await showPrompt("请输入漫画名称或直接输入对应bilibili漫画网址:", [], window.info_data["title"]);

  if(title.indexOf("http")==0){
    bindBilibiliManga(aid, title);
  }
  else{
    let data1 = await fetchApi("response", "GET", {
      prefix: window.prefix,
      type: "bilibilimanga",
      t: "search",
      v: title,
    });;
  if(data1){
    if("data" in data1){
      let manga_list = data1["data"];
      let manga_titles = [];
      for(let i in manga_list){
        let manga = manga_list[i];
        manga_titles.push(manga["real_title"]);
      }
      if(manga_titles.length>0){
        let manga_index = await showPrompt("请选择漫画", manga_titles, "1");
        if(manga_index){
          let manga_id = 0;
          if(isInteger(manga_index)){
            let index = parseInt(manga_index) - 1;
            let manga = manga_list[index];
            manga_id = manga["id"];
          }

          if(manga_id == 0){
            toastr.error("请选择正确的漫画");
          }
          else{
            console.log(manga_id);
            let url = "https://manga.bilibili.com/detail/mc" + manga_id;
            bindBilibiliManga(aid, url);
          }
        }
      }
    }
    else{
      toastr.error("获取bilibli漫画失败");
    }
  }



  }

  // let url = await showPrompt("请输入bilibli漫画网址:", [], "");
  // if (url) {
  //   info = {
  //     prefix: window.prefix,
  //     type: "bind",
  //     url: url,
  //     aid: aid,
  //   };
  //   let data = await fetchApi("response", "POST", info);
  //
  //   toastr.info(data["msg"]);
  // }
  // else{
  //   toastr.info("请输入正确的网址");
  // }
}

function createVideoPlayer(videoLink) {
  var videoContainer = document.createElement("div");
  videoContainer.id = "videoContainer";

  var videoPlayer = document.createElement("video");
  videoPlayer.src = videoLink;
  videoPlayer.controls = true;
  videoPlayer.play();

  var closeButton = document.createElement("span");
  closeButton.id = "closeButton";
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener("click", function () {
    document.body.removeChild(videoContainer);
  });

  videoContainer.appendChild(videoPlayer);
  videoContainer.appendChild(closeButton);

  // 添加视频容器到页面的 body 元素中
  document.body.appendChild(videoContainer);
}

function downManhua(id) {
  console.log(id);

  window.web_tools.startDown([id], ["info"], null);
}

function infoImgLoad(){
  $("#info img").each(function(){
    let thumb_img = $(this);
    let id = thumb_img.attr("id");
    let thumb_load = thumb_img.attr("thumb_load");
    if(thumb_load == 2){
      let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": id});
      thumb_img.attr("src", src);
    }
    else if(thumb_load == 3){
        let src = buildUrlParamByDict("response", {"prefix": window.prefix, "type": "thumb", "id": id, "thumbmodel": "fanart"});
        thumb_img.attr("src", src);
    }
    else if(thumb_load == "10" || thumb_load == 10){
        thumb_img.attr("src", thumb_img.attr("data-original"));
    }

  });

 
}
