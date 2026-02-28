# 使用官方的 Python 3.10 镜像作为基础镜像
FROM python:3.10

# 设置工作目录
WORKDIR /app

# 将当前目录下的 requirements.txt 文件复制到容器中的 /app 目录
COPY requirements.txt .

# 安装依赖
# RUN pip install --no-cache-dir -r requirements.txt


RUN pip install --upgrade pip  -i https://pypi.tuna.tsinghua.edu.cn/simple
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 暴露端口（如果有需要的话）
# EXPOSE 8080

# 设置启动命令（如果有需要的话）
# CMD ["python", "app.py"]
