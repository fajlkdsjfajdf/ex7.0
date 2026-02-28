"""
数据库索引维护脚本

功能：
1. 创建必要的唯一索引
2. 清理重复数据

建议：在业务低峰期运行此脚本
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from utils.logger import get_logger
import traceback

logger = get_logger(__name__)


def create_indexes():
    """创建必要的唯一索引"""
    db = get_db()

    indexes_to_create = [
        # cm_manga_main - aid 唯一索引
        {
            'collection': 'cm_manga_main',
            'keys': [('aid', 1)],
            'options': {'unique': True, 'background': True},
            'description': 'aid 唯一索引（漫画主表）'
        },
        # cm_manga_chapters - (aid, pid) 组合唯一索引
        {
            'collection': 'cm_manga_chapters',
            'keys': [('aid', 1), ('pid', 1)],
            'options': {'unique': True, 'background': True},
            'description': '(aid, pid) 组合唯一索引（章节表）'
        },
    ]

    results = []

    for index_config in indexes_to_create:
        collection_name = index_config['collection']
        keys = index_config['keys']
        options = index_config['options']
        description = index_config['description']

        try:
            collection = db.get_collection(collection_name)

            # 检查索引是否已存在
            index_name = '_'.join([f"{k[0]}_{k[1]}" for k in keys])
            existing_indexes = collection.index_information()

            if index_name in existing_indexes:
                logger.info(f"索引已存在: {collection_name}.{index_name}")
                results.append({
                    'collection': collection_name,
                    'index': index_name,
                    'status': 'already_exists'
                })
                continue

            # 创建索引
            collection.create_index(keys, **options)
            logger.info(f"索引创建成功: {collection_name}.{index_name}")
            results.append({
                'collection': collection_name,
                'index': index_name,
                'status': 'created'
            })

        except Exception as e:
            error_msg = f"创建索引失败: {collection_name}.{index_name}, error={e}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            results.append({
                'collection': collection_name,
                'index': index_name,
                'status': 'failed',
                'error': str(e)
            })

    return results


def clean_duplicates_main():
    """清理 cm_manga_main 表的重复 aid 数据"""
    db = get_db()
    collection = db.get_collection('cm_manga_main')

    # 查找重复的 aid
    pipeline = [
        {'$group': {'_id': '$aid', 'count': {'$sum': 1}, 'docs': {'$push': '$_id'}}},
        {'$match': {'count': {'$gt': 1}}}
    ]

    duplicates = list(collection.aggregate(pipeline))

    if not duplicates:
        logger.info("cm_manga_main 没有重复数据")
        return 0

    logger.info(f"cm_manga_main 发现 {len(duplicates)} 个重复 aid")

    deleted_count = 0

    for dup in duplicates:
        aid = dup['_id']
        doc_ids = dup['docs']

        # 对于每个重复的 aid，保留有 cover_file_id 的文档
        docs = list(collection.find({'aid': aid}))

        # 按优先级排序：有 cover_file_id 的优先
        def sort_key(x):
            cover_priority = 1 if x.get('cover_file_id') else 0
            list_update = x.get('list_update')
            # 使用时间戳排序，如果没有时间戳使用 _id
            time_key = list_update if list_update else x.get('_id')
            # 时间越新越优先（但需要转换为一个可比较的值）
            return (-cover_priority, time_key if isinstance(time_key, str) else str(time_key))

        docs_sorted = sorted(docs, key=sort_key, reverse=False)

        # 保留第一个，删除其他的
        to_keep = docs_sorted[0]['_id']
        to_delete = [d['_id'] for d in docs_sorted[1:]]

        if to_delete:
            result = collection.delete_many({'_id': {'$in': to_delete}})
            deleted_count += result.deleted_count
            logger.info(f"  aid={aid}: 删除 {result.deleted_count} 个重复文档，保留 _id={to_keep}")

    logger.info(f"cm_manga_main 清理完成，共删除 {deleted_count} 个重复文档")
    return deleted_count


def clean_duplicates_chapters():
    """清理 cm_manga_chapters 表的重复 (aid, pid) 数据"""
    db = get_db()
    collection = db.get_collection('cm_manga_chapters')

    # 查找重复的 (aid, pid) 组合
    pipeline = [
        {'$group': {'_id': {'aid': '$aid', 'pid': '$pid'}, 'count': {'$sum': 1}, 'docs': {'$push': '$_id'}}},
        {'$match': {'count': {'$gt': 1}}}
    ]

    duplicates = list(collection.aggregate(pipeline))

    if not duplicates:
        logger.info("cm_manga_chapters 没有重复数据")
        return 0

    logger.info(f"cm_manga_chapters 发现 {len(duplicates)} 个重复 (aid, pid) 组合")

    deleted_count = 0

    for dup in duplicates:
        aid = dup['_id']['aid']
        pid = dup['_id']['pid']
        doc_ids = dup['docs']

        # 对于每个重复的 (aid, pid)，保留 content_loaded 最大的
        docs = list(collection.find({'aid': aid, 'pid': pid}))

        docs_sorted = sorted(docs, key=lambda x: (
            x.get('content_loaded', 0),  # content_loaded 最大的优先
            x.get('content_update') or x.get('info_update'),
        ), reverse=True)

        to_keep = docs_sorted[0]['_id']
        to_delete = [d['_id'] for d in docs_sorted[1:]]

        if to_delete:
            result = collection.delete_many({'_id': {'$in': to_delete}})
            deleted_count += result.deleted_count
            logger.info(f"  aid={aid}, pid={pid}: 删除 {result.deleted_count} 个重复文档")

    logger.info(f"cm_manga_chapters 清理完成，共删除 {deleted_count} 个重复文档")
    return deleted_count


def main():
    """主函数"""
    logger.info("=" * 50)
    logger.info("开始数据库索引维护")
    logger.info("=" * 50)

    # 1. 先清理重复数据
    logger.info("\n[步骤 1] 清理重复数据")
    main_deleted = clean_duplicates_main()
    chapters_deleted = clean_duplicates_chapters()

    # 2. 创建索引
    logger.info("\n[步骤 2] 创建唯一索引")
    results = create_indexes()

    # 3. 总结
    logger.info("\n" + "=" * 50)
    logger.info("索引维护完成")
    logger.info(f"  cm_manga_main 删除: {main_deleted} 个重复文档")
    logger.info(f"  cm_manga_chapters 删除: {chapters_deleted} 个重复文档")
    logger.info(f"  索引创建结果: {len([r for r in results if r['status'] == 'created'])} 个创建，{len([r for r in results if r['status'] == 'already_exists'])} 个已存在，{len([r for r in results if r['status'] == 'failed'])} 个失败")
    logger.info("=" * 50)

    return {
        'main_deleted': main_deleted,
        'chapters_deleted': chapters_deleted,
        'index_results': results
    }


if __name__ == '__main__':
    main()
