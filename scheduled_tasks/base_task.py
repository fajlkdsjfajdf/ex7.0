"""
定时任务基类
所有定时任务都应继承此类
"""

from abc import ABC, abstractmethod


class BaseTask(ABC):
    """定时任务基类"""

    # 任务基本信息
    name = ""  # 任务名称
    description = ""  # 任务描述
    version = "1.0.0"  # 任务版本
    author = ""  # 任务作者

    @abstractmethod
    def execute(self, config):
        """
        执行任务

        Args:
            config: 任务配置参数

        Returns:
            dict: 执行结果
                {
                    'success': bool,  # 是否成功
                    'message': str,  # 结果消息
                    'data': dict  # 返回的数据
                }
        """
        pass

    def validate_config(self, config):
        """
        验证配置参数

        Args:
            config: 任务配置参数

        Returns:
            tuple: (is_valid, error_message)
        """
        return True, ""
