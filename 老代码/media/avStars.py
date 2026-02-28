# av 演员添加

from db.mongodb import MongoDB
from plugin.embyTool import EmbyTool
from networking.webRequest import WebRequest


def get_pic(url):
    url = url.replace("jbk002", "jbk003")
    print(url)
    web = WebRequest()
    if web.get(url, timeout=5):
        return web.content
    else:
        return None



db = MongoDB()

emby = EmbyTool()
persons = emby.getPersons()
for i, p in enumerate(persons):
    p_id = p["Id"]
    p_name = p["Name"]

    star_info = db.getItem("jb-stars", {"StarName": p_name})
    if star_info:
        if star_info.get("ImgLoad", 0) == 1:
            url = star_info.get("StarPic", "")
            if url:
                img = get_pic(url)
                if img:
                    emby.setItemImgById(p_id, img)
                    print(f"{p_name}上传成功")


    print(f"{i}/{len(persons)}")


