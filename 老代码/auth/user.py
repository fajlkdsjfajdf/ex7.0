# 用户验证
import datetime

from flask import Flask, jsonify, render_template, send_file, redirect, make_response, flash
from flask_login import LoginManager, current_user, login_user, logout_user, login_required, UserMixin
from db.mongodb import MongoDB
from logger.logger import logger
from config.configParse import config
from bson.objectid import ObjectId
import time
import hmac
import hashlib


blacklist = {}
MAX_ATTEMPTS = 3 # 最大登录错误次数

class User(UserMixin):
    """
    flask_login 的用户定义类
    """

    def __init__(self, id):
        self.id = id

    def get_id(self):
        """
        返回用户id
        :return:
        """
        return self.id

class Login:
    def __init__(self, request):
        self.request = request
        self.db = MongoDB()
        self.SECRET_KEY = config.read("setting", "aes_key")

    def check_blacklist(self):
        ip = self.request.remote_addr
        if ip in blacklist and  blacklist[ip]['attempts'] >= MAX_ATTEMPTS:
            return True
        else:
            return False

    def login(self):
        next = '/'  # 登陆后的跳转页面凭据
        if self.request.args.get("next"):
            next = self.request.args.get("next")
        if self.request.method == "GET" and current_user.is_authenticated: # 用户已认证
            return redirect("/")
        if self.request.method == 'POST' and len(next) > 0:
            try:
                username = self.request.form["username"].strip()
                password = self.request.form["password"].strip()
                ip = self.request.remote_addr
                # 从数据库中获取指定用户并判定密码
                data = self.db.getItem("user", {"username": username})
                if data and "password" in data and data["password"] == password:
                    # 登录成功
                    user = User(data["_id"])
                    login_user(user, remember=True)
                    logger.info(f"用户 {username} 登录成功")
                    return redirect(next)
                else:
                    # 登录失败

                    if ip not in blacklist:
                        blacklist[ip] = {'attempts': 0, 'last_attempt': time.time()}
                    else:
                        blacklist[ip]['attempts'] += 1
                        blacklist[ip]['last_attempt'] = time.time()
                    if blacklist[ip]['attempts'] >= MAX_ATTEMPTS:
                        return "Your IP is blocked"
                    logger.error(f"登录失败 错误的用户 user:{username} pwd:{password}")
            except Exception as e:
                logger.error(f"账户验证错误 {e}")
        # 啥都没有 返回登录页面
        return render_template("login.html")

    @login_required
    def login_out(self):
        logout_user()
        flash('You have been logged out.', 'success')
        return redirect("/tpw")

    def access_check(self):
        # 判断是否能够不同过认证就获取文件， 只有特定的文件才能被访问
        can_access_urls = config.read("setting", "unpermission_url")
        if self.request.path in can_access_urls:
            return True
        else:
            can_access_urls = [ u  for u in can_access_urls if str(u).endswith("*")]
            for url in can_access_urls:
                url = url[:-1]
                if url in  self.request.path:
                    return True
        return  False

    def check_login(self):
        try:
            # 验证浏览器, 屏蔽一些浏览器
            browser_info = self.request.user_agent
            if "Wechat" in str(browser_info):
                return False
            # 判断是否是不用验证访问的页

            if self.access_check():
                return True
            # 判断是否验证
            if current_user.is_authenticated:
                return True
            logger.warning(f"拒绝了请求 {self.request.path}")
            return False
        except Exception as e:
            logger.error(f"验证登录错误 {e}")
            return False

    # 生成登录 code
    def generate_login_code(self, user_id):

        user_id = str(user_id)
        SECRET_KEY = bytes(self.SECRET_KEY, "ascii")
        timestamp = str(int(time.time()))  # 获取当前时间戳，并转换为字符串
        message = user_id.encode() + timestamp.encode()  # 将用户ID和时间戳拼接成字节序列
        signature = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()  # 计算签名
        token = f'{user_id}.{timestamp}.{signature}'  # 将用户ID、时间戳和签名拼接成令牌
        return token

    # 解析并验证登录 code
    def parse_login_code(self, login_code):
        try:
            SECRET_KEY = bytes(self.SECRET_KEY, "ascii")

            parts = login_code.split('.')  # 将令牌拆分为不同的部分
            if len(parts) != 3:
                return False, 0  # 令牌格式无效
            user_id, timestamp, signature = parts
            # 验证签名
            message = user_id.encode() + timestamp.encode()
            expected_signature = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()
            if signature != expected_signature:
                return False, 0  # 签名验证失败
            # 验证时间戳
            current_timestamp = int(time.time())
            if abs(current_timestamp - int(timestamp)) > 24 * 60 * 60:  # 时间戳最多相差60秒
                return False, 0  # 时间戳验证失败
            return True, user_id
        except:
            return False, 0


class UserInfo:
    """
    获取用户具体信息的类
    """
    def __init__(self, user_id):
        self.db = MongoDB()
        self.user_id = self.getUserId(user_id)

    def getUserId(self, user_id):
        # 通过objectid形式的_id 找到对应的id
        try:
            if user_id:
                data = self.db.getItem("user", {"_id": ObjectId(user_id)})
                if data and "id" in data:
                    return int(data["id"])
                else:
                    logger.warning(f"用户id为 {user_id} 没有找到对应的数字id")
                    return None
        except Exception as e:
            logger.warning(f"获取user_id失败 {e}")
        return None

    def getHistory(self, table, page_num=1, limit=50, find=None):
        """
        获取用户的阅读历史
        :param table: 用户历史表的表名
        :param page_num:
        :return: 返回一个objectid 数组
        """
        if not find:
            find = {"user_id": self.user_id}
        else:
            find["user_id"] = self.user_id
        data = self.db.getItems(table,
                                find,
                                skip=(page_num - 1) * 50,
                                limit=limit,
                                order="read_history",
                                order_type=-1)
        item_ids = [ObjectId(item["item_id"]) for item in data]

        data_count = self.db.getCount(table, find)
        return item_ids, data_count

    def getBookmark(self, table, page_num=1, limit=50):
        """
        获取用户的收藏
        :param table: 用户收藏表的表名
        :param page_num:
        :return: 返回一个objectid 数组
        """
        find = {"user_id": self.user_id, "bookmark": 1}
        data = self.db.getItems(table,
                                find,
                                skip=(page_num - 1) * 50,
                                limit=limit,
                                order="_id",
                                order_type=-1)
        item_ids = [ObjectId(item["item_id"]) for item in data]

        data_count = self.db.getCount(table, find)
        return item_ids, data_count

    def getBookmarkById(self, table, id):
        """
        根据id 获取是否被该用户收藏
        Returns:

        """
        try:
            find = {"user_id": self.user_id, "item_id": ObjectId(id)}
            bookmark = self.db.getItem(table, find)
            if bookmark:
                return bookmark["bookmark"]
            else:
                return False
        except Exception as e:
            logger.error(f"获取用户收藏失败{e}")
            return False

    def setBookmarkByid(self, table, id, mark, data={}):
        """
        设置一本书到收藏
        Args:
            table:
            id:
            data: 额外需要插入的列
        Returns:

        """
        id = ObjectId(id)
        data["user_id"] = self.user_id
        data["item_id"] = id
        data["bookmark"] = mark
        self.db.processItem(table, data, ["user_id", "item_id"])


    def getHistoryById(self, table, id):
        """
        根据id 获取是否被该用户收藏
        Returns:

        """
        try:
            find = {"user_id": self.user_id, "item_id": ObjectId(id)}
            data_history = self.db.getItems(table, find)
            if data_history and len(data_history)> 0:
                return data_history[0]
            else:
                return False
        except Exception as e:
            logger.error(f"获取用户收藏失败{e}")
            return False

    def setHistoryById(self, table, id, list_id=None, data={}):
        """
        设置一本书到历史
        Args:
            table:
            id:
            data: 额外需要插入的列
        Returns:

        """
        id = ObjectId(id)

        data["user_id"] = self.user_id
        data["item_id"] = id
        list_history = {}
        if list_id:
            list_id = str(list_id)
            d = self.db.getItem(table, {"user_id": self.user_id, "item_id": ObjectId(id)})
            if d and "list" in d:
                list_history = d["list"]
            list_history[list_id] = datetime.datetime.now()
        data["read_history"] = datetime.datetime.now()
        if list_history:
            data["list"] = list_history
        self.db.processItem(table, data, ["user_id", "item_id"])


def load_user(user_id):
    # 根据用户 id 加载用户对象
    return User(user_id)