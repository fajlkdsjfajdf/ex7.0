from start import tool_flask
from control import webControl, crawlerControl



if __name__ == '__main__':

    webControl.getWebControl()
    crawlerControl.getCrawlerControl()
    tool_flask.run()