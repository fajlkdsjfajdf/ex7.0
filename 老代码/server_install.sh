# 装docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
systemctl start docker
# 装portainer
docker run -d --name="portainer"  --restart=always -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock 6053537/portainer-ce
# 装ddns
docker run -d --name ddns-go --restart=always --net=host -v /root/ddns-go:/root jeessy/ddns-go
# 装socks5代理
docker run -d --name socks5  --restart=always --net=host -e PROXY_PORT=15001 -e PROXY_USER=ainizai0904 -e PROXY_PASSWORD=eXV3ZW53ZWkxOTk0 serjs/go-socks5-proxy
# 装flask代理
docker run -d --name proxy --restart=always --net=host -v /root/proxytools:/proxy 	python:3.10-slim bash /proxy/start.sh
# 装flask 桥接代理
docker run -d --name proxy-bridge --restart=always -p:15102:15002 -v /root/proxytools:/proxy 	python:3.10-slim bash /proxy/start.sh

# 装nginx-proxy-manager
docker run -d --name nginx --restart=always -p 80:80 -p 18081:81 -p 443:443 -v /root/nginx/data:/data -v /root/nginx/letsencrypt:/etc/letsencrypt docker.io/jc21/nginx-proxy-manager:latest
docker run -d --name nginx --restart=always -p 8072:80 -p 18081:81 -p 8071:443 -v /root/nginx/data:/data -v /root/nginx/letsencrypt:/etc/letsencrypt docker.io/jc21/nginx-proxy-manager:latest
# 装trojan 注意要添加配置 pass
# docker run -d --name trojan --restart=always -p 9877:9877 -v /root/v2ray:/etc/v2ray -v /root/nginx/letsencrypt:/etc/ssl teddysun/v2ray


docker run -d --name=v2ray --restart=always -p 9877:80 -v /data/conf/v2ray:/etc/v2ray:rw -v /data/conf/caddy:/etc/caddy:rw -v /data/ssl:/data/caddy/certificates:rw -e DOMAIN=wx.ainizai0904.top anerg/v2ray:latest

# cloudflare token
L1ClhJwWQqbg7bZXmS6FBurt_q_SyMN9fLIRd7NB


协议 (protocol) 	= vless
地址 (address) 		= 74.48.192.164
2607:f130:0:171::7eed:75
端口 (port) 		= 443
用户ID (id) 		= 3b78c9a4-750f-4b16-a774-4250598cd527
传输协议 (network) 	= ws
伪装域名 (host) 	= www.ainizai0904.top
路径 (path) 		= /pfsadlfjsdalfjdsl
传输层安全 (TLS) 	= tls


协议 (protocol) 	= vless
地址 (address) 		= 74.48.74.88
2607:f130:0:186::a723:983f
端口 (port) 		= 443
用户ID (id) 		= e4bab269-c442-4851-b79e-b05fcc70811d
传输协议 (network) 	= ws
伪装域名 (host) 	= ainizai0904.top
路径 (path) 		= /pfsadlfjsdalfjdsl
传输层安全 (TLS) 	= tls

