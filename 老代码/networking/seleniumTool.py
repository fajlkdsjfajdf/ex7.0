import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from config.configParse import config

class SeleniumTool:
    def __init__(self, headless=True):
        # chrome的远程地址
        ip = config.read("setting", "db_host")
        port = config.read("setting", "selenium_port")
        show_port = config.read("setting", "selenium_show_port")
        remote_url = f"http://{ip}:{port}/wd/hub"
        self.show_url = f"http://{ip}:{show_port}/?autoconnect=1&resize=scale&password=secret"
        # 设置Chrome选项
        self.chrome_options = Options()
        self.headless = headless
        if headless:
            self.chrome_options.add_argument("--headless")  # 启用无头模式
        self.chrome_options.add_argument("--disable-gpu")  # 如果系统支持GPU加速，则禁用它
        self.chrome_options.add_argument("--window-size=1280x1024")  # 设置窗口大小

        # 创建WebDriver对象，连接到远程服务器上的Chrome浏览器
        self.driver = webdriver.Remote(
            command_executor=remote_url,
            options=self.chrome_options
        )



    def print_check_url(self):
        if not self.headless:
            print(f"check_url:  {self.show_url}")
    def open_url(self, url):
        """打开指定的URL"""
        self.print_check_url()
        self.driver.get(url)

    def get_title(self):
        """获取当前页面的标题"""
        return self.driver.title
    def get_page_text(self):
        """获取当前页面的全部文本内容"""
        return self.driver.find_element_by_tag_name('body').text

    def get_page_content(self):
        """获取当前页面的HTML内容"""
        return self.driver.page_source

    def get_cookies(self):
        """获取当前页面的所有cookies"""
        return self.driver.get_cookies()

    def get_cookies_dict(self):
        """获取当前页面的所有cookies d的字典格式"""
        cookies = self.get_cookies()
        cookies_dict = {cookie['name']: cookie['value'] for cookie in cookies}
        return cookies_dict

    def close_browser(self):
        """关闭浏览器"""
        self.driver.quit()


# 使用示例
if __name__ == "__main__":
    # 实例化SeleniumTool类，并指定远程服务器的URL和是否启用无头模式
    tool = SeleniumTool(headless=False)

    # 打开网页
    tool.open_url('https://www.linovelib.com/novel/3795/220513_2.html')

    # 打印页面标题
    print(tool.get_title())

    print(tool.get_cookies())
    # 关闭浏览器
    tool.close_browser()
