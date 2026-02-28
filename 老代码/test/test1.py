from crawler.cmCrawlerProcess import CmCrawlerProcess, CmInfoCrawlerProcess, CmThumbCrawlerProcess, CmPageCrawlerProcess, CmImagesCrawlerProcess, CmCommentsCrawlerProcess
from crawler.tkCrawlerProcess import *
from crawler.avCrawlerProcess import *
from crawler.jbCrawlerProcess import *
from crawler.bkCrawlerProcess import *
from crawler.mgCrawlerProcess import *
from crawler.exCrawlerProcess import *
from crawler.cbCrawlerProcess import *
from crawler.bsCrawlerProcess import *
from crawler.exCrawlerProcess import *

from crawler.ymCrawlerProcess import *
from networking import proxy

from crawler.jvCrawlerProcess import *
import requests


c = CmCrawlerProcess({}, run_type="for")
# c.page = 1
# c.page_count = 30
c.setCrawlerData(c.getCrawlerDataById(["685ae3b014aa1cd9cd03aa9d"]))
# c.setCrawlerData(c.getCrawlerDataById(["65a22a2bf2345190f01ad09d"]))
# c.setCrawlerData(c.getCrawlerDataById(["675229801bd679ad71c6d946"]))

# c = MgCrawlerProcess({})

# c.setCrawlerData(c.getCrawlerDataById(["672dcb45d713842db8062050"]))
# c.setCrawlerData([{"aid": 279429}])


# c.setIndexSearch("黒髪", 1)

# c = ExPageCrawlerProcess({})
# c.use_proxy = False
# c = BkCommentsCrawlerProcess({})
# c.use_proxy = True
# c.setCrawlerData(c.getCrawlerDataById(["FLAV-346"]))
c.run()



# https://tktube.com/get_file/30/63b27721cde069842bdd251c4b3f4b2e9a863561b5/145000/145745/145745_480p.mp4/
# https://tktube.com/get_file/30/e5771140e9cb9c76fab2fed9ba6140b709077f31b6/145000/145745/145745_720p.mp4/?rnd=1702895378566
# https://tktube.com/get_file/30/2b94fd2c4ec271d16b3227db6e53b0489a863561b5/145000/145745/145745_480p.mp4


# url = 'https://avmoo.online/cn'
# resp = requests.get(url, proxies=proxy.getMyProxies())
# print(resp.text)