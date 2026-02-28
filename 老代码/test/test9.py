import re

# 给定的字符串
input_str = "('e 9(){2 6=4;2 5=\'a\';2 7=\"g://j.h.f/1/b/4\";2 3=[\"/c.8\",\"/k.8\"];o(2 i=0;i<3.l;i++){3[i]=7+3[i]+\'?6=4&5=a&m=\'}n 3}2 d;d=9();',25,25,'||var|pvalue|10523|key|cid|pix|jpg|dm5imagefun|a114a8c27b6a8e67cf6cdce6bd86cabc|75|1_4315||function|com|https|yymanhua||image|2_6292|length|uk|return|for'.split('|'),0,{}))"

# 定义正则表达式模式
pattern = r"\('([^']*)',(\d+),(\d+),'([^']*)',(\d+),({.*})\)"

# 使用正则表达式进行匹配
match = re.search(pattern, input_str)

if match:
    param1 = match.group(1)
    param2 = int(match.group(2))
    param3 = int(match.group(3))
    param4 = match.group(4).split('|')
    param5 = int(match.group(5))
    param6 = match.group(6)

    print("参数1:", param1)
    print("参数2:", param2)
    print("参数3:", param3)
    print("参数4:", param4)
    print("参数5:", param5)
    print("参数6:", param6)
else:
    print("没有找到匹配的参数")
