# 这是一个中间工具站, 为所有web_flask服务, 负责查验耗时项目的进度
from config.configParse import config
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from tools.controlTool import ControlTool
import uvicorn


app = FastAPI()

control_tool = ControlTool()



@app.get('/', tags=["网页"])
async def index():
    return RedirectResponse(url="/docs")


@app.post('/start', tags=["工具"])
async def start(data: dict):
    """
    用于启动指定工具的方法。
    - **data**: {
        “prefix”: prefix,
        "tool_type": ["thumb", ]
        “data”: 数据列表
        }
    """
    return control_tool.start(data)

@app.get('/get', tags=["工具"])
async def get(id: str):
    """
    用于获取指定工具运行状态的方法
    - **id**: 唯一id
    """
    return control_tool.get(id)



def run():
    while True:

        uvicorn.run(app,
            host="localhost",
            port=config.read("setting", "tool_port"),
            access_log=False
            )
        print("uvicorn被关闭")


    # app.run("localhost", port=config.read("setting", "tool_port"))
