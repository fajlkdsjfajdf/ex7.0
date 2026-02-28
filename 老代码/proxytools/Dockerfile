# 使用python3.10作为基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 复制当前文件夹下的auth.py, config.py, proxyServer.py到/app目录下
COPY auth.py config.py proxyServer.py /app/

# 安装requirements.txt中的依赖
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 获取环境变量PORT，如果没有则默认为15002
ENV PORT=${PORT:-15002}

# 容器启动时运行gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:$PORT", "proxyServer:app"]
