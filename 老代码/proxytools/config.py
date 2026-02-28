import warnings
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# 隐藏特定警告
warnings.simplefilter('ignore', InsecureRequestWarning)


key = b"eXV3ZW53ZWkxOTk0"
port = 15002
path = "pfsadlfjsdalfjdsl"

use_v2ray = False
v2ray_proxy = "192.168.2.222:20170"
