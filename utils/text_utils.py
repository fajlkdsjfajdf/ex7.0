"""
文本处理工具模块
提供简繁转换、分词、HTML清理等功能
"""

import re
import jieba
from zhconv import convert


def to_jianti(data):
    """
    转换为简体中文

    Args:
        data: 字符串、列表或字典

    Returns:
        转换后的简体中文内容
    """
    if isinstance(data, list):
        return [to_jianti(d) for d in data]
    if isinstance(data, dict):
        return {key: to_jianti(value) for key, value in data.items()}
    if isinstance(data, str):
        return convert(data, "zh-cn")
    return data


def replace_punctuation_with_space(text):
    """将标点符号替换为空格"""
    import string

    cn_punctuation = "！？｡。＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟&#12336;〾〿–—''‛""„‟…‧﹏."
    for punctuation in string.punctuation:
        text = text.replace(punctuation, ' ')
    for punctuation in cn_punctuation:
        text = text.replace(punctuation, ' ')
    text = text.strip()
    return text


def remove_special_elements(arr):
    """移除只包含标点、表情或数字的元素，只保留中文"""
    pattern = re.compile(r'^[\u4e00-\u9fff]+$')
    return [s for s in arr if pattern.match(s)]


def jieba_cut(text):
    """使用jieba分词"""
    cut = jieba.cut_for_search(text)
    arr = []
    for t in cut:
        arr.append(replace_punctuation_with_space(t))
    return arr


def cn_part(text, jf=True):
    """
    中文分词

    Args:
        text: 待分词文本
        jf: 是否先转换为简体（默认True）

    Returns:
        分词结果列表
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


def remove_html_tags_regex(html_content):
    """
    移除HTML标签，保留纯文本

    Args:
        html_content: HTML内容

    Returns:
        清理后的纯文本
    """
    # 移除 <script> 和 <style> 标签及其内容
    cleaned = re.sub(r'<(script|style).*?>.*?</\1>', '', html_content, flags=re.DOTALL)
    # 移除其他 HTML 标签
    cleaned = re.sub(r'<.*?>', ' ', cleaned)
    # 合并多个空格并去除首尾空白
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def clean_comment_content(content):
    """
    清理评论内容：移除HTML标签、转换为简体、去除多余空白

    Args:
        content: 原始评论内容

    Returns:
        清理后的评论内容
    """
    # 移除HTML标签
    cleaned = remove_html_tags_regex(content)
    # 转换为简体
    cleaned = to_jianti(cleaned)
    # 去除首尾空白
    cleaned = cleaned.strip()
    return cleaned
