# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：
   Description :   各种类型修改
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""

import re
from zhconv import convert
import io
from bson import ObjectId
from urllib.parse import urlparse, urlunparse
import xml.etree.ElementTree as ET
import unicodedata
import os
from datetime import datetime
import string
import ipaddress
import hashlib
import jieba
import json
import requests
from requests.cookies import RequestsCookieJar

def strToMd5(input_string):
    """
    字符串转md5
    Args:
        input_string:

    Returns:

    """
    # 创建一个md5对象
    md5_object = hashlib.md5()
    # 更新对象以包含输入字符串的字节表示
    md5_object.update(input_string.encode('utf-8'))
    # 获取十六进制格式的MD5哈希值
    md5_hash = md5_object.hexdigest()
    return md5_hash


def extract_url(text):
    # 定义一个更全面的正则表达式模式来匹配URL
    url_pattern = re.compile(r'https?://[^\s/$.?#].[^\s)]*')
    # 使用findall方法找到所有匹配的URL
    urls = url_pattern.findall(text)
    if urls:
        return urls[0]

    return ""

def convertId(string):
    """
    判断字符串能否转化成id 或者 objectid
    Args:
        string:
    Returns:
    """
    try:
        # 尝试将字符串转换为整数
        _ = int(string)
        return _
    except ValueError:
        try:
            # 尝试将字符串转换为ObjectId类型
            _ = ObjectId(string)
            return _
        except Exception:
            return False



def allStrip(data):
    # log.logPrint(type(data))
    if type(data) == list:
        data2 = []
        for d in data:
            data2.append(allStrip(d))
        return data2
    elif type(data) == str :
        data = data.strip()
        return data
    else:
        data = str(data)
        return allStrip(data)


def vstack(id, *args):
    """
    合并字典数组并去除重复项
    :param id 指定判断重复的列
    :return:
    """
    dict = {}
    for list in args:
        for item in list:
            if id in item and item[id] not in dict:
                dict[item[id]] = item
    data = []
    for key in dict:
        data.append(dict[key])
    return data

def splitList(list_collection, n):
    """
    将集合均分，每份n个元素
    :param list_collection:
    :param n:
    :return:返回的结果
    """
    list = []
    for i in range(0, len(list_collection), n):
        list.append(list_collection[i: i + n])
    return list

def isInList(list, key, value):
    """
    判断某个值是否在数组的字典中
    :param list:
    :param key:
    :param value:
    :return:返回的结果
    """
    for item in list:
        if value == item[key]:
            return True
    return False

def findnum(string):
    if type(string) == list:
        string = ''.join(string)
    comp=re.compile(r"\d+\.?\d*")
    list_str=comp.findall(string)
    list_num=[]
    for item in list_str:
        item = item.strip('.')
        if "." not in item:
            item = int(item)
        else:
            item = float(item)
        list_num.append(item)
    if len(list_num) >0:
        return list_num[0]
    else:
        return 0


def toJianti(data):
    """
    转换简体
    :param data:
    :return:返回的结果
    """
    if type(data) == list:
        new_data = []
        for d in data:
            new_data.append(toJianti(d))
        return new_data
    if type(data) == dict:
        new_data = {}
        for key in data.keys():
            new_data[key] = toJianti(data[key])
        return new_data
    if type(data) == str or 'Unicode' in str(type(data)):
        return convert(data, "zh-cn")

    return data

def toFanti(data):
    """
    转换繁体
    :param data:
    :return:返回的结果
    """
    if type(data) == list:
        new_data = []
        for d in data:
            new_data.append(toJianti(d))
        return new_data
    if type(data) == dict:
        new_data = {}
        for key in data.keys():
            new_data[key] = toJianti(data[key])
        return new_data
    if type(data) == str or 'Unicode' in str(type(data)):
        return convert(data, "zh-tw")
    return data



def cleanSearchText(text):
    replace_char = ["(", ")", "\'", "\"", "[", "]", "{", "}"]
    for c in replace_char:
        text = text.replace(c, "")

    return text

def capitalizeFirstLetter(text):
    """
    首字母大写
    :param text:
    :return:
    """

    if type(text) == list:
        data = []
        for t in text:
            data.append(capitalizeFirstLetter(t))
        return data
    else:
        if len(text) > 1:
            text = text[0].upper() + text[1:].lower()
        return text

def convertUrl(url):
    """
    对url进行处理
    """
    if str(url).endswith("/"):
        url = url[:-1]
    if not str(url).startswith("http://") and not str(url).startswith("https://"):
        url = f"https://{url}"
    return url

def getHost(url):
    """
    从url转换成host
    """
    url = url.replace("https://", "").replace("http://", "")
    url = url.replace("/", "")
    host = {"host": url}
    return host

def getDomain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return f"https://{domain}"

def extractPathFromUrl(url):
    """
    url去除前面的域名部分，只保留后面部分
    Args:
        url:

    Returns:

    """
    # 解析URL
    parsed_url = urlparse(url)
    # 重新组合URL，只保留域名后面的内容
    new_url = urlunparse(('', '', parsed_url.path, parsed_url.params, parsed_url.query, parsed_url.fragment))
    return new_url


def isNumber(s):
    """
    isNumber
    判断是否为数字
    :return:
    """

    try:
        float(s)
        return True
    except Exception:
        pass

    try:

        unicodedata.numeric(s)
        return True
    except Exception:
        pass

    return False

def arrayChangeInt(array):
    """
    arrayChangeInt
    将数组中所有值转换为int类型
    :return:
    """

    new_array = []
    for a in array:
        if str(a).isdigit():
            new_array.append(int(a))
        else:
            new_array.append(a)
    return new_array

def sortFile(s):
    keys = s.split("/")
    kk = []
    for k in keys:
        k = re.sub("\D", "", k)
        k = int(k) if(k != "") else 0
        kk.append(k)
    return kk

def listSort(array):
    sort_type = "int"
    for s in array:
        if str(s).isdigit() == False:
            sort_type = "string"
            break
    if sort_type == "int":
        array = [{"sort": int(x), "value": x} for x in array]
    else:
        array = [{"sort": x, "value": x} for x in array]
    array = sorted(array, key=lambda x: x["sort"])
    return [str(x["value"]) for x in array]


def cleanJson(data):
    # 由于json中不能用ObjectId 之类的类型, 所有把所有不是int, float , string , double的类型全部转换成string
    if type(data) == list:
        new_data = []
        for d in data:
            new_data.append(cleanJson(d))
        return new_data
    if type(data) == dict:
        new_data = {}
        for key in data.keys():
            new_data[key] = cleanJson(data[key])
        return new_data
    if type(data) not in [str, float, int]:
        return str(data)
    return data

def convertBytesIO(data):
    if isinstance(data, bytes):
        return io.BytesIO(data)
    else:
        return data



def get_image_type(data):
    if not isinstance(data, bytes):
        if isinstance(data, io.BytesIO):
            data = data.getvalue()
        else:
            return  "unknown"

    # 定义jpg、png、gif的魔数
    jpg_magic_number = b'\xFF\xD8\xFF'
    png_magic_number = b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A'
    gif_magic_number = [b'GIF87a' , b'GIF89a']

    # 检查jpg魔数
    if data.startswith(jpg_magic_number):
        return 'jpg'
    # 检查png魔数
    elif data.startswith(png_magic_number):
        return 'png'
    # 检查gif魔数
    elif data.startswith(gif_magic_number[0]) or data.startswith(gif_magic_number[1]):

        return 'gif'
    else:
        return 'unknown'


def set_gif_loop(data):
    if not isinstance(data, bytes):
        if isinstance(data, io.BytesIO):
            data = data.getvalue()
        else:
            return  data

    if data[:6] not in [b'GIF89a', b'GIF87a']:
        return data

    # 获取循环控制字节的位置
    loop_pos = 6 + data[6] * 3
    # 判断循环控制字节的值
    if data[loop_pos:loop_pos+2] == b'\x01\x00':
        # 如果值为0x01，则修改为0x00
        data[loop_pos:loop_pos+2] = b'\x00\x00'
        print('Loop count changed to infinite')

    return data



def convertObjectId(data):
    try:
        # 由于json中不能用ObjectId 之类的类型, 所有把所有不是int, float , string , double的类型全部转换成string
        if type(data) == list:
            new_data = []
            for d in data:
                new_data.append(convertObjectId(d))
            return new_data
        if type(data) == dict:
            new_data = {}
            for key in data.keys():
                new_data[key] = convertObjectId(data[key])
            return new_data
        return ObjectId(data)
    except:
        return None

def arraySplitPage(array, page_number, page_size):
    # 将数组分页， 并获取指定页
    start_index = (page_number - 1) * page_size
    end_index = start_index + page_size
    return array[start_index:end_index]

def checkValueInDictList(data, key, value):
    for item in data:
        if item[key] == value:
            return True
    return False

def xmlToDict(xml_str):

    xml_str = xml_str.decode("utf-8")
    xml_str = xml_str.replace("\\n", "")

    # print(xml_str)
    root = ET.fromstring(xml_str)
    return {root.tag: xmlParseElement(root)}

def xmlParseElement(element):
    if len(element) == 0:
        return element.text
    result = {}
    for child in element:
        child_data = xmlParseElement(child)
        if child.tag in result:
            if not isinstance(result[child.tag], list):
                result[child.tag] = [result[child.tag]]
            result[child.tag].append(child_data)
        else:
            result[child.tag] = child_data
    return result

def getFileName(s):
    if os.path.isfile(s):
        file_name = os.path.basename(s)
        if file_name:
            return file_name
        else:
            return None
    elif os.path.isdir(s):
        return None
    else:
        file_name = os.path.basename(s)
        if file_name:
            return file_name
        else:
            return None

def getFileNameNoExt(s):
    s = getFileName(s)
    if s:
        return s.split('.')[0]
    return None

def getBaseName(file_path):
    parent_dir = os.path.dirname(file_path)
    parent_folder_name = os.path.basename(parent_dir)
    return parent_folder_name

def getFileExt(s):
    return s.split('.')[-1]

def removeBlankLines(text):
    lines = text.splitlines()
    filtered_lines = [line for line in lines if line.strip()]
    return '\n'.join(filtered_lines)

def cleanPath(text):
    invalid_chars = "!@#$%^&*()-+=[]{}|;':\",.<>/?`~"
    for char in invalid_chars:
        text = text.replace(char, " ")
    return text


def strToDate(s, default_date="1970-01-01"):
    try:
        date = datetime.strptime(s, "%Y-%m-%d")
        return date
    except ValueError:
        return datetime.strptime(default_date, "%Y-%m-%d")


def getFristElement(tree, xpath, index=0):
    try:
        element = tree.xpath(xpath)[index]  # 获取第一个元素
        return element
    except IndexError:
        return None

def extractFirstDate(s):
    pattern = r'\d{4}-\d{2}-\d{2}'
    match = re.search(pattern, s)
    if match:
        date_str = match.group()
        return datetime.strptime(date_str, '%Y-%m-%d')
    else:
        return None


def listReversed(lst):
    return lst[::-1]




def replace_punctuation_with_space(text):
    cn_punctuation = "！？｡。＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟&#12336;〾〿–—‘’‛“”„‟…‧﹏."
    for punctuation in string.punctuation:
        text = text.replace(punctuation, ' ')
    for punctuation in cn_punctuation:
        text = text.replace(punctuation, ' ')
    text = text.strip()
    return text



def replace_domain(url, new_domain):
    """
    从给定的网址中提取老域名，并将其替换为新域名。

    参数：
    url (str): 需要修改的网址
    new_domain (str): 新的域名

    返回：
    str: 替换后的网址
    """
    new_domain = new_domain.replace("https://", "").replace("http://", "")
    # 解析URL
    parsed_url = urlparse(url)
    # 提取老域名
    old_domain = parsed_url.netloc
    # 使用正则表达式匹配并替换老域名
    pattern = re.compile(re.escape(old_domain), re.IGNORECASE)
    replaced_url = pattern.sub(new_domain, url)
    return replaced_url


def check_ip_type(ip_str):
    try:
        ip = ipaddress.ip_address(ip_str)
        if isinstance(ip, ipaddress.IPv4Address):
            return "ipv4"
        elif isinstance(ip, ipaddress.IPv6Address):
            return "ipv6"
    except ValueError:
        return False


def jieba_cut(text):
    """
    使用jieba分词
    Args:
        text:

    Returns:

    """
    cut = jieba.cut_for_search(text)
    arr = []
    for t in cut:
        arr.append(replace_punctuation_with_space(t))
    return arr


def remove_special_elements(arr):
    # 定义一个正则表达式模式，用于匹配只包含标点符号、表情或阿拉伯数字的字符串
    pattern = re.compile(r'^[\u4e00-\u9fff]+$')

    # 过滤掉匹配该模式的字符串
    filtered_arr = [s for s in arr if pattern.match(s)]

    return filtered_arr

def cn_part(text, jf=True):
    """
    中文分词
    Args:
        text:

    Returns:

    """

    part_arr = []
    if jf:
        text_jt = replace_punctuation_with_space(text)
        part_arr += jieba_cut(text)
        part_arr += jieba_cut(text_jt)
    else:
        text = replace_punctuation_with_space(text)
        part_arr = jieba_cut(text)
    part_arr = list(set(part_arr))
    part_arr = remove_special_elements(part_arr)
    return part_arr


def remove_script_tags(text):
    # 定义正则表达式模式，匹配 <script ...> 到 </script> 之间的内容
    pattern = r'<script.*?>.*?</script>'

    # 使用 re.sub() 函数替换匹配的内容为空字符串
    cleaned_text = re.sub(pattern, '', text, flags=re.DOTALL)

    return cleaned_text

def sort_dict_by_key(input_dict):
    """
    按照key对字典进行排序的函数。

    参数:
    input_dict (dict): 需要排序的字典。

    返回:
    dict: 按键排序后的新字典。
    """
    sorted_keys = sorted(input_dict.keys())
    sorted_dict = {key: input_dict[key] for key in sorted_keys}
    return sorted_dict

def remove_html_tags_regex(html_content):
    # 移除 <script> 和 <style> 标签及其内容
    cleaned = re.sub(r'<(script|style).*?>.*?</\1>', '', html_content, flags=re.DOTALL)
    # 移除其他 HTML 标签
    cleaned = re.sub(r'<.*?>', ' ', cleaned)
    # 合并多个空格并去除首尾空白
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned



def cookies_to_str(cookies: RequestsCookieJar) -> str:
    """将 RequestsCookieJar 转为可存储的字符串"""
    return json.dumps(cookies.get_dict())

def str_to_cookies(cookies_str: str) -> RequestsCookieJar:
    """将字符串还原为 RequestsCookieJar"""
    return requests.utils.cookiejar_from_dict(json.loads(cookies_str))


