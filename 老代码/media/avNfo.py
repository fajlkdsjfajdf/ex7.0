#!user/bin/env python
# -*- coding: UTF-8 -*-

from util import typeChange


def get_data(data, key, back_key=""):
    if key in data:
        return data[key]
    elif back_key!="" and back_key in data:
        return data[back_key]
    else:
        return ""



def nfo_bulid(data):
    actors = ""
    if data["actors"] != None:
        for actor in data["actors"]:
            actors += f'''          
            <actor>
                <name>{actor['StarName']}</name>
                <type>Actor</type>
            </actor>
            '''
    genres = ""
    if "tags" in data:
        for tag in data["tags"]:
            tag = typeChange.toJianti(tag)
            genres += f'''<genre>{tag}</genre>'''

    return f'''<?xml version="1.0" encoding="utf-8" standalone="yes"?>
    <tvshow>

        <lockdata>false</lockdata>
        <title>{get_data(data, 'name')}</title>
        {actors}
        <releasedate>{get_data(data, 'releasedate')}</releasedate>
        {genres}
        <season>-1</season>
        <episode>-1</episode>
        <displayorder>aired</displayorder>
    </tvshow>
    '''

