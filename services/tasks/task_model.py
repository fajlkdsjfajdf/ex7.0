"""
任务数据模型
定义三桶架构中使用的任务结构
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional
import uuid


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"         # 等待执行（已入桶）
    PROCESSING = "processing"   # 执行中
    COMPLETED = "completed"     # 成功完成
    FAILED = "failed"           # 失败
    TIMEOUT = "timeout"         # 超时
    CANCELLED = "cancelled"     # 已取消


class TaskType(Enum):
    """任务类型"""
    # 页面爬虫
    LIST_PAGE = "list_page"          # 列表页
    INFO_PAGE = "info_page"          # 信息页
    CONTENT_PAGE = "content_page"    # 内容页（章节页）
    COMMENT_PAGE = "comment_page"    # 评论页（可选）

    # 图片爬虫
    COVER_IMAGE = "cover_image"      # 封面图片
    THUMBNAIL_IMAGE = "thumbnail_image"  # 缩略图
    CONTENT_IMAGE = "content_image"  # 内容图片


class TaskPriority(Enum):
    """任务优先级"""
    HIGH = 1      # 高优先级（前台请求）
    MEDIUM = 2    # 中优先级
    LOW = 3       # 低优先级（后台定时任务）


class TaskSource(Enum):
    """任务来源"""
    FRONTEND = "frontend"    # 前台用户请求
    SCHEDULED = "scheduled"  # 后台定时任务
    MANUAL = "manual"        # 手动触发


@dataclass
class Task:
    """任务数据类"""

    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    task_type: TaskType = TaskType.LIST_PAGE
    priority: TaskPriority = TaskPriority.HIGH
    source: TaskSource = TaskSource.FRONTEND

    # 任务参数
    params: Dict[str, Any] = field(default_factory=dict)

    # 任务状态
    status: TaskStatus = TaskStatus.PENDING
    progress: float = 0.0  # 进度 0-100

    # 任务结果
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    # 时间戳
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # 重试信息
    retry_count: int = 0
    max_retries: int = 3

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'task_id': self.task_id,
            'task_type': self.task_type.value,
            'priority': self.priority.value,
            'source': self.source.value,
            'params': self.params,
            'status': self.status.value,
            'progress': self.progress,
            'result': self.result,
            'error': self.error,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """从字典创建任务"""
        return cls(
            task_id=data['task_id'],
            task_type=TaskType(data['task_type']),
            priority=TaskPriority(data['priority']),
            source=TaskSource(data['source']),
            params=data.get('params', {}),
            status=TaskStatus(data['status']),
            progress=data.get('progress', 0.0),
            result=data.get('result'),
            error=data.get('error'),
            created_at=datetime.fromisoformat(data['created_at']),
            started_at=datetime.fromisoformat(data['started_at']) if data.get('started_at') else None,
            completed_at=datetime.fromisoformat(data['completed_at']) if data.get('completed_at') else None,
            retry_count=data.get('retry_count', 0),
            max_retries=data.get('max_retries', 3)
        )


@dataclass
class TaskResult:
    """任务结果"""

    task_id: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    file_path: Optional[str] = None  # 图片文件路径
    url: Optional[str] = None        # 资源URL
    metadata: Dict[str, Any] = field(default_factory=dict)  # 额外元数据

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'task_id': self.task_id,
            'success': self.success,
            'data': self.data,
            'error': self.error,
            'file_path': self.file_path,
            'url': self.url,
            'metadata': self.metadata
        }
