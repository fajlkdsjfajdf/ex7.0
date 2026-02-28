pip install flask -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install requests[socks] -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install pycryptodome -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install gunicorn -i https://pypi.tuna.tsinghua.edu.cn/simple
cd /proxy
# python proxyServer.py
gunicorn --log-level debug -w 4 -b [::]:15002 proxyServer:app