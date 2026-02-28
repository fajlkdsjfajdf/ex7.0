
class JavBookTool:
    def __init__(self):
        self.tag_data = {
            290: "高质量VR",
            389: "8K VR",
            300: "连裤袜",
            302: "乳液",
            304: "放尿",
            326: "FHD",
            329: "出轨",
            354: "4k"
        }


    def getTag(self, tag_code):
        if type(tag_code) == str:
            tag_code = int(tag_code)
        if tag_code in self.tag_data:
            return self.tag_data[tag_code]
        # print(f"javbook 未知的tag {tag_code}")
        return tag_code
