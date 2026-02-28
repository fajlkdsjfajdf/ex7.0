import xml.etree.ElementTree as ET
class NfoTool:
    def __init__(self, xml_file):
        self.tree = ET.parse(xml_file)
        self.root = self.tree.getroot()
        self.xml_dict = {}

    def parseElement(self, element, parent_dict):
        tag = element.tag
        if tag not in parent_dict:
            parent_dict[tag] = {}
        # parent_dict[tag].append({})
        for child in element:
            self.parseElement(child, parent_dict[tag])
        if element.text and element.text.strip():
            if tag in parent_dict and len(parent_dict[tag])> 0:
                if type(parent_dict[tag]) != list:
                    v = parent_dict[tag]
                    parent_dict[tag] = [v]
                parent_dict[tag].append(element.text.strip())
            else:
                parent_dict[tag]= element.text.strip()


    def toDict(self):
        self.parseElement(self.root, self.xml_dict)

        return self.xml_dict