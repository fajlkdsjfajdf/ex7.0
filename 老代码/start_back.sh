#!/usr/bin/env bash

# 获取当前脚本所在目录的绝对路径
#SCRIPT=$(readlink -f "$0")
#BASE_DIR=$(dirname "$SCRIPT")
#python $BASE_DIR/start.py
# 安装依赖


pip install --upgrade pip  -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install -r /start/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install tls_client -i https://pypi.tuna.tsinghua.edu.cn/simple
#pip install --upgrade pip
#pip install -r /start/requirements.txt
# 启动

echo "Executing commands for all"
python /start/run_back.py

echo "执行完毕，请按下回车键退出..."
read