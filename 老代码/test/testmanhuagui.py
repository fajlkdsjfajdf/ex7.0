
import requests

url = "https://www.manhuagui.com/comic/4736/"

r = requests.get(url)
print(r.text)