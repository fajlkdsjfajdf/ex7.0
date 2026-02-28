from xml.dom.minidom import Document
import datetime

import PyRSS2Gen

class XmlBuild:
    def __init__(self):
        self.doc = Document()  # 创建DOM


    def bulid(self, **kwargs):
        self._getData(**kwargs)
        rss = self.doc.createElement('rss')
        rss.setAttribute('version', '2.0')
        channel = self.doc.createElement('channel')
        rss.appendChild(channel)
        self.doc.appendChild(rss)

        # channel
        channel.appendChild(self._createEle("title", self.title, True))
        channel.appendChild(self._createEle("link", self.link))
        channel.appendChild(self._createEle("description", self.description, True))
        channel.appendChild(self._createEle("language", self.language))
        channel.appendChild(self._createEle("copyright", ""))
        channel.appendChild(self._createEle("managingEditor", ""))
        channel.appendChild(self._createEle("webMaster", ""))
        channel.appendChild(self._createEle("generator", self.generator))
        # channel.appendChild(self._createEle("ttl", "60"))
        channel.appendChild(self._createEle("lastBuildDate", datetime.datetime.now()))
        # items

        for i in self.items:
            item = self.doc.createElement('item')
            item.appendChild(self._createEle("title", i["title"], True))
            item.appendChild(self._createEle("link", i["link"]))
            item.appendChild(self._createEle("description", i["description"], True))
            # <enclosure length="24342715344" type="application/x-bittorrent" url="https://kp.m-team.cc/download.php?id=531643&passkey=449d09972fb9c84c745ec7cc8492e43b&https=1"/>

            item.appendChild(self._createEle("enclosure", "", True,  {"url": i["enclosure"]}))
            channel.appendChild(item)




        return self.doc.toprettyxml(indent = '').replace("\n", "")


    def _getData(self, **kwargs):
        self.title = kwargs["title"] if "title" in kwargs  else ""
        self.link = kwargs["link"] if "link" in kwargs  else ""
        self.description = kwargs["description"] if "description" in kwargs  else ""
        self.image = kwargs["image"] if "image" in kwargs else {}
        self.language = kwargs["language"] if "language" in kwargs else ""
        # self.copyright = kwargs["copyright"] if "copyright" in kwargs else ""
        self.generator = kwargs["generator"] if "generator" in kwargs else ""

        self.items = kwargs["items"] if "items" in kwargs else []


    def _createEle(self, key, value , is_cdata = False, options = {}):
        ele = self.doc.createElement(key)
        for option_key in options:
            ele.setAttribute(option_key, options[option_key])
        if value == "" or value == None:
            return ele
        # 对时间格式转换
        if isinstance(value, datetime.datetime):
            value = self._format_date(value)
        if is_cdata:
            txt = self.doc.createCDATASection(value)
        else:
            txt = self.doc.createTextNode(value)
        ele.appendChild(txt)

        return ele

    def _format_date(self, dt):
        """convert a datetime into an RFC 822 formatted date

        Input date must be in GMT.
        """
        # Looks like:
        #   Sat, 07 Sep 2002 00:00:01 GMT
        # Can't use strftime because that's locale dependent
        #
        # Isn't there a standard way to do this for Python?  The
        # rfc822 and email.Utils modules assume a timestamp.  The
        # following is based on the rfc822 module.
        return "%s, %02d %s %04d %02d:%02d:%02d GMT" % (
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dt.weekday()],
            dt.day,
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.month - 1],
            dt.year, dt.hour, dt.minute, dt.second)