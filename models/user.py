"""
用户模型
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from utils.logger import get_logger

logger = get_logger(__name__)


class User:
    """用户模型类"""

    # 集合名
    COLLECTION_NAME = 'users'

    def __init__(self, db):
        """
        初始化用户模型

        Args:
            db: MongoDB数据库实例
        """
        self.db = db
        self.collection = db.get_collection(self.COLLECTION_NAME)

    def create_user(self, username: str, password: str, nickname: str = None,
                    role: str = 'user') -> dict:
        """
        创建用户

        Args:
            username: 用户名
            password: 密码（明文，会自动加密）
            nickname: 昵称
            role: 角色 (admin/user)

        Returns:
            创建的用户信息
        """
        # 检查用户是否已存在
        existing = self.collection.find_one({'username': username})
        if existing:
            return None

        # 加密密码
        password_hash = generate_password_hash(password)

        user_doc = {
            'username': username,
            'password_hash': password_hash,
            'nickname': nickname or username,
            'role': role,
            'created_at': datetime.now(),
            'last_login': None,
            'login_count': 0,
            'status': 'active'
        }

        result = self.collection.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id

        logger.info(f"创建用户成功: {username}")
        return user_doc

    def get_user_by_username(self, username: str) -> dict:
        """
        根据用户名获取用户

        Args:
            username: 用户名

        Returns:
            用户信息（不包含密码）
        """
        user = self.collection.find_one({'username': username})
        return user

    def verify_password(self, username: str, password: str) -> dict:
        """
        验证用户密码

        Args:
            username: 用户名
            password: 密码（明文）

        Returns:
            验证成功返回用户信息，失败返回None
        """
        user = self.collection.find_one({'username': username})

        if not user:
            return None

        # 检查用户状态
        if user.get('status') != 'active':
            logger.warning(f"用户状态异常: {username}, status={user.get('status')}")
            return None

        # 验证密码
        if check_password_hash(user['password_hash'], password):
            # 更新登录信息
            self.collection.update_one(
                {'username': username},
                {
                    '$set': {'last_login': datetime.now()},
                    '$inc': {'login_count': 1}
                }
            )
            return user

        return None

    def update_password(self, username: str, new_password: str) -> bool:
        """
        更新用户密码

        Args:
            username: 用户名
            new_password: 新密码（明文）

        Returns:
            是否成功
        """
        password_hash = generate_password_hash(new_password)

        result = self.collection.update_one(
            {'username': username},
            {'$set': {'password_hash': password_hash}}
        )

        return result.modified_count > 0

    def create_indexes(self):
        """创建索引"""
        try:
            self.collection.create_index('username', unique=True)
            logger.info(f"用户表索引创建成功: {self.COLLECTION_NAME}")
        except Exception as e:
            logger.error(f"创建用户表索引失败: {e}")


class IPBlacklist:
    """IP黑名单模型"""

    COLLECTION_NAME = 'ip_blacklist'

    # 最大尝试次数
    MAX_ATTEMPTS = 5
    # 封禁时间（秒）- 30分钟
    BLOCK_DURATION = 30 * 60

    def __init__(self, db):
        """
        初始化IP黑名单模型

        Args:
            db: MongoDB数据库实例
        """
        self.db = db
        self.collection = db.get_collection(self.COLLECTION_NAME)

    def record_failed_attempt(self, ip: str) -> int:
        """
        记录登录失败尝试

        Args:
            ip: IP地址

        Returns:
            当前失败次数
        """
        now = datetime.now()

        # 查找记录
        record = self.collection.find_one({'ip': ip})

        if record:
            # 检查是否在封禁时间内，如果是则重置计数
            block_until = record.get('block_until')
            if block_until and now > block_until:
                # 封禁已过期，重置计数
                self.collection.update_one(
                    {'ip': ip},
                    {
                        '$set': {
                            'attempts': 1,
                            'last_attempt': now,
                            'block_until': None
                        }
                    }
                )
                return 1

            # 增加失败次数
            new_attempts = record['attempts'] + 1
            update_data = {
                'attempts': new_attempts,
                'last_attempt': now
            }

            # 如果达到最大次数，设置封禁时间
            if new_attempts >= self.MAX_ATTEMPTS:
                update_data['block_until'] = datetime.fromtimestamp(
                    now.timestamp() + self.BLOCK_DURATION
                )

            self.collection.update_one(
                {'ip': ip},
                {'$set': update_data}
            )

            return new_attempts
        else:
            # 创建新记录
            self.collection.insert_one({
                'ip': ip,
                'attempts': 1,
                'last_attempt': now,
                'block_until': None
            })
            return 1

    def is_blocked(self, ip: str) -> tuple:
        """
        检查IP是否被封禁

        Args:
            ip: IP地址

        Returns:
            (is_blocked, remaining_seconds): 是否封禁，剩余封禁时间（秒）
        """
        record = self.collection.find_one({'ip': ip})

        if not record:
            return False, 0

        block_until = record.get('block_until')
        if not block_until:
            return False, 0

        now = datetime.now()
        if now < block_until:
            remaining = (block_until - now).total_seconds()
            return True, int(remaining)

        # 封禁已过期
        return False, 0

    def clear_attempts(self, ip: str):
        """
        清除IP的失败记录（登录成功后调用）

        Args:
            ip: IP地址
        """
        self.collection.delete_one({'ip': ip})

    def create_indexes(self):
        """创建索引"""
        try:
            self.collection.create_index('ip', unique=True)
            self.collection.create_index('block_until')
            logger.info(f"IP黑名单表索引创建成功: {self.COLLECTION_NAME}")
        except Exception as e:
            logger.error(f"创建IP黑名单表索引失败: {e}")
