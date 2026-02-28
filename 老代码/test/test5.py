import json
from config.configParse import config
import requests

url = "https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc&platform=web&nov=25"
url = "https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc&platform=web"
headers = {
    'authority': 'manga.bilibili.com',
    'accept': 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
}
# headers["cookie"] = 'buvid3=023F692F-F878-F3FF-DEF5-941504182B0F94881infoc; b_nut=1709614894; i-wanna-go-back=-1; b_ut=7; _uuid=67251B3D-4386-8852-2B15-81EB7E72C75395350infoc; buvid4=F2E92021-3691-5206-CCC6-C0833D5485C095575-024030505-VJKhLxxcBI2LAgBH0pD3ev3PSA4gRi0t%2BzA1A%2FsCQ3oNbjlzpUs6xF2INc7FdzBI; enable_web_push=DISABLE; rpdid=0zbfVGk4cJ|1PN2eiHg|3Ps|3w1RHmWx; buvid_fp_plain=undefined; header_theme_version=CLOSE; hit-dyn-v2=1; LIVE_BUVID=AUTO8817110872786636; DedeUserID=6363793; DedeUserID__ckMd5=8011dcf0946e12fc; FEED_LIVE_VERSION=V_WATCHLATER_PIP_WINDOW3; is-2022-channel=1; CURRENT_BLACKGAP=0; PVID=1; fingerprint=b6a281b5bdf6f5a68a638e134c7b70a2; CURRENT_FNVAL=4048; buvid_fp=b6a281b5bdf6f5a68a638e134c7b70a2; home_feed_column=5; browser_resolution=1920-911; CURRENT_QUALITY=116; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzI5NDczMTMsImlhdCI6MTczMjY4ODA1MywicGx0IjotMX0.EhH57d6tprS28yNdNZZn-C2waQO9Sm66VXaUfo9DZ_0; bili_ticket_expires=1732947253; SESSDATA=0e0f0f20%2C1748240154%2C5b9c3%2Ab2CjDA-7_iIrFZrWwlJep8iuCB4KRK0hPOQmp3V6QBdIqMYXjScsGpPpsapnX58q-rK-ESVmhKTmRNeWYycjJ6Y2dVOVJNQWRtRXcxQ3FNdlFHTWctYWFHb1B4ZG5mUUswMlRua0lldGREazlDMW4tY0VhMEpnRkNidHYydFl3cFRCTzlHbHVZaUNnIIEC; bili_jct=fc8e13b657089896e55a2248cee1fcd9; bp_t_offset_6363793=1004419372510347264; bsource=search_google; Hm_lvt_989d491b1740e624d8db96aa8e9d44c0=1730543999,1731128252,1732853362; HMACCOUNT=65CBB8F4A84D49C4; Hm_lpvt_989d491b1740e624d8db96aa8e9d44c0=1732854158'

data = {"comic_id":26573}
# import json
# data = json.dumps(data)
response = requests.post(url, data, headers=headers, cookies=config.read("BM", "cookies"))
print(response.text)
