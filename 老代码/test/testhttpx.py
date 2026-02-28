import argparse

def main():
    parser = argparse.ArgumentParser(description="处理IP地址参数")
    parser.add_argument("--ip", help="输入IP地址，格式为1...")
    args = parser.parse_args()

    if args.ip:
        print("传入的IP地址是：", args.ip)
    else:
        print("没有传入IP地址")

if __name__ == "__main__":
    main()
