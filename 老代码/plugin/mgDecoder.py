# @by HSSLC
# @Date: 2020.5.30
# 重制，参考自 https://github.com/HSSLC/manhuagui-dlr 中的trans.py parse.py
import re
import json
from lzstring import LZString as lz
import base64
import lzstring
from lxml import etree


def infoGet(tree):
    encode_view = tree.xpath(".//input[@id='__VIEWSTATE']/@value")
    encode_view = encode_view[0] if len(encode_view) >0 else None
    if encode_view != None:
        # 解码并解压缩字符串
        x = lzstring.LZString()
        decompressed = x.decompressFromBase64(encode_view)
        decompressed = f"<html><body>{decompressed}</body></html>"

        return etree.HTML(decompressed)
    else:
        return None


def get(text):
    m = re.match(r'^.*\}\(\'(.*)\',(\d*),(\d*),\'([\w|\+|\/|=]*)\'.*$', text)

    data = decode(m.group(1), int(m.group(2)), int(m.group(3)), lz.decompressFromBase64(m.group(4)).split('|'))
    e = data['sl']['e']
    m = data['sl']['m']
    images = []
    # host = "https://eu.hamreus.com"
    path = data["path"]
    for i, img in enumerate(data["files"]):
        images.append({"id": i + 1, "image": f"{path}{img}?e={e}&m={m}"})
    return images



def decode(function, a, c, data):
    def e(c):
        return ('' if c < a else e(int(c / a))) + [tr(c % a, 36), chr(c % a + 29)][c % a > 35]

    def tr(value, num):
        tmp = itr(value, num)
        return '0' if tmp == '' else tmp

    def itr(value, num):
        d = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        return '' if value <= 0 else itr(int(value / num), num) + d[value % num]

    c -= 1
    d = dict()
    while c + 1:
        d[e(c)] = [data[c], e(c)][data[c] == '']
        c -= 1
    pieces = re.split(r'(\b\w+\b)', function)
    js = ''.join([d[x] if x in d else x for x in pieces]).replace('\\\'', '\'')
    return json.loads(re.search(r'^.*\((\{.*\})\).*$', js).group(1))


"""
Original javascript code as reference

    function(p, a, c, k, e, d) {
        e = function(c) {
            return (c < a ? "" : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
        };
        if (!''.replace(/^/, String)) {
            while (c--) d[e(c)] = k[c] || e(c);
            k = [function(e) {
                return d[e]
            }];
            e = function() {
                return '\\w+'
            };
            c = 1;
        };
        while (c--)
            if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
        return p;
    }
"""
