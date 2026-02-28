"""
前台展示路由
"""
from flask import render_template, redirect, url_for, session, request, g
from blueprints.frontend import frontend_bp


@frontend_bp.route('/')
def index():
    """首页 - 重定向到列表页"""
    return redirect(url_for('frontend.list_page'))


@frontend_bp.route('/login.html')
def login():
    """登录页"""
    if 'user_id' in session:
        return redirect(url_for('frontend.list_page'))
    return render_template('login.html')


@frontend_bp.route('/list.html')
def list_page():
    """列表页

    【参数说明】
    - site: 站点ID（如 "cm"），可选，默认为 "cm"
    - page: 页码，可选，默认为1

    【特殊处理】
    允许没有任何参数，作为默认主页跳转目标
    """
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    # 【列表页特例】允许没有参数，使用默认值
    # 这是为了方便作为默认主页跳转目标
    site_id = request.args.get('site', 'cm')
    page = request.args.get('page', '1')

    g.current_site_id = site_id
    g.current_site_name = '成人漫画'  # 简化处理

    # 如果没有传递任何参数（或者只有site参数），重定向到完整的URL
    # 这样可以确保URL一致性，避免 /list.html 和 /list.html?site=cm 两种形式并存
    if not request.args.get('site'):
        return redirect(url_for('frontend.list_page', site='cm', page=1))

    return render_template('list.html',
                         current_site_id=g.current_site_id,
                         current_site_name=g.current_site_name)


@frontend_bp.route('/info.html')
def info_page():
    """详情页

    【必须参数】禁止使用默认值，缺少参数时返回错误：
    - site: 站点ID（如 "cm"）
    - aid: 漫画ID（整数）
    """
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    # 【严格参数校验】site 和 aid 参数必须存在
    site_id = request.args.get('site')
    aid = request.args.get('aid')

    missing_params = []
    if not site_id:
        missing_params.append('site')
    if not aid:
        missing_params.append('aid')

    if missing_params:
        return f"缺少必要参数: {', '.join(missing_params)}<br>请提供完整URL: /info.html?site=cm&aid=xxx", 400

    g.current_site_id = site_id
    g.current_site_name = '成人漫画'  # 简化处理

    return render_template('info.html',
                         aid=aid,
                         current_site_id=site_id,
                         current_site_name='成人漫画')


@frontend_bp.route('/read.html')
def read_page():
    """阅读页

    【必须参数】禁止使用默认值，缺少参数时返回错误：
    - site: 站点ID（如 "cm"）
    - aid: 漫画ID（整数）
    - pid: 章节ID（整数）
    """
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    # 【严格参数校验】site、aid 和 pid 参数必须存在
    site_id = request.args.get('site')
    aid = request.args.get('aid')
    pid = request.args.get('pid')

    missing_params = []
    if not site_id:
        missing_params.append('site')
    if not aid:
        missing_params.append('aid')
    if not pid:
        missing_params.append('pid')

    if missing_params:
        return f"缺少必要参数: {', '.join(missing_params)}<br>请提供完整URL: /read.html?site=cm&aid=xxx&pid=xxx", 400

    g.current_site_id = site_id
    g.current_site_name = '成人漫画'  # 简化处理

    return render_template('read.html',
                         aid=aid,
                         pid=pid,
                         current_site_id=site_id,
                         current_site_name='成人漫画')


@frontend_bp.route('/cm/')
def site_list():
    """CM站点列表页（带站点前缀）"""
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    g.current_site_id = 'cm'
    g.current_site_name = '成人漫画'

    return render_template('list.html',
                         current_site_id='cm',
                         current_site_name='成人漫画')


@frontend_bp.route('/cm/comic/<int:aid>')
def site_info(aid):
    """CM站点详情页"""
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    return render_template('info.html',
                         aid=aid,
                         current_site_id='cm',
                         current_site_name='成人漫画')


@frontend_bp.route('/cm/read/<int:aid>/<int:pid>')
def site_read(aid, pid):
    """CM站点阅读页"""
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    return render_template('read.html',
                         aid=aid,
                         pid=pid,
                         current_site_id='cm',
                         current_site_name='成人漫画')


@frontend_bp.route('/settings.html')
def settings_page():
    """设置页"""
    # 临时：跳过登录验证以便测试
    # if 'user_id' not in session:
    #     return redirect(url_for('frontend.login'))

    return render_template('settings.html')
