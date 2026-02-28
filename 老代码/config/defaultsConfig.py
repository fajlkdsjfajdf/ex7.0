# 用于获取一些默认的配置
from config.configParse import config


def getOrder(prefix):
    # 获取默认的排序
    order = config.read(prefix.upper(), "order")
    if order:
        return order[0]["order_field"]
    else:
        return None

def getOrderType(prefix, order_field=None):
    # 获取默认的排序 正序还是倒叙
    order = config.read(prefix.upper(), "order")
    if  order:
        if not order_field:
            return order[0]["order_type"]
        else:
            for o in order:
                if order_field == o["order_field"]:
                    return o['order_type']
    else:
        return None
    return 1