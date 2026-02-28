# docker run -d -p 15002:15002 --restart=always --name proxytool proxytool


docker run -d -it -p 15002:15002 --restart=always --name proxytool -v /root/proxytools:/proxy python:3.10-slim bash /proxy/start.sh
