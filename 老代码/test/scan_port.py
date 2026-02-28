import socket


def scan_port(ip, port):
    af = socket.AF_INET
    if ":" in ip:
        af = socket.AF_INET6
    sock = socket.socket(af, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((ip, port))
    sock.close()
    return result == 0



def main():
    # 输入域名
    domain = "6.comp.ainizai0904.top"
    try:
        # 使用 getaddrinfo 进行解析
        result = socket.getaddrinfo(domain, None)
        ip = result[0][4][0]
        print(f"{domain} 的 IP 地址是 {ip}")
    except socket.gaierror:
        print("无法解析域名")

    # 输入起始端口和结束端口
    start_port = 15000
    end_port = 15010

    print(f"正在扫描 {ip} 从端口 {start_port} 到 {end_port}...")

    # 遍历指定范围内的端口
    for port in range(start_port, end_port + 1):
        if scan_port(ip, port):
            print(f"端口 {port} 是开放的")
        else:
            print(f"端口 {port} 是关闭的")


if __name__ == "__main__":
    main()
