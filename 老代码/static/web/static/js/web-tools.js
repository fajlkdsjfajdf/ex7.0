// ********************* 这是一个调用后台爬虫web tools 的工具包******************

class WebTools{
    /*
    * task_lists的格式如下
    * {
    *   "id": "start后台返回的唯一id",
    *   "include": ["这是一个数组, 包含了当前页面是否需要检查该task"],
    *   "over": "是否执行完成"
    *   "call": "回调函数"
    * }...
    * */
    constructor(prefix) {
        this.prefix = prefix;
        window.task_lists = {};
        setInterval(this.check, 2000);
    }

    async start(type, id_list, include, call_back){
        let url = buildUrlParamByDict("response", {"prefix": this.prefix, "type": type +"check"})
        let data = await fetchApi(url, "POST", {"checkdata": id_list});
        if (data != null && "id" in data) {
            window.task_lists[data["id"]] = {
                "id": data["id"],
                "include": include,
                "over": "False",
                "call": call_back
            };
        }
    }

    async check(){
        //遍历task_list
        for(let id in window.task_lists){
            let task = window.task_lists[id];
            if(task["include"].includes(window.page_type) && task["over"] == "False"){

                let url = buildUrlParamByDict("response", {"prefix": this.prefix, "type": "taskinfo", "id": id});
                if(window.task_lists[id]["run"]) return;

                window.task_lists[id]["run"] = true;
                let data = await fetchApi(url, "GET");
                window.task_lists[id]["run"] = false;
                if(data != null && "status" in data && data["status"]=="success"){
                    if("over" in data["info"] && data["info"]["over"]=="True"){
                        window.task_lists[id]["over"] = "True";
                        print(id + " is over");
                    }
                    // 执行回调
                    let call_back = task["call"];
                    if(call_back){
                        call_back(data["info"]);
                    }
                }
                else if(data != null && "status" in data && data["status"]=="error"){
                    console.log("error" + id);
                    window.task_lists[id]["over"] = "True";
                }
            }
        }
    }

    async startThumb(id_list, include, call_back){
        await this.start("thumb", id_list, include, call_back)
    }

    async startPage(id_list, include, call_back){
        await this.start("page", id_list, include, call_back)
    }

    async startDown(id_list, include, call_back){
        await this.start("down", id_list, include, call_back)
    }

    async startNail(id_list, include, call_back){
        await this.start("nail", id_list, include, call_back)
    }

    async startImage(page_data, include, call_back){
        await this.start("images", page_data, include, call_back)
    }

    async startInfo(id_list, include, call_back){
        await this.start("info", id_list, include, call_back)
    }

    async startComments(id_list, include, call_back){
        await this.start("comments", id_list, include, call_back)
    }

    cleanInfo(){
        //清除所有page 和 info
        let del_task_lists = {}
        for(let id in window.task_lists) {
            let task = window.task_lists[id];
            if(this.checkClean(task["include"], "info") || this.checkClean(task["include"], "page")) {
                del_task_lists[id] = {};
            }
        }

        for(let id in del_task_lists){
            print("删除taskid:" + id);
            delete window.task_lists[id];
        }
    }

    checkClean(arr, key){
        for(let i in arr){
            let v = arr[i];
            if(v == key){
                return true;
            }
        }
        return false;
    }
}
