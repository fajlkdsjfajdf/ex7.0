import requests



url = "https://4.ipw.cn"
url = "https://178.175.132.22/"



headers = {
    "host": "exhentai.org"
}
url = "https://exhentai.org"

#  sk=l1mvcdjm6qn8x043yc37y7uvyv5j; hath_perks=m1.m2.m3.a.t1.t2.t3.p1.p2.s.q-f242e45806; igneous=rux4hlkbyzhn481hv5h

cookies = {"ipb_member_id":"659743","ipb_pass_hash":"be0d9201bc978c65a1de243619d46da0","igneous":"rux4hlkbyzhn481hv5h","sk":"l1mvcdjm6qn8x043yc37y7uvyv5j","u":"659743-0-sw1mwax9zxk","hath_perks":"m1.m2.m3.a.t1.t2.t3.p1.p2.s.q-f242e45806"}

r = requests.get(url, cookies=cookies)
print(r.text)
