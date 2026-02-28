/*
    备份用
*/

// ==UserScript==
// @name         Emby danmaku extension
// @description  Emby弹幕插件
// @author       RyoLee
// @version      1.6
// @grant        none
// @match        */web/index.html
// ==/UserScript==

//屏蔽词库
const pb_list = ['中国', '共','岸','武汉','陆', "内地", "党", "习"];
//const api_url = "http://192.168.1.210:18001/";
const api_url = "https://home.ainizai0904.top:8071/";
const api_key = "jjljalksjfidojowenndsklnvjsdoanf";

(async function () {
    'use strict';
    console.log("载入弹幕库");
    let application_name = document.querySelector('meta[name="application-name"]').content;
    console.log(application_name);
    if (['Emby', 'Media Server'].includes(application_name)) {



        // ------ configs start------
        const check_interval = 200;
        const random = (min, max) => +(Math.random() * (max - min) + min).toFixed(0);
        const chConverTtitle = ['当前状态: 未启用', '当前状态: 转换为简体', '当前状态: 转换为繁体'];
        // 0:当前状态关闭 1:当前状态打开
        const danmaku_icon = ['\uE7A2', '\uE0B9'];
        const search_icon = '\uE881';
        const translate_icon = '\uE927';
        const refresh_icon = '\ue863';
        const info_icon = '\uE0E0';
        const local_icon = '\ue2c7';
        const export_icon = '\ue178';
        const autoexport_icon = '\uf03a';
        const with_icon = [ '\ue8f5', '\ue8f4'];
        const buttonOptions = {
            class: 'paper-icon-button-light',
            is: 'paper-icon-button-light',
        };
        //const uiQueryStr = '.btnVideoOsdSettings';
        const uiQueryStr = '.videoOsd-btnPause-autolayout';
        //const uiQueryStr = '.btnVideoOsdSettings';
        //const mediaContainerQueryStr = "div[data-type='video-osd']";
        const mediaContainerQueryStr = "div[class='htmlVideoPlayerContainer'], div[data-type='video-osd'], div[class*='graphicContentContainer']";
        const mediaQueryStr = '.videoOsd-btnPause';
        const mediaVideoPositionStr = '.videoOsdPositionText';
        const mediaVideoTitleStr = '.videoOsdTitle';
        const displayButtonOpts = {
            title: '弹幕开关',
            id: 'displayDanmaku',
            innerText: null,
        };
        const searchButtonOpts = {
            title: '搜索弹幕',
            id: 'searchDanmaku',
            innerText: search_icon,
        };
        const localButtonOpts = {
            title: '本地弹幕',
            id: 'localDanmaku',
            innerText: local_icon,
        };
        const exportButtonOpts = {
            title: '引用弹幕',
            id: 'exportDanmaku',
            innerText: export_icon,
        };
        const autoexportButtonOpts = {
            title: '自动外部引用',
            id: 'autoExport',
            innerText: autoexport_icon,
        };
        const translateButtonOpts = {
            title: null,
            id: 'translateDanmaku',
            innerText: translate_icon,
        };
        const infoButtonOpts = {
            title: '弹幕设置',
            id: 'printDanmakuInfo',
            innerText: info_icon,
        };
        const refreshButtonOpts = {
            title: '重载弹幕',
            id: 'refreshDanmu',
            innerText: refresh_icon,
        };
        const withButtonOpts = {
            title: '外部弹幕',
            id: 'withDanmu',
            innerText: with_icon[0],
        };



        // ------ configs end------
        //引用类


        //上传类
        class XMLUploader {
          constructor(uploadUrl) {
            this.uploadUrl = uploadUrl;
            this.fileInput = null;
          }

          init() {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.style.display = 'none';
            this.fileInput.accept = 'text/xml'; // 限制只能选择 XML 文件
            document.body.appendChild(this.fileInput);
            let self = this;
            this.fileInput.addEventListener('change', function(evt){
                let file = evt.target.files[0];
                let reader = new FileReader();

                reader.onload = function(e) {
                  let xmlContent = e.target.result;
                  self.uploadFile(xmlContent);
                }.bind(this);

                reader.readAsText(file);
            });
          }

          async uploadFile(xmlContent) {
            let xhr = new XMLHttpRequest();
            xhr.onload = function() {
              if (xhr.status === 200) {
                console_log('文件上传成功');
              } else {
                console_log('文件上传失败');
              }
            };

            let data = {
                "id": this.video_id,
                "title": this.animeName,
                "episode": this.episode,
                "xml_content": xmlContent
            };
            let options = {
                method: "POST",
                body: JSON.stringify(data),
                headers: new Headers({
                                'Content-Type': 'application/json'
                              })
            };
            let response = await fetch(this.uploadUrl, options);
            if(response.status == 200){
                let data = await response.json();
                if(this.callback){
                    this.callback(data);
                }
            }
          }

          chooseFile() {
            this.fileInput.click();
          }
          setVideoInfo(item){
            if (item.Type == 'Episode') {
                this.video_id = item.Id;
                this.animeName = item.SeriesName;
                this.episode = item.IndexNumber.toString();
                let session = item.ParentIndexNumber;
                if (session != 1) {
                    this.animeName += ' 第' + session + '季';
                }
                if (session == 0){
                    this.animeName += ' ova';
                }
            } else {
                this.video_id = item.Id;
                this.animeName = item.Name;
                this.episode = 'movie';
            }
          }

          setCallBack(callback){
              this.callback = callback;
          }
        }


        //手机的手动弹幕插件
        (function(global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Danmuku = factory())
        } (this,
           function() {
            'use strict';
            function Timeline(manager) {
                var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                var _manager$opts = manager.opts,
                    limit = _manager$opts.limit,
                    forceRender = _manager$opts.forceRender;
                if (opts.forceRender) {
                    manager.setOptions({
                        limit: Infinity,
                        forceRender: true
                    })
                }
                return {
                    preEmiter: null,
                    timeStore: {},
                    specialTimeStore: {},
                    add: function add(timestamp, cfg, hooks, isForward) {
                        if (!this.timeStore[timestamp]) {
                            this.timeStore[timestamp] = [{
                                cfg: cfg,
                                hooks: hooks,
                                isForward: isForward
                            }]
                        } else {
                            this.timeStore[timestamp].push({
                                cfg: cfg,
                                hooks: hooks,
                                isForward: isForward
                            })
                        }
                    },
                    addSpecial: function addSpecial(timestamp, cfg) {
                        if (!this.specialTimeStore[timestamp]) {
                            this.specialTimeStore[timestamp] = [cfg]
                        } else {
                            this.specialTimeStore[timestamp].push(cfg)
                        }
                    },
                    emit: function emit(timestamp, clearOld) {
                        var ordinaryData = this.timeStore[timestamp];
                        var specialData = this.specialTimeStore[timestamp];
                        if (ordinaryData) {
                            ordinaryData.forEach(function(_ref) {
                                var cfg = _ref.cfg,
                                    hooks = _ref.hooks,
                                    isForward = _ref.isForward;
                                manager.send(cfg, hooks, isForward)
                            })
                        }
                        if (specialData) {
                            manager.sendSpecial(specialData)
                        }
                        if (clearOld) {
                            var clear = function clear(data) {
                                var keys = Object.keys(data);
                                if (keys.length > 0) {
                                    for (var i = 0; i < keys.length; i++) {
                                        var time = keys[i];
                                        if (time < timestamp && data[time]) {
                                            delete data[time]
                                        }
                                    }
                                }
                            };
                            clear(this.timeStore);
                            clear(this.specialTimeStore)
                        }
                    },
                    emitInterval: function emitInterval(timestamp, clearOld) {
                        if (timestamp !== preEmiter) {
                            this.preEmiter = timestamp;
                            this.emit(timestamp, clearOld)
                        }
                    },
                    destroy: function destroy() {
                        this.preEmiter = null;
                        this.timeStore = {};
                        this.specialTimeStore = {};
                        manager.setOptions({
                            limit: limit,
                            forceRender: forceRender
                        })
                    }
                }
            }
            function _classCallCheck(instance, Constructor) {
                if (! (instance instanceof Constructor)) {
                    throw new TypeError("Cannot call a class as a function");
                }
            }
            function _defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor)
                }
            }
            function _createClass(Constructor, protoProps, staticProps) {
                if (protoProps) _defineProperties(Constructor.prototype, protoProps);
                if (staticProps) _defineProperties(Constructor, staticProps);
                return Constructor
            }
            function _slicedToArray(arr, i) {
                return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest()
            }
            function _toArray(arr) {
                return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest()
            }
            function _arrayWithHoles(arr) {
                if (Array.isArray(arr)) return arr
            }
            function _iterableToArray(iter) {
                if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter)
            }
            function _iterableToArrayLimit(arr, i) {
                var _arr = [];
                var _n = true;
                var _d = false;
                var _e = undefined;
                try {
                    for (var _i = arr[Symbol.iterator](), _s; ! (_n = (_s = _i.next()).done); _n = true) {
                        _arr.push(_s.value);
                        if (i && _arr.length === i) break
                    }
                } catch(err) {
                    _d = true;
                    _e = err
                } finally {
                    try {
                        if (!_n && _i["return"] != null) _i["return"]()
                    } finally {
                        if (_d) throw _e;
                    }
                }
                return _arr
            }
            function _nonIterableRest() {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
            function warning(condition, message) {
                if (condition) return;
                throw new Error("Warning: ".concat(message));
            }
            function callHook(hooks, name) {
                var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
                if (hooks && typeof hooks[name] === 'function') {
                    return hooks[name].apply(null, args)
                }
                return null
            }
            function createKey() {
                return Math.random().toString(36).substr(2, 8)
            }
            function toNumber(val) {
                return typeof val === 'number' ? val: typeof val === 'string' ? Number(val.replace('px', '')) : NaN
            }
            function isRange(_ref, val) {
                var _ref2 = _slicedToArray(_ref, 2),
                    a = _ref2[0],
                    b = _ref2[1];
                if (val === a || val === b) return true;
                var min = Math.min(a, b);
                var max = min === a ? b: a;
                return min < val && val < max
            }
            function upperCase(_ref3) {
                var _ref4 = _toArray(_ref3),
                    first = _ref4[0],
                    remaing = _ref4.slice(1);
                return first.toUpperCase() + remaing.join('')
            }
            function timeSlice(len, fn) {
                var i = -1;
                var start = performance.now();
                var run = function run() {
                    while (++i < len) {
                        if (fn() === false) {
                            break
                        }
                        var cur = performance.now();
                        if (cur - start > 13) {
                            start = cur;
                            setTimeout(run);
                            break
                        }
                    }
                };
                run()
            }
            var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : setTimeout;
            function nextFrame(fn) {
                raf(function() {
                    raf(fn)
                })
            }
            var transitionProp = 'transition';
            var transitionEndEvent = 'transitionend';
            var transitionDuration = 'transitionDuration';
            if (window.ontransitionend === undefined && window.onwebkittransitionend !== undefined) {
                transitionProp = 'WebkitTransition';
                transitionEndEvent = 'webkitTransitionEnd';
                transitionDuration = 'webkitTransitionDuration'
            }
            function whenTransitionEnds(node) {
                return new Promise(function(resolve) {
                    var isCalled = false;
                    var end = function end() {
                        node.removeEventListener(transitionEndEvent, onEnd);
                        resolve()
                    };
                    var onEnd = function onEnd() {
                        if (!isCalled) {
                            isCalled = true;
                            end()
                        }
                    };
                    node.addEventListener(transitionEndEvent, onEnd)
                })
            }
            var Barrage = function() {
                function Barrage(itemData, hooks, time, manager, globalHooks) {
                    _classCallCheck(this, Barrage);
                    var RuntimeManager = manager.RuntimeManager;
                    var _manager$opts = manager.opts,
                        direction = _manager$opts.direction,
                        container = _manager$opts.container;
                    this.node = null;
                    this.hooks = hooks;
                    this.paused = false;
                    this.moveing = false;
                    this.data = itemData;
                    this.duration = time;
                    this.isSpecial = false;
                    this.trajectory = null;
                    this.manager = manager;
                    this.direction = direction;
                    this.container = container;
                    this.isChangeDuration = false;
                    this.globalHooks = globalHooks;
                    this.RuntimeManager = RuntimeManager;
                    this.key = itemData.key || createKey();
                    this.position = {
                        y: null
                    };
                    this.timeInfo = {
                        pauseTime: 0,
                        startTime: null,
                        prevPauseTime: null,
                        currentDuration: time
                    };
                    this.create()
                }
                _createClass(Barrage, [{
                    key: "getMovePercent",
                    value: function getMovePercent() {
                        var _this$timeInfo = this.timeInfo,
                            pauseTime = _this$timeInfo.pauseTime,
                            startTime = _this$timeInfo.startTime,
                            prevPauseTime = _this$timeInfo.prevPauseTime;
                        var currentTime = this.paused ? prevPauseTime: Date.now();
                        return (currentTime - startTime - pauseTime) / 1000 / this.duration
                    }
                },
                                       {
                                           key: "getMoveDistance",
                                           value: function getMoveDistance() {
                                               if (!this.moveing) return 0;
                                               var percent = this.getMovePercent();
                                               var containerWidth = this.RuntimeManager.containerWidth + this.getWidth();
                                               return percent * containerWidth
                                           }
                                       },
                                       {
                                           key: "getHeight",
                                           value: function getHeight() {
                                               return this.node && this.node.clientHeight || 0
                                           }
                                       },
                                       {
                                           key: "getWidth",
                                           value: function getWidth() {
                                               return this.node && this.node.clientWidth || 0
                                           }
                                       },
                                       {
                                           key: "getSpeed",
                                           value: function getSpeed() {
                                               var duration = this.timeInfo.currentDuration;
                                               var containerWidth = this.RuntimeManager.containerWidth + this.getWidth();
                                               return duration == null || containerWidth == null ? 0 : containerWidth / duration
                                           }
                                       },
                                       {
                                           key: "create",
                                           value: function create() {
                                               this.node = document.createElement('div');
                                               callHook(this.hooks, 'create', [this, this.node]);
                                               callHook(this.globalHooks, 'barrageCreate', [this, this.node])
                                           }
                                       },
                                       {
                                           key: "append",
                                           value: function append() {
                                               warning(this.container, 'Need container element.');
                                               if (this.node) {
                                                   this.container.appendChild(this.node);
                                                   callHook(this.hooks, 'append', [this, this.node]);
                                                   callHook(this.globalHooks, 'barrageAppend', [this, this.node])
                                               }
                                           }
                                       },
                                       {
                                           key: "remove",
                                           value: function remove(noCallHook) {
                                               warning(this.container, 'Need container element.');
                                               if (this.node) {
                                                   this.container.removeChild(this.node);
                                                   if (!noCallHook) {
                                                       callHook(this.hooks, 'remove', [this, this.node]);
                                                       callHook(this.globalHooks, 'barrageRemove', [this, this.node])
                                                   }
                                               }
                                           }
                                       },
                                       {
                                           key: "deletedInMemory",
                                           value: function deletedInMemory() {
                                               var index = -1;
                                               var trajectory = this.trajectory;
                                               var showBarrages = this.manager.showBarrages;
                                               if (trajectory && trajectory.values.length > 0) {
                                                   index = trajectory.values.indexOf(this);
                                                   if (~index) trajectory.values.splice(index, 1)
                                               }
                                               if (showBarrages && showBarrages.length > 0) {
                                                   index = showBarrages.indexOf(this);
                                                   if (~index) showBarrages.splice(index, 1)
                                               }
                                           }
                                       },
                                       {
                                           key: "destroy",
                                           value: function destroy() {
                                               this.remove();
                                               this.moveing = false;
                                               this.deletedInMemory();
                                               callHook(this.hooks, 'destroy', [this, this.node]);
                                               callHook(this.globalHooks, 'barrageDestroy', [this, this.node]);
                                               this.node = null
                                           }
                                       },
                                       {
                                           key: "pause",
                                           value: function pause() {
                                               if (!this.moveing || this.paused) return;
                                               var moveDistance = this.getMoveDistance();
                                               if (!Number.isNaN(moveDistance)) {
                                                   this.paused = true;
                                                   this.timeInfo.prevPauseTime = Date.now();
                                                   if (this.direction === 'right') {
                                                       moveDistance *= -1
                                                   }
                                                   this.node.style[transitionDuration] = '0s';
                                                   this.node.style.transform = "translateX(".concat(moveDistance, "px)")
                                               }
                                           }
                                       },
                                       {
                                           key: "resume",
                                           value: function resume() {
                                               if (!this.moveing || !this.paused) return;
                                               this.paused = false;
                                               this.timeInfo.pauseTime += Date.now() - this.timeInfo.prevPauseTime;
                                               this.timeInfo.prevPauseTime = null;
                                               var isNegative = this.direction === 'left' ? 1 : -1;
                                               var containerWidth = this.RuntimeManager.containerWidth + this.getWidth();
                                               var remainingTime = (1 - this.getMovePercent()) * this.duration;
                                               this.timeInfo.currentDuration = remainingTime;
                                               this.node.style[transitionDuration] = "".concat(remainingTime, "s");
                                               this.node.style.transform = "translateX(".concat(containerWidth * isNegative, "px)")
                                           }
                                       },
                                       {
                                           key: "reset",
                                           value: function reset() {
                                               this.remove(true);
                                               this.deletedInMemory();
                                               this.paused = false;
                                               this.moveing = false;
                                               this.trajectory = null;
                                               this.position = {
                                                   y: null
                                               };
                                               this.timeInfo = {
                                                   pauseTime: 0,
                                                   startTime: null,
                                                   prevPauseTime: null,
                                                   currentDuration: this.duration
                                               }
                                           }
                                       }]);
                return Barrage
            } ();
            var RuntimeManager = function() {
                function RuntimeManager(opts) {
                    _classCallCheck(this, RuntimeManager);
                    var container = opts.container,
                        rowGap = opts.rowGap,
                        height = opts.height;
                    var styles = getComputedStyle(container);
                    if (!styles.position || styles.position === 'none' || styles.position === 'static') {
                        container.style.position = 'relative'
                    }
                    this.opts = opts;
                    this.rowGap = rowGap;
                    this.singleHeight = height;
                    this.containerElement = container;
                    this.containerWidth = toNumber(styles.width);
                    this.containerHeight = toNumber(styles.height);
                    this.init()
                }
                _createClass(RuntimeManager, [{
                    key: "init",
                    value: function init() {
                        this.container = [];
                        this.rows = parseInt(this.containerHeight / this.singleHeight);
                        for (var i = 0; i < this.rows; i++) {
                            var start = this.singleHeight * i;
                            var end = this.singleHeight * (i + 1) - 1;
                            this.container.push({
                                values: [],
                                gaps: [start, end]
                            })
                        }
                    }
                },
                                              {
                                                  key: "resize",
                                                  value: function resize() {
                                                      var styles = getComputedStyle(this.containerElement);
                                                      this.containerWidth = toNumber(styles.width);
                                                      this.containerHeight = toNumber(styles.height) / 3;
                                                      this.rows = parseInt(this.containerHeight / this.singleHeight);
                                                      var container = [];
                                                      for (var i = 0; i < this.rows; i++) {
                                                          var start = this.singleHeight * i;
                                                          var end = this.singleHeight * (i + 1) - 1;
                                                          var gaps = [start, end];
                                                          if (this.container[i]) {
                                                              this.container[i].gaps = gaps;
                                                              container.push(this.container[i])
                                                          } else {
                                                              container.push({
                                                                  gaps: gaps,
                                                                  values: []
                                                              })
                                                          }
                                                      }
                                                      this.container = container
                                                  }
                                              },
                                              {
                                                  key: "getLastBarrage",
                                                  value: function getLastBarrage(barrages, lastIndex) {
                                                      for (var i = barrages.length - 1; i >= 0; i--) {
                                                          var barrage = barrages[i - lastIndex];
                                                          if (barrage && !barrage.paused) {
                                                              return barrage
                                                          }
                                                      }
                                                      return null
                                                  }
                                              },
                                              {
                                                  key: "getRandomIndex",
                                                  value: function getRandomIndex(exclude) {
                                                      var randomIndex = Math.floor(Math.random() * this.rows);
                                                      return exclude.includes(randomIndex) ? this.getRandomIndex(exclude) : randomIndex
                                                  }
                                              },
                                              {
                                                  key: "getTrajectory",
                                                  value: function getTrajectory() {
                                                      var alreadyFound = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
                                                      if (alreadyFound.length === this.container.length) {
                                                          if (this.opts.forceRender) {
                                                              var _index = Math.floor(Math.random() * this.rows);
                                                              return this.container[_index]
                                                          } else {
                                                              return null
                                                          }
                                                      }
                                                      var index = this.getRandomIndex(alreadyFound);
                                                      var currentTrajectory = this.container[index];
                                                      var lastBarrage = this.getLastBarrage(currentTrajectory.values, 0);
                                                      if (this.rowGap <= 0 || !lastBarrage) {
                                                          return currentTrajectory
                                                      }
                                                      alreadyFound.push(index);
                                                      if (lastBarrage.moveing) {
                                                          var distance = lastBarrage.getMoveDistance();
                                                          var spacing = this.rowGap > 0 ? this.rowGap + lastBarrage.getWidth() : this.rowGap;
                                                          return distance > spacing ? currentTrajectory: this.getTrajectory(alreadyFound)
                                                      }
                                                      return this.getTrajectory(alreadyFound)
                                                  }
                                              },
                                              {
                                                  key: "computingDuration",
                                                  value: function computingDuration(prevBarrage, currentBarrage) {
                                                      var prevWidth = prevBarrage.getWidth();
                                                      var currentWidth = currentBarrage.getWidth();
                                                      var prevSpeed = prevBarrage.getSpeed();
                                                      var currentSpeed = currentBarrage.getSpeed();
                                                      var acceleration = currentSpeed - prevSpeed;
                                                      if (acceleration <= 0) {
                                                          return null
                                                      }
                                                      var distance = prevBarrage.getMoveDistance() - currentWidth - prevWidth;
                                                      var meetTime = distance / acceleration;
                                                      if (meetTime >= currentBarrage.duration) {
                                                          return null
                                                      }
                                                      var remainingTime = (1 - prevBarrage.getMovePercent()) * prevBarrage.duration;
                                                      var currentFixTime = currentWidth * remainingTime / this.containerWidth;
                                                      return remainingTime + currentFixTime
                                                  }
                                              },
                                              {
                                                  key: "move",
                                                  value: function move(barrage, manager) {
                                                      var _this = this;
                                                      var node = barrage.node;
                                                      var prevBarrage = this.getLastBarrage(barrage.trajectory.values, 1);
                                                      node.style.top = "".concat(barrage.position.y, "px");
                                                      return new Promise(function(resolve) {
                                                          nextFrame(function() {
                                                              var width = barrage.getWidth();
                                                              var isNegative = barrage.direction === 'left' ? 1 : -1;
                                                              var containerWidth = _this.containerWidth + width;
                                                              if (prevBarrage && _this.rowGap > 0 && prevBarrage.moveing && !prevBarrage.paused) {
                                                                  var fixTime = _this.computingDuration(prevBarrage, barrage);
                                                                  if (fixTime !== null) {
                                                                      if (isRange(_this.opts.times, fixTime)) {
                                                                          barrage.duration = fixTime;
                                                                          barrage.isChangeDuration = true;
                                                                          barrage.timeInfo.currentDuration = fixTime
                                                                      } else {
                                                                          barrage.reset();
                                                                          node.style.top = null;
                                                                          manager.stashBarrages.unshift(barrage);
                                                                          return
                                                                      }
                                                                  }
                                                              }
                                                              node.style.opacity = 1;
                                                              node.style.pointerEvents = manager.isShow ? 'auto': 'none';
                                                              node.style.visibility = manager.isShow ? 'visible': 'hidden';
                                                              node.style.transform = "translateX(".concat(isNegative * containerWidth, "px)");
                                                              node.style[transitionProp] = "transform linear ".concat(barrage.duration, "s");
                                                              node.style["margin".concat(upperCase(barrage.direction))] = "-".concat(width, "px");
                                                              barrage.moveing = true;
                                                              barrage.timeInfo.startTime = Date.now();
                                                              callHook(barrage.hooks, 'move', [barrage, node]);
                                                              callHook(barrage.globalHooks, 'barrageMove', [barrage, node]);
                                                              resolve(whenTransitionEnds(node))
                                                          })
                                                      })
                                                  }
                                              },
                                              {
                                                  key: "moveSpecialBarrage",
                                                  value: function moveSpecialBarrage(barrage, manager) {
                                                      var _this2 = this;
                                                      var node = barrage.node,
                                                          opts = barrage.opts;
                                                      node.style.position = 'absolute';
                                                      node.style.display = 'inline-block';
                                                      node.style.pointerEvents = manager.isShow ? 'auto': 'none';
                                                      node.style.visibility = manager.isShow ? 'visible': 'hidden';
                                                      return new Promise(function(resolve) {
                                                          var _opts$position = opts.position(barrage),
                                                              _opts$position$x = _opts$position.x,
                                                              x = _opts$position$x === void 0 ? 0 : _opts$position$x,
                                                              _opts$position$y = _opts$position.y,
                                                              y = _opts$position$y === void 0 ? 0 : _opts$position$y;
                                                          var setStyle = function setStyle(a, b) {
                                                              return "translateX(".concat(a, "px) translateY(").concat(b, "px)")
                                                          };
                                                          node.style.transform = setStyle(x, y);
                                                          nextFrame(function() {
                                                              barrage.moveing = true;
                                                              barrage.timeInfo.startTime = Date.now();
                                                              barrage.startPosition = {
                                                                  x: x,
                                                                  y: y
                                                              };
                                                              if (opts.direction === 'none') {
                                                                  var fn = function fn() {
                                                                      barrage.moveTimer.clear();
                                                                      barrage.moveTimer = null;
                                                                      resolve()
                                                                  };
                                                                  var timer = setTimeout(fn, opts.duration * 1000);
                                                                  barrage.moveTimer = {
                                                                      callback: fn,
                                                                      clear: function clear() {
                                                                          clearTimeout(timer);
                                                                          timer = null
                                                                      }
                                                                  }
                                                              } else {
                                                                  var endPosition = opts.direction === 'left' ? _this2.containerWidth: -barrage.getWidth();
                                                                  node.style.transform = setStyle(endPosition, y);
                                                                  node.style[transitionProp] = "transform linear ".concat(opts.duration, "s");
                                                                  resolve(whenTransitionEnds(node))
                                                              }
                                                              callHook(barrage.hooks, 'move', [barrage, node]);
                                                              callHook(manager.opts.hooks, 'barrageMove', [barrage, node])
                                                          })
                                                      })
                                                  }
                                              }]);
                return RuntimeManager
            } ();
            var SpecialBarrage = function() {
                function SpecialBarrage(manager, opts) {
                    _classCallCheck(this, SpecialBarrage);
                    this.opts = opts;
                    this.node = null;
                    this.paused = false;
                    this.moveing = false;
                    this.isSpecial = true;
                    this.manager = manager;
                    this.container = manager.opts.container;
                    this.RuntimeManager = manager.RuntimeManager;
                    this.hooks = opts.hooks;
                    this.data = opts.data || null;
                    this.key = opts.key || createKey();
                    this.moveTimer = null;
                    this.timeInfo = {
                        pauseTime: 0,
                        startTime: null,
                        prevPauseTime: null,
                        currentDuration: opts.duration
                    };
                    this.startPosition = {
                        x: null,
                        y: null
                    }
                }
                _createClass(SpecialBarrage, [{
                    key: "getHeight",
                    value: function getHeight() {
                        return this.node && this.node.clientHeight || 0
                    }
                },
                                              {
                                                  key: "getWidth",
                                                  value: function getWidth() {
                                                      return this.node && this.node.clientWidth || 0
                                                  }
                                              },
                                              {
                                                  key: "create",
                                                  value: function create() {
                                                      this.node = document.createElement('div');
                                                      callHook(this.hooks, 'create', [this, this.node]);
                                                      callHook(this.manager.opts.hooks, 'barrageCreate', [this, this.node])
                                                  }
                                              },
                                              {
                                                  key: "getMovePercent",
                                                  value: function getMovePercent() {
                                                      var _this$timeInfo = this.timeInfo,
                                                          pauseTime = _this$timeInfo.pauseTime,
                                                          startTime = _this$timeInfo.startTime,
                                                          prevPauseTime = _this$timeInfo.prevPauseTime;
                                                      var currentTime = this.paused ? prevPauseTime: Date.now();
                                                      return (currentTime - startTime - pauseTime) / 1000 / this.opts.duration
                                                  }
                                              },
                                              {
                                                  key: "getMoveDistance",
                                                  value: function getMoveDistance(direction, startPosition) {
                                                      if (!this.moveing) return 0;
                                                      var percent = this.getMovePercent();
                                                      if (direction === 'none') {
                                                          return startPosition
                                                      }
                                                      if (direction === 'left') {
                                                          var realMoveDistance = (this.RuntimeManager.containerWidth - startPosition) * percent;
                                                          return startPosition + realMoveDistance
                                                      } else {
                                                          var allMoveDistance = startPosition + this.getWidth();
                                                          return startPosition - allMoveDistance * percent
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "pause",
                                                  value: function pause() {
                                                      if (!this.moveing || this.paused) return;
                                                      this.paused = true;
                                                      this.timeInfo.prevPauseTime = Date.now();
                                                      var direction = this.opts.direction;
                                                      if (direction === 'none') {
                                                          if (this.moveTimer) {
                                                              this.moveTimer.clear()
                                                          }
                                                      } else {
                                                          var _this$startPosition = this.startPosition,
                                                              x = _this$startPosition.x,
                                                              y = _this$startPosition.y;
                                                          var moveDistance = this.getMoveDistance(direction, x);
                                                          this.node.style[transitionDuration] = '0s';
                                                          this.node.style.transform = "translateX(".concat(moveDistance, "px) translateY(").concat(y, "px)")
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "resume",
                                                  value: function resume() {
                                                      if (!this.moveing || !this.paused) return;
                                                      this.paused = false;
                                                      this.timeInfo.pauseTime += Date.now() - this.timeInfo.prevPauseTime;
                                                      this.timeInfo.prevPauseTime = null;
                                                      var direction = this.opts.direction;
                                                      var remainingTime = (1 - this.getMovePercent()) * this.opts.duration;
                                                      if (direction === 'none') {
                                                          var fn = this.moveTimer.callback ||
                                                              function() {};
                                                          var timer = setTimeout(fn, remainingTime * 1000);
                                                          this.moveTimer.clear = function() {
                                                              clearTimeout(timer);
                                                              timer = null
                                                          }
                                                      } else {
                                                          var _this$startPosition2 = this.startPosition,
                                                              x = _this$startPosition2.x,
                                                              y = _this$startPosition2.y;
                                                          var endPosition = this.opts.direction === 'left' ? this.RuntimeManager.containerWidth: -this.getWidth();
                                                          this.node.style[transitionDuration] = "".concat(remainingTime, "s");
                                                          this.node.style.transform = "translateX(".concat(endPosition, "px) translateY(").concat(y, "px)")
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "append",
                                                  value: function append() {
                                                      warning(this.container, 'Need container element.');
                                                      if (this.node) {
                                                          this.container.appendChild(this.node);
                                                          callHook(this.hooks, 'append', [this, this.node]);
                                                          callHook(this.manager.opts.hooks, 'barrageAppend', [this, this.node])
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "remove",
                                                  value: function remove() {
                                                      warning(this.container, 'Need container element.');
                                                      if (this.node) {
                                                          this.container.removeChild(this.node);
                                                          callHook(this.hooks, 'remove', [this, this.node]);
                                                          callHook(this.manager.opts.hooks, 'barrageRemove', [this, this.node])
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "destroy",
                                                  value: function destroy() {
                                                      this.remove();
                                                      this.moveing = false;
                                                      var index = this.manager.specialBarrages.indexOf(this);
                                                      if (~index) {
                                                          this.manager.specialBarrages.splice(index, 1)
                                                      }
                                                      if (this.moveTimer) {
                                                          this.moveTimer.clear();
                                                          this.moveTimer = null
                                                      }
                                                      callHook(this.hooks, 'destroy', [this, this.node]);
                                                      callHook(this.manager.opts.hooks, 'barrageDestroy', [this, this.node]);
                                                      this.node = null
                                                  }
                                              }]);
                return SpecialBarrage
            } ();
            function createSpecialBarrage(manager) {
                var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                opts = Object.assign({
                    hooks: {},
                    duration: 0,
                    direction: 'none',
                    position: function position() {
                        return {
                            x: 0,
                            y: 0
                        }
                    }
                },
                                     opts);
                return new SpecialBarrage(manager, opts)
            }
            var BarrageManager = function() {
                function BarrageManager(opts) {
                    _classCallCheck(this, BarrageManager);
                    this.opts = opts;
                    this.loopTimer = null;
                    this.plugins = new Map();
                    this.showBarrages = [];
                    this.stashBarrages = [];
                    this.specialBarrages = [];
                    this.isShow = opts.isShow;
                    this.container = opts.container;
                    this.RuntimeManager = new RuntimeManager(opts)
                }
                _createClass(BarrageManager, [{
                    key: "send",
                    value: function send(data, hooks, isForward) {
                        if (Array.isArray(data)) {
                            data = data.map(function(item) {
                                return {
                                    data: item,
                                    hooks: hooks
                                }
                            })
                        } else {
                            data = [{
                                data: data,
                                hooks: hooks
                            }]
                        }
                        if (this.assertCapacity(data.length)) return false;
                        isForward ? this.stashBarrages.unshift.apply(this.stashBarrages, data) : this.stashBarrages.push.apply(this.stashBarrages, data);
                        callHook(this.opts.hooks, 'send', [this, data]);
                        return true
                    }
                },
                                              {
                                                  key: "sendSpecial",
                                                  value: function sendSpecial(data) {
                                                      var _this = this;
                                                      if (!this.runing) return false;
                                                      if (!Array.isArray(data)) data = [data];
                                                      if (this.assertCapacity(data.length)) return false;
                                                      for (var i = 0; i < data.length; i++) {
                                                          if (callHook(this.opts.hooks, 'willRender', [this, data[i], true]) !== false) {
                                                              var _ret = function() {
                                                                  var barrage = createSpecialBarrage(_this, data[i]);
                                                                  if (barrage.opts.duration <= 0 || _this.showLength + 1 > _this.opts.limit) {
                                                                      return "continue"
                                                                  }
                                                                  barrage.create();
                                                                  barrage.append();
                                                                  _this.specialBarrages.push(barrage);
                                                                  _this.RuntimeManager.moveSpecialBarrage(barrage, _this).then(function() {
                                                                      barrage.destroy();
                                                                      if (_this.length === 0) {
                                                                          callHook(_this.opts.hooks, 'ended', [_this])
                                                                      }
                                                                  })
                                                              } ();
                                                              if (_ret === "continue") continue
                                                          }
                                                      }
                                                      callHook(this.opts.hooks, 'sendSpecial', [this, data]);
                                                      return true
                                                  }
                                              },
                                              {
                                                  key: "show",
                                                  value: function show() {
                                                      if (!this.isShow) {
                                                          this.isShow = true;
                                                          this.each(function(barrage) {
                                                              if (barrage.node) {
                                                                  barrage.node.style.visibility = 'visible';
                                                                  barrage.node.style.pointerEvents = 'auto'
                                                              }
                                                              callHook(barrage.hooks, 'show', [barrage, barrage.node])
                                                          });
                                                          callHook(this.opts.hooks, 'show', [this])
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "hidden",
                                                  value: function hidden() {
                                                      if (this.isShow) {
                                                          this.isShow = false;
                                                          this.each(function(barrage) {
                                                              if (barrage.node) {
                                                                  barrage.node.style.visibility = 'hidden';
                                                                  barrage.node.style.pointerEvents = 'none'
                                                              }
                                                              callHook(barrage.hooks, 'hidden', [barrage, barrage.node])
                                                          });
                                                          callHook(this.opts.hooks, 'hidden', [this])
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "each",
                                                  value: function each(callback) {
                                                      if (typeof callback === 'function') {
                                                          var i = 0;
                                                          for (; i < this.specialBarrages.length; i++) {
                                                              callback(this.specialBarrages[i], i)
                                                          }
                                                          for (i = 0; i < this.showBarrages.length; i++) {
                                                              var barrage = this.showBarrages[i];
                                                              if (barrage.moveing) {
                                                                  callback(barrage, i)
                                                              }
                                                          }
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "stop",
                                                  value: function stop(noCallHook) {
                                                      if (this.loopTimer) {
                                                          clearTimeout(this.loopTimer);
                                                          this.loopTimer = null;
                                                          if (!noCallHook) {
                                                              callHook(this.opts.hooks, 'stop', [this])
                                                          }
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "start",
                                                  value: function start(noCallHook) {
                                                      var _this2 = this;
                                                      var core = function core() {
                                                          _this2.loopTimer = setTimeout(function() {
                                                              _this2.renderBarrage();
                                                              core()
                                                          },
                                                                                        _this2.opts.interval * 1000)
                                                      };
                                                      this.stop(true);
                                                      core();
                                                      if (!noCallHook) {
                                                          callHook(this.opts.hooks, 'start', [this])
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "setOptions",
                                                  value: function setOptions(opts) {
                                                      if (opts) {
                                                          this.opts = Object.assign(this.opts, opts);
                                                          if ('interval' in opts) {
                                                              this.stop(true);
                                                              this.start(true)
                                                          }
                                                          if ('height' in opts) {
                                                              this.RuntimeManager.singleHeight = opts.height;
                                                              this.RuntimeManager.resize()
                                                          }
                                                          if ('rowGap' in opts) {
                                                              this.RuntimeManager.rowGap = opts.rowGap
                                                          }
                                                          callHook(this.opts.hooks, 'setOptions', [this, opts])
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "resize",
                                                  value: function resize() {
                                                      this.RuntimeManager.resize();
                                                      callHook(this.opts.hooks, 'resize', [this])
                                                  }
                                              },
                                              {
                                                  key: "clear",
                                                  value: function clear() {
                                                      this.stop();
                                                      this.each(function(barrage) {
                                                          return barrage.remove()
                                                      });
                                                      this.showBarrages = [];
                                                      this.stashBarrages = [];
                                                      this.specialBarrages = [];
                                                      this.RuntimeManager.container = [];
                                                      this.RuntimeManager.resize();
                                                      callHook(this.opts.hooks, 'clear', [this])
                                                  }
                                              },
                                              {
                                                  key: "clone",
                                                  value: function clone(opts) {
                                                      opts = opts ? Object.assign(this.opts, opts) : this.opts;
                                                      return new this.constructor(opts)
                                                  }
                                              },
                                              {
                                                  key: "use",
                                                  value: function use(fn) {
                                                      warning(typeof fn === 'function', 'Plugin must be a function.');
                                                      if (this.plugins.has(fn)) {
                                                          return this.plugins.get(fn)
                                                      }
                                                      for (var _len = arguments.length,
                                                           args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                                                          args[_key - 1] = arguments[_key]
                                                      }
                                                      var result = fn.apply(void 0, [this].concat(args));
                                                      this.plugins.set(fn, result);
                                                      return result
                                                  }
                                              },
                                              {
                                                  key: "assertCapacity",
                                                  value: function assertCapacity(n) {
                                                      var res = n + this.length > this.opts.capacity;
                                                      if (res) {
                                                          callHook(this.opts.hooks, 'capacityWarning', [this]);
                                                          console.warn("The number of barrage is greater than \"".concat(this.opts.capacity, "\"."))
                                                      }
                                                      return res
                                                  }
                                              },
                                              {
                                                  key: "renderBarrage",
                                                  value: function renderBarrage() {
                                                      var _this3 = this;
                                                      if (this.stashBarrages.length > 0) {
                                                          var _this$RuntimeManager = this.RuntimeManager,
                                                              rows = _this$RuntimeManager.rows,
                                                              rowGap = _this$RuntimeManager.rowGap;
                                                          var length = this.opts.limit - this.showLength;
                                                          if (rowGap > 0 && length > rows) {
                                                              length = this.RuntimeManager.rows
                                                          }
                                                          if (this.opts.forceRender || length > this.stashBarrages.length) {
                                                              length = this.stashBarrages.length
                                                          }
                                                          if (length > 0 && this.runing) {
                                                              timeSlice(length,
                                                                        function() {
                                                                  var currentBarrage = _this3.stashBarrages.shift();
                                                                  if (callHook(_this3.opts.hooks, 'willRender', [_this3, currentBarrage, false]) !== false) {
                                                                      var needStop = _this3.initSingleBarrage(currentBarrage.data, currentBarrage.hooks);
                                                                      if (needStop) {
                                                                          return false
                                                                      }
                                                                  }
                                                              });
                                                              callHook(this.opts.hooks, 'render', [this])
                                                          }
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "initSingleBarrage",
                                                  value: function initSingleBarrage(data, hooks) {
                                                      var _this4 = this;
                                                      var barrage = data instanceof Barrage ? data: this.createSingleBarrage(data, hooks);
                                                      var newBarrage = barrage && this.sureBarrageInfo(barrage);
                                                      if (newBarrage) {
                                                          newBarrage.append();
                                                          this.showBarrages.push(newBarrage);
                                                          newBarrage.trajectory.values.push(newBarrage);
                                                          this.RuntimeManager.move(newBarrage, this).then(function() {
                                                              newBarrage.destroy();
                                                              if (_this4.length === 0) {
                                                                  callHook(_this4.opts.hooks, 'ended', [_this4])
                                                              }
                                                          })
                                                      } else {
                                                          this.stashBarrages.unshift(barrage);
                                                          return true
                                                      }
                                                  }
                                              },
                                              {
                                                  key: "createSingleBarrage",
                                                  value: function createSingleBarrage(data, hooks) {
                                                      var _this$opts$times = _slicedToArray(this.opts.times, 2),
                                                          max = _this$opts$times[0],
                                                          min = _this$opts$times[1];
                                                      var time = Number(max === min ? max: (Math.random() * (max - min) + min).toFixed(0));
                                                      if (time <= 0) return null;
                                                      return new Barrage(data, hooks, time, this, Object.assign({},
                                                                                                                this.opts.hooks, {
                                                          barrageCreate: this.setBarrageStyle.bind(this)
                                                      }))
                                                  }
                                              },
                                              {
                                                  key: "sureBarrageInfo",
                                                  value: function sureBarrageInfo(barrage) {
                                                      var trajectory = this.RuntimeManager.getTrajectory();
                                                      if (!trajectory) return null;
                                                      barrage.trajectory = trajectory;
                                                      barrage.position.y = trajectory.gaps[0];
                                                      return barrage
                                                  }
                                              },
                                              {
                                                  key: "setBarrageStyle",
                                                  value: function setBarrageStyle(barrage, node) {
                                                      var _this$opts = this.opts,
                                                          _this$opts$hooks = _this$opts.hooks,
                                                          hooks = _this$opts$hooks === void 0 ? {}: _this$opts$hooks,
                                                          direction = _this$opts.direction;
                                                      node.style.opacity = 0;
                                                      node.style[direction] = 0;
                                                      node.style.position = 'absolute';
                                                      node.style.display = 'inline-block';
                                                      node.style.pointerEvents = this.isShow ? 'auto': 'none';
                                                      node.style.visibility = this.isShow ? 'visible': 'hidden';
                                                      callHook(hooks, 'barrageCreate', [barrage, node])
                                                  }
                                              },
                                              {
                                                  key: "stashLength",
                                                  get: function get() {
                                                      return this.stashBarrages.length
                                                  }
                                              },
                                              {
                                                  key: "specialLength",
                                                  get: function get() {
                                                      return this.specialBarrages.length
                                                  }
                                              },
                                              {
                                                  key: "showLength",
                                                  get: function get() {
                                                      return this.showBarrages.length + this.specialBarrages.length
                                                  }
                                              },
                                              {
                                                  key: "length",
                                                  get: function get() {
                                                      return this.showBarrages.length + this.specialBarrages.length + this.stashBarrages.length
                                                  }
                                              },
                                              {
                                                  key: "containerWidth",
                                                  get: function get() {
                                                      return this.RuntimeManager.containerWidth
                                                  }
                                              },
                                              {
                                                  key: "containerHeight",
                                                  get: function get() {
                                                      return this.RuntimeManager.containerHeight
                                                  }
                                              },
                                              {
                                                  key: "runing",
                                                  get: function get() {
                                                      return this.loopTimer !== null
                                                  }
                                              }]);
                return BarrageManager
            } ();
            function createBarrageManager() {
                var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                opts = Object.assign({
                    hooks: {},
                    limit: 100,
                    height: 50,
                    rowGap: 50,
                    isShow: true,
                    capacity: 1024,
                    times: [5, 10],
                    interval: 1,
                    direction: 'right',
                    forceRender: false
                },
                                     opts);
                return new BarrageManager(opts)
            }
            var index = {
                Timeline: Timeline,
                create: createBarrageManager
            };
            return index
        }));

        //jq库
       (function(e,t){var n,r,i=typeof t,o=e.document,a=e.location,s=e.jQuery,u=e.$,l={},c=[],p="1.9.1",f=c.concat,d=c.push,h=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=p.trim,b=function(e,t){return new b.fn.init(e,t,r)},x=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^[\],:{}\s]*$/,E=/(?:^|:|,)(?:\s*\[)+/g,S=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,A=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,j=/^-ms-/,D=/-([\da-z])/gi,L=function(e,t){return t.toUpperCase()},H=function(e){(o.addEventListener||"load"===e.type||"complete"===o.readyState)&&(q(),b.ready())},q=function(){o.addEventListener?(o.removeEventListener("DOMContentLoaded",H,!1),e.removeEventListener("load",H,!1)):(o.detachEvent("onreadystatechange",H),e.detachEvent("onload",H))};b.fn=b.prototype={jquery:p,constructor:b,init:function(e,n,r){var i,a;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof b?n[0]:n,b.merge(this,b.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:o,!0)),C.test(i[1])&&b.isPlainObject(n))for(i in n)b.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(a=o.getElementById(i[2]),a&&a.parentNode){if(a.id!==i[2])return r.find(e);this.length=1,this[0]=a}return this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):b.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),b.makeArray(e,this))},selector:"",length:0,size:function(){return this.length},toArray:function(){return h.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=b.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return b.each(this,e,t)},ready:function(e){return b.ready.promise().done(e),this},slice:function(){return this.pushStack(h.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(b.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:d,sort:[].sort,splice:[].splice},b.fn.init.prototype=b.fn,b.extend=b.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},u=1,l=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},u=2),"object"==typeof s||b.isFunction(s)||(s={}),l===u&&(s=this,--u);l>u;u++)if(null!=(o=arguments[u]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(b.isPlainObject(r)||(n=b.isArray(r)))?(n?(n=!1,a=e&&b.isArray(e)?e:[]):a=e&&b.isPlainObject(e)?e:{},s[i]=b.extend(c,a,r)):r!==t&&(s[i]=r));return s},b.extend({noConflict:function(t){return e.$===b&&(e.$=u),t&&e.jQuery===b&&(e.jQuery=s),b},isReady:!1,readyWait:1,holdReady:function(e){e?b.readyWait++:b.ready(!0)},ready:function(e){if(e===!0?!--b.readyWait:!b.isReady){if(!o.body)return setTimeout(b.ready);b.isReady=!0,e!==!0&&--b.readyWait>0||(n.resolveWith(o,[b]),b.fn.trigger&&b(o).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===b.type(e)},isArray:Array.isArray||function(e){return"array"===b.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if(!e||"object"!==b.type(e)||e.nodeType||b.isWindow(e))return!1;try{if(e.constructor&&!y.call(e,"constructor")&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||y.call(e,r)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=b.buildFragment([e],t,i),i&&b(i).remove(),b.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=b.trim(n),n&&k.test(n.replace(S,"@").replace(A,"]").replace(E,"")))?Function("return "+n)():(b.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||b.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&b.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(j,"ms-").replace(D,L)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:v&&!v.call("\ufeff\u00a0")?function(e){return null==e?"":v.call(e)}:function(e){return null==e?"":(e+"").replace(T,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?b.merge(n,"string"==typeof e?[e]:e):d.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(g)return g.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return f.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),b.isFunction(e)?(r=h.call(arguments,2),i=function(){return e.apply(n||this,r.concat(h.call(arguments)))},i.guid=e.guid=e.guid||b.guid++,i):t},access:function(e,n,r,i,o,a,s){var u=0,l=e.length,c=null==r;if("object"===b.type(r)){o=!0;for(u in r)b.access(e,n,u,r[u],!0,a,s)}else if(i!==t&&(o=!0,b.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(b(e),n)})),n))for(;l>u;u++)n(e[u],r,s?i:i.call(e[u],u,n(e[u],r)));return o?e:c?n.call(e):l?n(e[0],r):a},now:function(){return(new Date).getTime()}}),b.ready.promise=function(t){if(!n)if(n=b.Deferred(),"complete"===o.readyState)setTimeout(b.ready);else if(o.addEventListener)o.addEventListener("DOMContentLoaded",H,!1),e.addEventListener("load",H,!1);else{o.attachEvent("onreadystatechange",H),e.attachEvent("onload",H);var r=!1;try{r=null==e.frameElement&&o.documentElement}catch(i){}r&&r.doScroll&&function a(){if(!b.isReady){try{r.doScroll("left")}catch(e){return setTimeout(a,50)}q(),b.ready()}}()}return n.promise(t)},b.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=b.type(e);return b.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=b(o);var _={};function F(e){var t=_[e]={};return b.each(e.match(w)||[],function(e,n){t[n]=!0}),t}b.Callbacks=function(e){e="string"==typeof e?_[e]||F(e):b.extend({},e);var n,r,i,o,a,s,u=[],l=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=u.length,n=!0;u&&o>a;a++)if(u[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,u&&(l?l.length&&c(l.shift()):r?u=[]:p.disable())},p={add:function(){if(u){var t=u.length;(function i(t){b.each(t,function(t,n){var r=b.type(n);"function"===r?e.unique&&p.has(n)||u.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=u.length:r&&(s=t,c(r))}return this},remove:function(){return u&&b.each(arguments,function(e,t){var r;while((r=b.inArray(t,u,r))>-1)u.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?b.inArray(e,u)>-1:!(!u||!u.length)},empty:function(){return u=[],this},disable:function(){return u=l=r=t,this},disabled:function(){return!u},lock:function(){return l=t,r||p.disable(),this},locked:function(){return!l},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!u||i&&!l||(n?l.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},b.extend({Deferred:function(e){var t=[["resolve","done",b.Callbacks("once memory"),"resolved"],["reject","fail",b.Callbacks("once memory"),"rejected"],["notify","progress",b.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return b.Deferred(function(n){b.each(t,function(t,o){var a=o[0],s=b.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&b.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?b.extend(e,r):r}},i={};return r.pipe=r.then,b.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=h.call(arguments),r=n.length,i=1!==r||e&&b.isFunction(e.promise)?r:0,o=1===i?e:b.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?h.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,u,l;if(r>1)for(s=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&b.isFunction(n[t].promise)?n[t].promise().done(a(t,l,n)).fail(o.reject).progress(a(t,u,s)):--i;return i||o.resolveWith(l,n),o.promise()}}),b.support=function(){var t,n,r,a,s,u,l,c,p,f,d=o.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*"),r=d.getElementsByTagName("a")[0],!n||!r||!n.length)return{};s=o.createElement("select"),l=s.appendChild(o.createElement("option")),a=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t={getSetAttribute:"t"!==d.className,leadingWhitespace:3===d.firstChild.nodeType,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/top/.test(r.getAttribute("style")),hrefNormalized:"/a"===r.getAttribute("href"),opacity:/^0.5/.test(r.style.opacity),cssFloat:!!r.style.cssFloat,checkOn:!!a.value,optSelected:l.selected,enctype:!!o.createElement("form").enctype,html5Clone:"<:nav></:nav>"!==o.createElement("nav").cloneNode(!0).outerHTML,boxModel:"CSS1Compat"===o.compatMode,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},a.checked=!0,t.noCloneChecked=a.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!l.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}a=o.createElement("input"),a.setAttribute("value",""),t.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),t.radioValue="t"===a.value,a.setAttribute("checked","t"),a.setAttribute("name","t"),u=o.createDocumentFragment(),u.appendChild(a),t.appendChecked=a.checked,t.checkClone=u.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;return d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip,b(function(){var n,r,a,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",u=o.getElementsByTagName("body")[0];u&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",u.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",a=d.getElementsByTagName("td"),a[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===a[0].offsetHeight,a[0].style.display="",a[1].style.display="none",t.reliableHiddenOffsets=p&&0===a[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",t.boxSizing=4===d.offsetWidth,t.doesNotIncludeMarginInBodyOffset=1!==u.offsetTop,e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(o.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(u.style.zoom=1)),u.removeChild(n),n=d=a=r=null)}),n=s=u=l=r=a=null,t}();var O=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,B=/([A-Z])/g;function P(e,n,r,i){if(b.acceptData(e)){var o,a,s=b.expando,u="string"==typeof n,l=e.nodeType,p=l?b.cache:e,f=l?e[s]:e[s]&&s;if(f&&p[f]&&(i||p[f].data)||!u||r!==t)return f||(l?e[s]=f=c.pop()||b.guid++:f=s),p[f]||(p[f]={},l||(p[f].toJSON=b.noop)),("object"==typeof n||"function"==typeof n)&&(i?p[f]=b.extend(p[f],n):p[f].data=b.extend(p[f].data,n)),o=p[f],i||(o.data||(o.data={}),o=o.data),r!==t&&(o[b.camelCase(n)]=r),u?(a=o[n],null==a&&(a=o[b.camelCase(n)])):a=o,a}}function R(e,t,n){if(b.acceptData(e)){var r,i,o,a=e.nodeType,s=a?b.cache:e,u=a?e[b.expando]:b.expando;if(s[u]){if(t&&(o=n?s[u]:s[u].data)){b.isArray(t)?t=t.concat(b.map(t,b.camelCase)):t in o?t=[t]:(t=b.camelCase(t),t=t in o?[t]:t.split(" "));for(r=0,i=t.length;i>r;r++)delete o[t[r]];if(!(n?$:b.isEmptyObject)(o))return}(n||(delete s[u].data,$(s[u])))&&(a?b.cleanData([e],!0):b.support.deleteExpando||s!=s.window?delete s[u]:s[u]=null)}}}b.extend({cache:{},expando:"jQuery"+(p+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?b.cache[e[b.expando]]:e[b.expando],!!e&&!$(e)},data:function(e,t,n){return P(e,t,n)},removeData:function(e,t){return R(e,t)},_data:function(e,t,n){return P(e,t,n,!0)},_removeData:function(e,t){return R(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&b.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),b.fn.extend({data:function(e,n){var r,i,o=this[0],a=0,s=null;if(e===t){if(this.length&&(s=b.data(o),1===o.nodeType&&!b._data(o,"parsedAttrs"))){for(r=o.attributes;r.length>a;a++)i=r[a].name,i.indexOf("data-")||(i=b.camelCase(i.slice(5)),W(o,i,s[i]));b._data(o,"parsedAttrs",!0)}return s}return"object"==typeof e?this.each(function(){b.data(this,e)}):b.access(this,function(n){return n===t?o?W(o,e,b.data(o,e)):null:(this.each(function(){b.data(this,e,n)}),t)},null,n,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){b.removeData(this,e)})}});function W(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(B,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:O.test(r)?b.parseJSON(r):r}catch(o){}b.data(e,n,r)}else r=t}return r}function $(e){var t;for(t in e)if(("data"!==t||!b.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}b.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=b._data(e,n),r&&(!i||b.isArray(r)?i=b._data(e,n,b.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=b.queue(e,t),r=n.length,i=n.shift(),o=b._queueHooks(e,t),a=function(){b.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),o.cur=i,i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return b._data(e,n)||b._data(e,n,{empty:b.Callbacks("once memory").add(function(){b._removeData(e,t+"queue"),b._removeData(e,n)})})}}),b.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?b.queue(this[0],e):n===t?this:this.each(function(){var t=b.queue(this,e,n);b._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&b.dequeue(this,e)})},dequeue:function(e){return this.each(function(){b.dequeue(this,e)})},delay:function(e,t){return e=b.fx?b.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=b.Deferred(),a=this,s=this.length,u=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=b._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(u));return u(),o.promise(n)}});var I,z,X=/[\t\r\n]/g,U=/\r/g,V=/^(?:input|select|textarea|button|object)$/i,Y=/^(?:a|area)$/i,J=/^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,G=/^(?:checked|selected)$/i,Q=b.support.getSetAttribute,K=b.support.input;b.fn.extend({attr:function(e,t){return b.access(this,b.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){b.removeAttr(this,e)})},prop:function(e,t){return b.access(this,b.prop,e,t,arguments.length>1)},removeProp:function(e){return e=b.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,u="string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=b.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,u=0===arguments.length||"string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?b.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,r="boolean"==typeof t;return b.isFunction(e)?this.each(function(n){b(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,a=0,s=b(this),u=t,l=e.match(w)||[];while(o=l[a++])u=r?u:!s.hasClass(o),s[u?"addClass":"removeClass"](o)}else(n===i||"boolean"===n)&&(this.className&&b._data(this,"__className__",this.className),this.className=this.className||e===!1?"":b._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(X," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=b.isFunction(e),this.each(function(n){var o,a=b(this);1===this.nodeType&&(o=i?e.call(this,n,a.val()):e,null==o?o="":"number"==typeof o?o+="":b.isArray(o)&&(o=b.map(o,function(e){return null==e?"":e+""})),r=b.valHooks[this.type]||b.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=b.valHooks[o.type]||b.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(U,""):null==n?"":n)}}}),b.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,u=0>i?s:o?i:0;for(;s>u;u++)if(n=r[u],!(!n.selected&&u!==i||(b.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&b.nodeName(n.parentNode,"optgroup"))){if(t=b(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n=b.makeArray(t);return b(e).find("option").each(function(){this.selected=b.inArray(b(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attr:function(e,n,r){var o,a,s,u=e.nodeType;if(e&&3!==u&&8!==u&&2!==u)return typeof e.getAttribute===i?b.prop(e,n,r):(a=1!==u||!b.isXMLDoc(e),a&&(n=n.toLowerCase(),o=b.attrHooks[n]||(J.test(n)?z:I)),r===t?o&&a&&"get"in o&&null!==(s=o.get(e,n))?s:(typeof e.getAttribute!==i&&(s=e.getAttribute(n)),null==s?t:s):null!==r?o&&a&&"set"in o&&(s=o.set(e,r,n))!==t?s:(e.setAttribute(n,r+""),r):(b.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=b.propFix[n]||n,J.test(n)?!Q&&G.test(n)?e[b.camelCase("default-"+n)]=e[r]=!1:e[r]=!1:b.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!b.support.radioValue&&"radio"===t&&b.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!b.isXMLDoc(e),a&&(n=b.propFix[n]||n,o=b.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):V.test(e.nodeName)||Y.test(e.nodeName)&&e.href?0:t}}}}),z={get:function(e,n){var r=b.prop(e,n),i="boolean"==typeof r&&e.getAttribute(n),o="boolean"==typeof r?K&&Q?null!=i:G.test(n)?e[b.camelCase("default-"+n)]:!!i:e.getAttributeNode(n);return o&&o.value!==!1?n.toLowerCase():t},set:function(e,t,n){return t===!1?b.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&b.propFix[n]||n,n):e[b.camelCase("default-"+n)]=e[n]=!0,n}},K&&Q||(b.attrHooks.value={get:function(e,n){var r=e.getAttributeNode(n);return b.nodeName(e,"input")?e.defaultValue:r&&r.specified?r.value:t},set:function(e,n,r){return b.nodeName(e,"input")?(e.defaultValue=n,t):I&&I.set(e,n,r)}}),Q||(I=b.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&("id"===n||"name"===n||"coords"===n?""!==r.value:r.specified)?r.value:t},set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},b.attrHooks.contenteditable={get:I.get,set:function(e,t,n){I.set(e,""===t?!1:t,n)}},b.each(["width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}})})),b.support.hrefNormalized||(b.each(["href","src","width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return null==r?t:r}})}),b.each(["href","src"],function(e,t){b.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}})),b.support.style||(b.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),b.support.optSelected||(b.propHooks.selected=b.extend(b.propHooks.selected,{get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),b.support.enctype||(b.propFix.enctype="encoding"),b.support.checkOn||b.each(["radio","checkbox"],function(){b.valHooks[this]={get:function(e){return null===e.getAttribute("value")?"on":e.value}}}),b.each(["radio","checkbox"],function(){b.valHooks[this]=b.extend(b.valHooks[this],{set:function(e,n){return b.isArray(n)?e.checked=b.inArray(b(e).val(),n)>=0:t}})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}b.event={global:{},add:function(e,n,r,o,a){var s,u,l,c,p,f,d,h,g,m,y,v=b._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=b.guid++),(u=v.events)||(u=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof b===i||e&&b.event.triggered===e.type?t:b.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(w)||[""],l=n.length;while(l--)s=rt.exec(n[l])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),p=b.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=b.event.special[g]||{},d=b.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&b.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=u[g])||(h=u[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),b.event.global[g]=!0;e=null}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,p,f,d,h,g,m=b.hasData(e)&&b._data(e);if(m&&(c=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(s=rt.exec(t[l])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=b.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),u=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));u&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||b.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)b.event.remove(e,d+t[l],n,r,!0);b.isEmptyObject(c)&&(delete m.handle,b._removeData(e,"events"))}},trigger:function(n,r,i,a){var s,u,l,c,p,f,d,h=[i||o],g=y.call(n,"type")?n.type:n,m=y.call(n,"namespace")?n.namespace.split("."):[];if(l=f=i=i||o,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+b.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),u=0>g.indexOf(":")&&"on"+g,n=n[b.expando]?n:new b.Event(g,"object"==typeof n&&n),n.isTrigger=!0,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:b.makeArray(r,[n]),p=b.event.special[g]||{},a||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!a&&!p.noBubble&&!b.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(l=l.parentNode);l;l=l.parentNode)h.push(l),f=l;f===(i.ownerDocument||o)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((l=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(b._data(l,"events")||{})[n.type]&&b._data(l,"handle"),s&&s.apply(l,r),s=u&&l[u],s&&b.acceptData(l)&&s.apply&&s.apply(l,r)===!1&&n.preventDefault();if(n.type=g,!(a||n.isDefaultPrevented()||p._default&&p._default.apply(i.ownerDocument,r)!==!1||"click"===g&&b.nodeName(i,"a")||!b.acceptData(i)||!u||!i[g]||b.isWindow(i))){f=i[u],f&&(i[u]=null),b.event.triggered=g;try{i[g]()}catch(v){}b.event.triggered=t,f&&(i[u]=f)}return n.result}},dispatch:function(e){e=b.event.fix(e);var n,r,i,o,a,s=[],u=h.call(arguments),l=(b._data(this,"events")||{})[e.type]||[],c=b.event.special[e.type]||{};if(u[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=b.event.handlers.call(this,e,l),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((b.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,u),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],u=n.delegateCount,l=e.target;if(u&&l.nodeType&&(!e.button||"click"!==e.type))for(;l!=this;l=l.parentNode||this)if(1===l.nodeType&&(l.disabled!==!0||"click"!==e.type)){for(o=[],a=0;u>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?b(r,this).index(l)>=0:b.find(r,this,null,[l]).length),o[r]&&o.push(i);o.length&&s.push({elem:l,handlers:o})}return n.length>u&&s.push({elem:this,handlers:n.slice(u)}),s},fix:function(e){if(e[b.expando])return e;var t,n,r,i=e.type,a=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new b.Event(a),t=r.length;while(t--)n=r[t],e[n]=a[n];return e.target||(e.target=a.srcElement||o),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,a):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,a,s=n.button,u=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||o,a=i.documentElement,r=i.body,e.pageX=n.clientX+(a&&a.scrollLeft||r&&r.scrollLeft||0)-(a&&a.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(a&&a.scrollTop||r&&r.scrollTop||0)-(a&&a.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&u&&(e.relatedTarget=u===e.target?n.toElement:u),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},click:{trigger:function(){return b.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t}},focus:{trigger:function(){if(this!==o.activeElement&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===o.activeElement&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=b.extend(new b.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?b.event.trigger(i,null,t):b.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},b.removeEvent=o.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},b.Event=function(e,n){return this instanceof b.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&b.extend(this,n),this.timeStamp=e&&e.timeStamp||b.now(),this[b.expando]=!0,t):new b.Event(e,n)},b.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},b.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){b.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!b.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),b.support.submitBubbles||(b.event.special.submit={setup:function(){return b.nodeName(this,"form")?!1:(b.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=b.nodeName(n,"input")||b.nodeName(n,"button")?n.form:t;r&&!b._data(r,"submitBubbles")&&(b.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),b._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&b.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return b.nodeName(this,"form")?!1:(b.event.remove(this,"._submit"),t)}}),b.support.changeBubbles||(b.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(b.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),b.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),b.event.simulate("change",this,e,!0)})),!1):(b.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!b._data(t,"changeBubbles")&&(b.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||b.event.simulate("change",this.parentNode,e,!0)}),b._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return b.event.remove(this,"._change"),!Z.test(this.nodeName)}}),b.support.focusinBubbles||b.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){b.event.simulate(t,e.target,b.event.fix(e),!0)};b.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),b.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return b().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=b.guid++)),this.each(function(){b.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,b(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){b.event.remove(this,e,r,n)})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},trigger:function(e,t){return this.each(function(){b.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?b.event.trigger(e,n,r,!0):t}}),function(e,t){var n,r,i,o,a,s,u,l,c,p,f,d,h,g,m,y,v,x="sizzle"+-new Date,w=e.document,T={},N=0,C=0,k=it(),E=it(),S=it(),A=typeof t,j=1<<31,D=[],L=D.pop,H=D.push,q=D.slice,M=D.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},_="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",O=F.replace("w","w#"),B="([*^$|!~]?=)",P="\\["+_+"*("+F+")"+_+"*(?:"+B+_+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+O+")|)|)"+_+"*\\]",R=":("+F+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+P.replace(3,8)+")*)|.*)\\)|)",W=RegExp("^"+_+"+|((?:^|[^\\\\])(?:\\\\.)*)"+_+"+$","g"),$=RegExp("^"+_+"*,"+_+"*"),I=RegExp("^"+_+"*([\\x20\\t\\r\\n\\f>+~])"+_+"*"),z=RegExp(R),X=RegExp("^"+O+"$"),U={ID:RegExp("^#("+F+")"),CLASS:RegExp("^\\.("+F+")"),NAME:RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:RegExp("^("+F.replace("w","w*")+")"),ATTR:RegExp("^"+P),PSEUDO:RegExp("^"+R),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+_+"*(even|odd|(([+-]|)(\\d*)n|)"+_+"*(?:([+-]|)"+_+"*(\\d+)|))"+_+"*\\)|)","i"),needsContext:RegExp("^"+_+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+_+"*((?:-\\d)?\\d*)"+_+"*\\)|)(?=[^-]|$)","i")},V=/[\x20\t\r\n\f]*[+~]/,Y=/^[^{]+\{\s*\[native code/,J=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,G=/^(?:input|select|textarea|button)$/i,Q=/^h\d$/i,K=/'|\\/g,Z=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,et=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,tt=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{q.call(w.documentElement.childNodes,0)[0].nodeType}catch(nt){q=function(e){var t,n=[];while(t=this[e++])n.push(t);return n}}function rt(e){return Y.test(e+"")}function it(){var e,t=[];return e=function(n,r){return t.push(n+=" ")>i.cacheLength&&delete e[t.shift()],e[n]=r}}function ot(e){return e[x]=!0,e}function at(e){var t=p.createElement("div");try{return e(t)}catch(n){return!1}finally{t=null}}function st(e,t,n,r){var i,o,a,s,u,l,f,g,m,v;if((t?t.ownerDocument||t:w)!==p&&c(t),t=t||p,n=n||[],!e||"string"!=typeof e)return n;if(1!==(s=t.nodeType)&&9!==s)return[];if(!d&&!r){if(i=J.exec(e))if(a=i[1]){if(9===s){if(o=t.getElementById(a),!o||!o.parentNode)return n;if(o.id===a)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(a))&&y(t,o)&&o.id===a)return n.push(o),n}else{if(i[2])return H.apply(n,q.call(t.getElementsByTagName(e),0)),n;if((a=i[3])&&T.getByClassName&&t.getElementsByClassName)return H.apply(n,q.call(t.getElementsByClassName(a),0)),n}if(T.qsa&&!h.test(e)){if(f=!0,g=x,m=t,v=9===s&&e,1===s&&"object"!==t.nodeName.toLowerCase()){l=ft(e),(f=t.getAttribute("id"))?g=f.replace(K,"\\$&"):t.setAttribute("id",g),g="[id='"+g+"'] ",u=l.length;while(u--)l[u]=g+dt(l[u]);m=V.test(e)&&t.parentNode||t,v=l.join(",")}if(v)try{return H.apply(n,q.call(m.querySelectorAll(v),0)),n}catch(b){}finally{f||t.removeAttribute("id")}}}return wt(e.replace(W,"$1"),t,n,r)}a=st.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},c=st.setDocument=function(e){var n=e?e.ownerDocument||e:w;return n!==p&&9===n.nodeType&&n.documentElement?(p=n,f=n.documentElement,d=a(n),T.tagNameNoComments=at(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),T.attributes=at(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return"boolean"!==t&&"string"!==t}),T.getByClassName=at(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",e.getElementsByClassName&&e.getElementsByClassName("e").length?(e.lastChild.className="e",2===e.getElementsByClassName("e").length):!1}),T.getByName=at(function(e){e.id=x+0,e.innerHTML="<a name='"+x+"'></a><div name='"+x+"'></div>",f.insertBefore(e,f.firstChild);var t=n.getElementsByName&&n.getElementsByName(x).length===2+n.getElementsByName(x+0).length;return T.getIdNotName=!n.getElementById(x),f.removeChild(e),t}),i.attrHandle=at(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==A&&"#"===e.firstChild.getAttribute("href")})?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},T.getIdNotName?(i.find.ID=function(e,t){if(typeof t.getElementById!==A&&!d){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){return e.getAttribute("id")===t}}):(i.find.ID=function(e,n){if(typeof n.getElementById!==A&&!d){var r=n.getElementById(e);return r?r.id===e||typeof r.getAttributeNode!==A&&r.getAttributeNode("id").value===e?[r]:t:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){var n=typeof e.getAttributeNode!==A&&e.getAttributeNode("id");return n&&n.value===t}}),i.find.TAG=T.tagNameNoComments?function(e,n){return typeof n.getElementsByTagName!==A?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},i.find.NAME=T.getByName&&function(e,n){return typeof n.getElementsByName!==A?n.getElementsByName(name):t},i.find.CLASS=T.getByClassName&&function(e,n){return typeof n.getElementsByClassName===A||d?t:n.getElementsByClassName(e)},g=[],h=[":focus"],(T.qsa=rt(n.querySelectorAll))&&(at(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||h.push("\\["+_+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||h.push(":checked")}),at(function(e){e.innerHTML="<input type='hidden' i=''/>",e.querySelectorAll("[i^='']").length&&h.push("[*^$]="+_+"*(?:\"\"|'')"),e.querySelectorAll(":enabled").length||h.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),h.push(",.*:")})),(T.matchesSelector=rt(m=f.matchesSelector||f.mozMatchesSelector||f.webkitMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&at(function(e){T.disconnectedMatch=m.call(e,"div"),m.call(e,"[s!='']:x"),g.push("!=",R)}),h=RegExp(h.join("|")),g=RegExp(g.join("|")),y=rt(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},v=f.compareDocumentPosition?function(e,t){var r;return e===t?(u=!0,0):(r=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t))?1&r||e.parentNode&&11===e.parentNode.nodeType?e===n||y(w,e)?-1:t===n||y(w,t)?1:0:4&r?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return u=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:0;if(o===a)return ut(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?ut(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},u=!1,[0,0].sort(v),T.detectDuplicates=u,p):p},st.matches=function(e,t){return st(e,null,null,t)},st.matchesSelector=function(e,t){if((e.ownerDocument||e)!==p&&c(e),t=t.replace(Z,"='$1']"),!(!T.matchesSelector||d||g&&g.test(t)||h.test(t)))try{var n=m.call(e,t);if(n||T.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return st(t,p,null,[e]).length>0},st.contains=function(e,t){return(e.ownerDocument||e)!==p&&c(e),y(e,t)},st.attr=function(e,t){var n;return(e.ownerDocument||e)!==p&&c(e),d||(t=t.toLowerCase()),(n=i.attrHandle[t])?n(e):d||T.attributes?e.getAttribute(t):((n=e.getAttributeNode(t))||e.getAttribute(t))&&e[t]===!0?t:n&&n.specified?n.value:null},st.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},st.uniqueSort=function(e){var t,n=[],r=1,i=0;if(u=!T.detectDuplicates,e.sort(v),u){for(;t=e[r];r++)t===e[r-1]&&(i=n.push(r));while(i--)e.splice(n[i],1)}return e};function ut(e,t){var n=t&&e,r=n&&(~t.sourceIndex||j)-(~e.sourceIndex||j);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function lt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ct(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function pt(e){return ot(function(t){return t=+t,ot(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}o=st.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=o(t);return n},i=st.selectors={cacheLength:50,createPseudo:ot,match:U,find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(et,tt),e[3]=(e[4]||e[5]||"").replace(et,tt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||st.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&st.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return U.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&z.test(n)&&(t=ft(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){return"*"===e?function(){return!0}:(e=e.replace(et,tt).toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=k[e+" "];return t||(t=RegExp("(^|"+_+")"+e+"("+_+"|$)"))&&k(e,function(e){return t.test(e.className||typeof e.getAttribute!==A&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=st.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!u&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[x]||(m[x]={}),l=c[e]||[],d=l[0]===N&&l[1],f=l[0]===N&&l[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[N,d,f];break}}else if(v&&(l=(t[x]||(t[x]={}))[e])&&l[0]===N)f=l[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[x]||(p[x]={}))[e]=[N,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||st.error("unsupported pseudo: "+e);return r[x]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?ot(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=M.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:ot(function(e){var t=[],n=[],r=s(e.replace(W,"$1"));return r[x]?ot(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:ot(function(e){return function(t){return st(e,t).length>0}}),contains:ot(function(e){return function(t){return(t.textContent||t.innerText||o(t)).indexOf(e)>-1}}),lang:ot(function(e){return X.test(e||"")||st.error("unsupported lang: "+e),e=e.replace(et,tt).toLowerCase(),function(t){var n;do if(n=d?t.getAttribute("xml:lang")||t.getAttribute("lang"):t.lang)return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===p.activeElement&&(!p.hasFocus||p.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!i.pseudos.empty(e)},header:function(e){return Q.test(e.nodeName)},input:function(e){return G.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:pt(function(){return[0]}),last:pt(function(e,t){return[t-1]}),eq:pt(function(e,t,n){return[0>n?n+t:n]}),even:pt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:pt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:pt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:pt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})i.pseudos[n]=lt(n);for(n in{submit:!0,reset:!0})i.pseudos[n]=ct(n);function ft(e,t){var n,r,o,a,s,u,l,c=E[e+" "];if(c)return t?0:c.slice(0);s=e,u=[],l=i.preFilter;while(s){(!n||(r=$.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),u.push(o=[])),n=!1,(r=I.exec(s))&&(n=r.shift(),o.push({value:n,type:r[0].replace(W," ")}),s=s.slice(n.length));for(a in i.filter)!(r=U[a].exec(s))||l[a]&&!(r=l[a](r))||(n=r.shift(),o.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?st.error(e):E(e,u).slice(0)}function dt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function ht(e,t,n){var i=t.dir,o=n&&"parentNode"===i,a=C++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,n,s){var u,l,c,p=N+" "+a;if(s){while(t=t[i])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[x]||(t[x]={}),(l=c[i])&&l[0]===p){if((u=l[1])===!0||u===r)return u===!0}else if(l=c[i]=[p],l[1]=e(t,n,s)||r,l[1]===!0)return!0}}function gt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function mt(e,t,n,r,i){var o,a=[],s=0,u=e.length,l=null!=t;for(;u>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),l&&t.push(s));return a}function yt(e,t,n,r,i,o){return r&&!r[x]&&(r=yt(r)),i&&!i[x]&&(i=yt(i,o)),ot(function(o,a,s,u){var l,c,p,f=[],d=[],h=a.length,g=o||xt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:mt(g,f,e,s,u),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,u),r){l=mt(y,d),r(l,[],s,u),c=l.length;while(c--)(p=l[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(p=y[c])&&l.push(m[c]=p);i(null,y=[],l,u)}c=y.length;while(c--)(p=y[c])&&(l=i?M.call(o,p):f[c])>-1&&(o[l]=!(a[l]=p))}}else y=mt(y===a?y.splice(h,y.length):y),i?i(null,a,y,u):H.apply(a,y)})}function vt(e){var t,n,r,o=e.length,a=i.relative[e[0].type],s=a||i.relative[" "],u=a?1:0,c=ht(function(e){return e===t},s,!0),p=ht(function(e){return M.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==l)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;o>u;u++)if(n=i.relative[e[u].type])f=[ht(gt(f),n)];else{if(n=i.filter[e[u].type].apply(null,e[u].matches),n[x]){for(r=++u;o>r;r++)if(i.relative[e[r].type])break;return yt(u>1&&gt(f),u>1&&dt(e.slice(0,u-1)).replace(W,"$1"),n,r>u&&vt(e.slice(u,r)),o>r&&vt(e=e.slice(r)),o>r&&dt(e))}f.push(n)}return gt(f)}function bt(e,t){var n=0,o=t.length>0,a=e.length>0,s=function(s,u,c,f,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,T=l,C=s||a&&i.find.TAG("*",d&&u.parentNode||u),k=N+=null==T?1:Math.random()||.1;for(w&&(l=u!==p&&u,r=n);null!=(h=C[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,u,c)){f.push(h);break}w&&(N=k,r=++n)}o&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,o&&b!==v){g=0;while(m=t[g++])m(x,y,u,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=L.call(f));y=mt(y)}H.apply(f,y),w&&!s&&y.length>0&&v+t.length>1&&st.uniqueSort(f)}return w&&(N=k,l=T),x};return o?ot(s):s}s=st.compile=function(e,t){var n,r=[],i=[],o=S[e+" "];if(!o){t||(t=ft(e)),n=t.length;while(n--)o=vt(t[n]),o[x]?r.push(o):i.push(o);o=S(e,bt(i,r))}return o};function xt(e,t,n){var r=0,i=t.length;for(;i>r;r++)st(e,t[r],n);return n}function wt(e,t,n,r){var o,a,u,l,c,p=ft(e);if(!r&&1===p.length){if(a=p[0]=p[0].slice(0),a.length>2&&"ID"===(u=a[0]).type&&9===t.nodeType&&!d&&i.relative[a[1].type]){if(t=i.find.ID(u.matches[0].replace(et,tt),t)[0],!t)return n;e=e.slice(a.shift().value.length)}o=U.needsContext.test(e)?0:a.length;while(o--){if(u=a[o],i.relative[l=u.type])break;if((c=i.find[l])&&(r=c(u.matches[0].replace(et,tt),V.test(a[0].type)&&t.parentNode||t))){if(a.splice(o,1),e=r.length&&dt(a),!e)return H.apply(n,q.call(r,0)),n;break}}}return s(e,p)(r,t,d,n,V.test(e)),n}i.pseudos.nth=i.pseudos.eq;function Tt(){}i.filters=Tt.prototype=i.pseudos,i.setFilters=new Tt,c(),st.attr=b.attr,b.find=st,b.expr=st.selectors,b.expr[":"]=b.expr.pseudos,b.unique=st.uniqueSort,b.text=st.getText,b.isXMLDoc=st.isXML,b.contains=st.contains}(e);var at=/Until$/,st=/^(?:parents|prev(?:Until|All))/,ut=/^.[^:#\[\.,]*$/,lt=b.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};b.fn.extend({find:function(e){var t,n,r,i=this.length;if("string"!=typeof e)return r=this,this.pushStack(b(e).filter(function(){for(t=0;i>t;t++)if(b.contains(r[t],this))return!0}));for(n=[],t=0;i>t;t++)b.find(e,this[t],n);return n=this.pushStack(i>1?b.unique(n):n),n.selector=(this.selector?this.selector+" ":"")+e,n},has:function(e){var t,n=b(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(b.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e,!1))},filter:function(e){return this.pushStack(ft(this,e,!0))},is:function(e){return!!e&&("string"==typeof e?lt.test(e)?b(e,this.context).index(this[0])>=0:b.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,o=[],a=lt.test(e)||"string"!=typeof e?b(e,t||this.context):0;for(;i>r;r++){n=this[r];while(n&&n.ownerDocument&&n!==t&&11!==n.nodeType){if(a?a.index(n)>-1:b.find.matchesSelector(n,e)){o.push(n);break}n=n.parentNode}}return this.pushStack(o.length>1?b.unique(o):o)},index:function(e){return e?"string"==typeof e?b.inArray(this[0],b(e)):b.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?b(e,t):b.makeArray(e&&e.nodeType?[e]:e),r=b.merge(this.get(),n);return this.pushStack(b.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),b.fn.andSelf=b.fn.addBack;function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}b.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return b.dir(e,"parentNode")},parentsUntil:function(e,t,n){return b.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return b.dir(e,"nextSibling")},prevAll:function(e){return b.dir(e,"previousSibling")},nextUntil:function(e,t,n){return b.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return b.dir(e,"previousSibling",n)},siblings:function(e){return b.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return b.sibling(e.firstChild)},contents:function(e){return b.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:b.merge([],e.childNodes)}},function(e,t){b.fn[e]=function(n,r){var i=b.map(this,t,n);return at.test(e)||(r=n),r&&"string"==typeof r&&(i=b.filter(r,i)),i=this.length>1&&!ct[e]?b.unique(i):i,this.length>1&&st.test(e)&&(i=i.reverse()),this.pushStack(i)}}),b.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),1===t.length?b.find.matchesSelector(t[0],e)?[t[0]]:[]:b.find.matches(e,t)},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!b(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(t=t||0,b.isFunction(t))return b.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if(t.nodeType)return b.grep(e,function(e){return e===t===n});if("string"==typeof t){var r=b.grep(e,function(e){return 1===e.nodeType});if(ut.test(t))return b.filter(t,r,!n);t=b.filter(t,r)}return b.grep(e,function(e){return b.inArray(e,t)>=0===n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Nt=/^(?:checkbox|radio)$/i,Ct=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:b.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(o),Dt=jt.appendChild(o.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,b.fn.extend({text:function(e){return b.access(this,function(e){return e===t?b.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},wrapAll:function(e){if(b.isFunction(e))return this.each(function(t){b(this).wrapAll(e.call(this,t))});if(this[0]){var t=b(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return b.isFunction(e)?this.each(function(t){b(this).wrapInner(e.call(this,t))}):this.each(function(){var t=b(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=b.isFunction(e);return this.each(function(n){b(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){b.nodeName(this,"body")||b(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.appendChild(e)})},prepend:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.insertBefore(e,this.firstChild)})},before:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=0;for(;null!=(n=this[r]);r++)(!e||b.filter(e,[n]).length>0)&&(t||1!==n.nodeType||b.cleanData(Ot(n)),n.parentNode&&(t&&b.contains(n.ownerDocument,n)&&Mt(Ot(n,"script")),n.parentNode.removeChild(n)));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&b.cleanData(Ot(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&b.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return b.clone(this,e,t)})},html:function(e){return b.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!b.support.htmlSerialize&&mt.test(e)||!b.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(b.cleanData(Ot(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(e){var t=b.isFunction(e);return t||"string"==typeof e||(e=b(e).not(this).detach()),this.domManip([e],!0,function(e){var t=this.nextSibling,n=this.parentNode;n&&(b(this).remove(),n.insertBefore(e,t))})},detach:function(e){return this.remove(e,!0)},domManip:function(e,n,r){e=f.apply([],e);var i,o,a,s,u,l,c=0,p=this.length,d=this,h=p-1,g=e[0],m=b.isFunction(g);if(m||!(1>=p||"string"!=typeof g||b.support.checkClone)&&Ct.test(g))return this.each(function(i){var o=d.eq(i);m&&(e[0]=g.call(this,i,n?o.html():t)),o.domManip(e,n,r)});if(p&&(l=b.buildFragment(e,this[0].ownerDocument,!1,this),i=l.firstChild,1===l.childNodes.length&&(l=i),i)){for(n=n&&b.nodeName(i,"tr"),s=b.map(Ot(l,"script"),Ht),a=s.length;p>c;c++)o=l,c!==h&&(o=b.clone(o,!0,!0),a&&b.merge(s,Ot(o,"script"))),r.call(n&&b.nodeName(this[c],"table")?Lt(this[c],"tbody"):this[c],o,c);if(a)for(u=s[s.length-1].ownerDocument,b.map(s,qt),c=0;a>c;c++)o=s[c],kt.test(o.type||"")&&!b._data(o,"globalEval")&&b.contains(u,o)&&(o.src?b.ajax({url:o.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):b.globalEval((o.text||o.textContent||o.innerHTML||"").replace(St,"")));l=i=null}return this}});function Lt(e,t){return e.getElementsByTagName(t)[0]||e.appendChild(e.ownerDocument.createElement(t))}function Ht(e){var t=e.getAttributeNode("type");return e.type=(t&&t.specified)+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function Mt(e,t){var n,r=0;for(;null!=(n=e[r]);r++)b._data(n,"globalEval",!t||b._data(t[r],"globalEval"))}function _t(e,t){if(1===t.nodeType&&b.hasData(e)){var n,r,i,o=b._data(e),a=b._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)b.event.add(t,n,s[n][r])}a.data&&(a.data=b.extend({},a.data))}}function Ft(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!b.support.noCloneEvent&&t[b.expando]){i=b._data(t);for(r in i.events)b.removeEvent(t,r,i.handle);t.removeAttribute(b.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),b.support.html5Clone&&e.innerHTML&&!b.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Nt.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}b.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){b.fn[e]=function(e){var n,r=0,i=[],o=b(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),b(o[r])[t](n),d.apply(i,n.get());return this.pushStack(i)}});function Ot(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||b.nodeName(o,n)?s.push(o):b.merge(s,Ot(o,n));return n===t||n&&b.nodeName(e,n)?b.merge([e],s):s}function Bt(e){Nt.test(e.type)&&(e.defaultChecked=e.checked)}b.extend({clone:function(e,t,n){var r,i,o,a,s,u=b.contains(e.ownerDocument,e);if(b.support.html5Clone||b.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(b.support.noCloneEvent&&b.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||b.isXMLDoc(e)))for(r=Ot(o),s=Ot(e),a=0;null!=(i=s[a]);++a)r[a]&&Ft(i,r[a]);if(t)if(n)for(s=s||Ot(e),r=r||Ot(o),a=0;null!=(i=s[a]);a++)_t(i,r[a]);else _t(e,o);return r=Ot(o,"script"),r.length>0&&Mt(r,!u&&Ot(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,u,l,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===b.type(o))b.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),u=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[u]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!b.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!b.support.tbody){o="table"!==u||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)b.nodeName(l=o.childNodes[i],"tbody")&&!l.childNodes.length&&o.removeChild(l)}b.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),b.support.appendChecked||b.grep(Ot(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===b.inArray(o,r))&&(a=b.contains(o.ownerDocument,o),s=Ot(f.appendChild(o),"script"),a&&Mt(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,u=b.expando,l=b.cache,p=b.support.deleteExpando,f=b.event.special;for(;null!=(n=e[s]);s++)if((t||b.acceptData(n))&&(o=n[u],a=o&&l[o])){if(a.events)for(r in a.events)f[r]?b.event.remove(n,r):b.removeEvent(n,r,a.handle);l[o]&&(delete l[o],p?delete n[u]:typeof n.removeAttribute!==i?n.removeAttribute(u):n[u]=null,c.push(o))}}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+x+")(.*)$","i"),Yt=RegExp("^("+x+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+x+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===b.css(e,"display")||!b.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=b._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=b._data(r,"olddisplay",un(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&b._data(r,"olddisplay",i?n:b.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}b.fn.extend({css:function(e,n){return b.access(this,function(e,n,r){var i,o,a={},s=0;if(b.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=b.css(e,n[s],!1,o);return a}return r!==t?b.style(e,n,r):b.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:nn(this))?b(this).show():b(this).hide()})}}),b.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":b.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,u=b.camelCase(n),l=e.style;if(n=b.cssProps[u]||(b.cssProps[u]=tn(l,u)),s=b.cssHooks[n]||b.cssHooks[u],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:l[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(b.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||b.cssNumber[u]||(r+="px"),b.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(l[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{l[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,u=b.camelCase(n);return n=b.cssProps[u]||(b.cssProps[u]=tn(e.style,u)),s=b.cssHooks[n]||b.cssHooks[u],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||b.isNumeric(o)?o||0:a):a},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s.getPropertyValue(n)||s[n]:t,l=e.style;return s&&(""!==u||b.contains(e.ownerDocument,e)||(u=b.style(e,n)),Yt.test(u)&&Ut.test(n)&&(i=l.width,o=l.minWidth,a=l.maxWidth,l.minWidth=l.maxWidth=l.width=u,u=s.width,l.width=i,l.minWidth=o,l.maxWidth=a)),u}):o.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s[n]:t,l=e.style;return null==u&&l&&l[n]&&(u=l[n]),Yt.test(u)&&!zt.test(n)&&(i=l.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),l.left="fontSize"===n?"1em":u,u=l.pixelLeft+"px",l.left=i,a&&(o.left=a)),""===u?"auto":u});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=b.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=b.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=b.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=b.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=b.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(b.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function un(e){var t=o,n=Gt[e];return n||(n=ln(e,t),"none"!==n&&n||(Pt=(Pt||b("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=ln(e,t),Pt.detach()),Gt[e]=n),n}function ln(e,t){var n=b(t.createElement(e)).appendTo(t.body),r=b.css(n[0],"display");return n.remove(),r}b.each(["height","width"],function(e,n){b.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(b.css(e,"display"))?b.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,i),i):0)}}}),b.support.opacity||(b.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=b.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===b.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),b(function(){b.support.reliableMarginRight||(b.cssHooks.marginRight={get:function(e,n){return n?b.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!b.support.pixelPosition&&b.fn.position&&b.each(["top","left"],function(e,n){b.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?b(e).position()[n]+"px":r):t}}})}),b.expr&&b.expr.filters&&(b.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!b.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||b.css(e,"display"))},b.expr.filters.visible=function(e){return!b.expr.filters.hidden(e)}),b.each({margin:"",padding:"",border:"Width"},function(e,t){b.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(b.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;b.fn.extend({serialize:function(){return b.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=b.prop(this,"elements");return e?b.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!b(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Nt.test(e))}).map(function(e,t){var n=b(this).val();return null==n?null:b.isArray(n)?b.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),b.param=function(e,n){var r,i=[],o=function(e,t){t=b.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=b.ajaxSettings&&b.ajaxSettings.traditional),b.isArray(e)||e.jquery&&!b.isPlainObject(e))b.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(b.isArray(t))b.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==b.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}b.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){b.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),b.fn.hover=function(e,t){return this.mouseenter(e).mouseleave(t||e)};var mn,yn,vn=b.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Nn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Cn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=b.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=a.href}catch(Ln){yn=o.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];if(b.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(u){var l;return o[u]=!0,b.each(e[u]||[],function(e,u){var c=u(n,r,i);return"string"!=typeof c||a||o[c]?a?!(l=c):t:(n.dataTypes.unshift(c),s(c),!1)}),l}return s(n.dataTypes[0])||!o["*"]&&s("*")}function Mn(e,n){var r,i,o=b.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&b.extend(!0,e,r),e}b.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,u=e.indexOf(" ");return u>=0&&(i=e.slice(u,e.length),e=e.slice(0,u)),b.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&b.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?b("<div>").append(b.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},b.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){b.fn[t]=function(e){return this.on(t,e)}}),b.each(["get","post"],function(e,n){b[n]=function(e,r,i,o){return b.isFunction(r)&&(o=o||i,i=r,r=t),b.ajax({url:e,type:n,dataType:o,data:r,success:i})}}),b.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Nn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":e.String,"text html":!0,"text json":b.parseJSON,"text xml":b.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Mn(Mn(e,b.ajaxSettings),t):Mn(b.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,u,l,c,p=b.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?b(f):b.event,h=b.Deferred(),g=b.Callbacks("once memory"),m=p.statusCode||{},y={},v={},x=0,T="canceled",N={readyState:0,getResponseHeader:function(e){var t;if(2===x){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===x?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return x||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return x||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>x)for(t in e)m[t]=[m[t],e[t]];else N.always(e[N.status]);return this},abort:function(e){var t=e||T;return l&&l.abort(t),k(0,t),this}};if(h.promise(N).complete=g.add,N.success=N.done,N.error=N.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=b.trim(p.dataType||"*").toLowerCase().match(w)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?80:443))==(mn[3]||("http:"===mn[1]?80:443)))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=b.param(p.data,p.traditional)),qn(An,p,n,N),2===x)return N;u=p.global,u&&0===b.active++&&b.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Cn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(b.lastModified[o]&&N.setRequestHeader("If-Modified-Since",b.lastModified[o]),b.etag[o]&&N.setRequestHeader("If-None-Match",b.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&N.setRequestHeader("Content-Type",p.contentType),N.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)N.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,N,p)===!1||2===x))return N.abort();T="abort";for(i in{success:1,error:1,complete:1})N[i](p[i]);if(l=qn(jn,p,n,N)){N.readyState=1,u&&d.trigger("ajaxSend",[N,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){N.abort("timeout")},p.timeout));try{x=1,l.send(y,k)}catch(C){if(!(2>x))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,C=n;2!==x&&(x=2,s&&clearTimeout(s),l=t,a=i||"",N.readyState=e>0?4:0,r&&(w=_n(p,N,r)),e>=200&&300>e||304===e?(p.ifModified&&(T=N.getResponseHeader("Last-Modified"),T&&(b.lastModified[o]=T),T=N.getResponseHeader("etag"),T&&(b.etag[o]=T)),204===e?(c=!0,C="nocontent"):304===e?(c=!0,C="notmodified"):(c=Fn(p,w),C=c.state,y=c.data,v=c.error,c=!v)):(v=C,(e||!C)&&(C="error",0>e&&(e=0))),N.status=e,N.statusText=(n||C)+"",c?h.resolveWith(f,[y,C,N]):h.rejectWith(f,[N,C,v]),N.statusCode(m),m=t,u&&d.trigger(c?"ajaxSuccess":"ajaxError",[N,p,c?y:v]),g.fireWith(f,[N,C]),u&&(d.trigger("ajaxComplete",[N,p]),--b.active||b.event.trigger("ajaxStop")))}return N},getScript:function(e,n){return b.get(e,t,n,"script")},getJSON:function(e,t,n){return b.get(e,t,n,"json")}});function _n(e,n,r){var i,o,a,s,u=e.contents,l=e.dataTypes,c=e.responseFields;for(s in c)s in r&&(n[c[s]]=r[s]);while("*"===l[0])l.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in u)if(u[s]&&u[s].test(o)){l.unshift(s);break}if(l[0]in r)a=l[0];else{for(s in r){if(!l[0]||e.converters[s+" "+l[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==l[0]&&l.unshift(a),r[a]):t}function Fn(e,t){var n,r,i,o,a={},s=0,u=e.dataTypes.slice(),l=u[0];if(e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u[1])for(i in e.converters)a[i.toLowerCase()]=e.converters[i];for(;r=u[++s];)if("*"!==r){if("*"!==l&&l!==r){if(i=a[l+" "+r]||a["* "+r],!i)for(n in a)if(o=n.split(" "),o[1]===r&&(i=a[l+" "+o[0]]||a["* "+o[0]])){i===!0?i=a[n]:a[n]!==!0&&(r=o[0],u.splice(s--,0,r));break}if(i!==!0)if(i&&e["throws"])t=i(t);else try{t=i(t)}catch(c){return{state:"parsererror",error:i?c:"No conversion from "+l+" to "+r}}}l=r}return{state:"success",data:t}}b.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return b.globalEval(e),e}}}),b.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),b.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=o.head||b("head")[0]||o.documentElement;return{send:function(t,i){n=o.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var On=[],Bn=/(=)\?(?=&|$)|\?\?/;b.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=On.pop()||b.expando+"_"+vn++;return this[e]=!0,e}}),b.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,u=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return u||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=b.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,u?n[u]=n[u].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||b.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,On.push(o)),s&&b.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}b.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=b.ajaxSettings.xhr(),b.support.cors=!!Rn&&"withCredentials"in Rn,Rn=b.support.ajax=!!Rn,Rn&&b.ajaxTransport(function(n){if(!n.crossDomain||b.support.cors){var r;return{send:function(i,o){var a,s,u=n.xhr();if(n.username?u.open(n.type,n.url,n.async,n.username,n.password):u.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)u[s]=n.xhrFields[s];n.mimeType&&u.overrideMimeType&&u.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)u.setRequestHeader(s,i[s])}catch(l){}u.send(n.hasContent&&n.data||null),r=function(e,i){var s,l,c,p;try{if(r&&(i||4===u.readyState))if(r=t,a&&(u.onreadystatechange=b.noop,$n&&delete Pn[a]),i)4!==u.readyState&&u.abort();else{p={},s=u.status,l=u.getAllResponseHeaders(),"string"==typeof u.responseText&&(p.text=u.responseText);try{c=u.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,l)},n.async?4===u.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},b(e).unload($n)),Pn[a]=r),u.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+x+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n,r,i=this.createTween(e,t),o=Yn.exec(t),a=i.cur(),s=+a||0,u=1,l=20;if(o){if(n=+o[2],r=o[3]||(b.cssNumber[e]?"":"px"),"px"!==r&&s){s=b.css(i.elem,e,!0)||n||1;do u=u||".5",s/=u,b.style(i.elem,e,s+r);while(u!==(u=i.cur()/a)&&1!==u&&--l)}i.unit=r,i.start=s,i.end=o[1]?s+(o[1]+1)*n:n}return i}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=b.now()}function Zn(e,t){b.each(t,function(t,n){var r=(Qn[t]||[]).concat(Qn["*"]),i=0,o=r.length;for(;o>i;i++)if(r[i].call(e,t,n))return})}function er(e,t,n){var r,i,o=0,a=Gn.length,s=b.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,a=0,u=l.tweens.length;for(;u>a;a++)l.tweens[a].run(o);return s.notifyWith(e,[l,o,n]),1>o&&u?n:(s.resolveWith(e,[l]),!1)},l=s.promise({elem:e,props:b.extend({},t),opts:b.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=b.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?s.resolveWith(e,[l,t]):s.rejectWith(e,[l,t]),this}}),c=l.props;for(tr(c,l.opts.specialEasing);a>o;o++)if(r=Gn[o].call(l,e,c,l.opts))return r;return Zn(l,c),b.isFunction(l.opts.start)&&l.opts.start.call(e,l),b.fx.timer(b.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function tr(e,t){var n,r,i,o,a;for(i in e)if(r=b.camelCase(i),o=t[r],n=e[i],b.isArray(n)&&(o=n[1],n=e[i]=n[0]),i!==r&&(e[r]=n,delete e[i]),a=b.cssHooks[r],a&&"expand"in a){n=a.expand(n),delete e[r];for(i in n)i in e||(e[i]=n[i],t[i]=o)}else t[r]=o}b.Animation=b.extend(er,{tweener:function(e,t){b.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,u,l,c,p,f=this,d=e.style,h={},g=[],m=e.nodeType&&nn(e);n.queue||(c=b._queueHooks(e,"fx"),null==c.unqueued&&(c.unqueued=0,p=c.empty.fire,c.empty.fire=function(){c.unqueued||p()}),c.unqueued++,f.always(function(){f.always(function(){c.unqueued--,b.queue(e,"fx").length||c.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[d.overflow,d.overflowX,d.overflowY],"inline"===b.css(e,"display")&&"none"===b.css(e,"float")&&(b.support.inlineBlockNeedsLayout&&"inline"!==un(e.nodeName)?d.zoom=1:d.display="inline-block")),n.overflow&&(d.overflow="hidden",b.support.shrinkWrapBlocks||f.always(function(){d.overflow=n.overflow[0],d.overflowX=n.overflow[1],d.overflowY=n.overflow[2]}));for(i in t)if(a=t[i],Vn.exec(a)){if(delete t[i],u=u||"toggle"===a,a===(m?"hide":"show"))continue;g.push(i)}if(o=g.length){s=b._data(e,"fxshow")||b._data(e,"fxshow",{}),"hidden"in s&&(m=s.hidden),u&&(s.hidden=!m),m?b(e).show():f.done(function(){b(e).hide()}),f.done(function(){var t;b._removeData(e,"fxshow");for(t in h)b.style(e,t,h[t])});for(i=0;o>i;i++)r=g[i],l=f.createTween(r,m?s[r]:0),h[r]=s[r]||b.style(e,r),r in s||(s[r]=l.start,m&&(l.end=l.start,l.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}b.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(b.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?b.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=b.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){b.fx.step[e.prop]?b.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[b.cssProps[e.prop]]||b.cssHooks[e.prop])?b.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},b.each(["toggle","show","hide"],function(e,t){var n=b.fn[t];b.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),b.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=b.isEmptyObject(e),o=b.speed(t,n,r),a=function(){var t=er(this,b.extend({},e),o);a.finish=function(){t.stop(!0)},(i||b._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=b.timers,a=b._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&b.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=b._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=b.timers,a=r?r.length:0;for(n.finish=!0,b.queue(this,e,[]),i&&i.cur&&i.cur.finish&&i.cur.finish.call(this),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}b.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){b.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),b.speed=function(e,t,n){var r=e&&"object"==typeof e?b.extend({},e):{complete:n||!n&&t||b.isFunction(e)&&e,duration:e,easing:n&&t||t&&!b.isFunction(t)&&t};return r.duration=b.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in b.fx.speeds?b.fx.speeds[r.duration]:b.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){b.isFunction(r.old)&&r.old.call(this),r.queue&&b.dequeue(this,r.queue)},r},b.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},b.timers=[],b.fx=rr.prototype.init,b.fx.tick=function(){var e,n=b.timers,r=0;for(Xn=b.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||b.fx.stop(),Xn=t},b.fx.timer=function(e){e()&&b.timers.push(e)&&b.fx.start()},b.fx.interval=13,b.fx.start=function(){Un||(Un=setInterval(b.fx.tick,b.fx.interval))},b.fx.stop=function(){clearInterval(Un),Un=null},b.fx.speeds={slow:600,fast:200,_default:400},b.fx.step={},b.expr&&b.expr.filters&&(b.expr.filters.animated=function(e){return b.grep(b.timers,function(t){return e===t.elem}).length}),b.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){b.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,b.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},b.offset={setOffset:function(e,t,n){var r=b.css(e,"position");"static"===r&&(e.style.position="relative");var i=b(e),o=i.offset(),a=b.css(e,"top"),s=b.css(e,"left"),u=("absolute"===r||"fixed"===r)&&b.inArray("auto",[a,s])>-1,l={},c={},p,f;u?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),b.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(l.top=t.top-o.top+p),null!=t.left&&(l.left=t.left-o.left+f),"using"in t?t.using.call(e,l):i.css(l)}},b.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===b.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),b.nodeName(e[0],"html")||(n=e.offset()),n.top+=b.css(e[0],"borderTopWidth",!0),n.left+=b.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-b.css(r,"marginTop",!0),left:t.left-n.left-b.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||o.documentElement;while(e&&!b.nodeName(e,"html")&&"static"===b.css(e,"position"))e=e.offsetParent;return e||o.documentElement})}}),b.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);b.fn[e]=function(i){return b.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?b(a).scrollLeft():o,r?o:b(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return b.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}b.each({Height:"height",Width:"width"},function(e,n){b.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){b.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return b.access(this,function(n,r,i){var o;return b.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?b.css(n,r,s):b.style(n,r,i,s)},n,a?i:t,a,null)}})}),e.jQuery=e.$=b,"function"==typeof define&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return b})})(window);

    //tostr提示框库
    !function(e){e(["jquery"],function(e){return function(){function t(e,t,n){return g({type:O.error,iconClass:m().iconClasses.error,message:e,optionsOverride:n,title:t})}function n(t,n){return t||(t=m()),v=e("#"+t.containerId),v.length?v:(n&&(v=d(t)),v)}function o(e,t,n){return g({type:O.info,iconClass:m().iconClasses.info,message:e,optionsOverride:n,title:t})}function s(e){C=e}function i(e,t,n){return g({type:O.success,iconClass:m().iconClasses.success,message:e,optionsOverride:n,title:t})}function a(e,t,n){return g({type:O.warning,iconClass:m().iconClasses.warning,message:e,optionsOverride:n,title:t})}function r(e,t){var o=m();v||n(o),u(e,o,t)||l(o)}function c(t){var o=m();return v||n(o),t&&0===e(":focus",t).length?void h(t):void(v.children().length&&v.remove())}function l(t){for(var n=v.children(),o=n.length-1;o>=0;o--)u(e(n[o]),t)}function u(t,n,o){var s=!(!o||!o.force)&&o.force;return!(!t||!s&&0!==e(":focus",t).length)&&(t[n.hideMethod]({duration:n.hideDuration,easing:n.hideEasing,complete:function(){h(t)}}),!0)}function d(t){return v=e("<div/>").attr("id",t.containerId).addClass(t.positionClass),v.appendTo(e(t.target)),v}function p(){return{tapToDismiss:!0,toastClass:"toast",containerId:"toast-container",debug:!1,showMethod:"fadeIn",showDuration:300,showEasing:"swing",onShown:void 0,hideMethod:"fadeOut",hideDuration:1e3,hideEasing:"swing",onHidden:void 0,closeMethod:!1,closeDuration:!1,closeEasing:!1,closeOnHover:!0,extendedTimeOut:1e3,iconClasses:{error:"toast-error",info:"toast-info",success:"toast-success",warning:"toast-warning"},iconClass:"toast-info",positionClass:"toast-top-right",timeOut:5e3,titleClass:"toast-title",messageClass:"toast-message",escapeHtml:!1,target:"body",closeHtml:'<button type="button">&times;</button>',closeClass:"toast-close-button",newestOnTop:!0,preventDuplicates:!1,progressBar:!1,progressClass:"toast-progress",rtl:!1}}function f(e){C&&C(e)}function g(t){function o(e){return null==e&&(e=""),e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function s(){c(),u(),d(),p(),g(),C(),l(),i()}function i(){var e="";switch(t.iconClass){case"toast-success":case"toast-info":e="polite";break;default:e="assertive"}I.attr("aria-live",e)}function a(){E.closeOnHover&&I.hover(H,D),!E.onclick&&E.tapToDismiss&&I.click(b),E.closeButton&&j&&j.click(function(e){e.stopPropagation?e.stopPropagation():void 0!==e.cancelBubble&&e.cancelBubble!==!0&&(e.cancelBubble=!0),E.onCloseClick&&E.onCloseClick(e),b(!0)}),E.onclick&&I.click(function(e){E.onclick(e),b()})}function r(){I.hide(),I[E.showMethod]({duration:E.showDuration,easing:E.showEasing,complete:E.onShown}),E.timeOut>0&&(k=setTimeout(b,E.timeOut),F.maxHideTime=parseFloat(E.timeOut),F.hideEta=(new Date).getTime()+F.maxHideTime,E.progressBar&&(F.intervalId=setInterval(x,10)))}function c(){t.iconClass&&I.addClass(E.toastClass).addClass(y)}function l(){E.newestOnTop?v.prepend(I):v.append(I)}function u(){if(t.title){var e=t.title;E.escapeHtml&&(e=o(t.title)),M.append(e).addClass(E.titleClass),I.append(M)}}function d(){if(t.message){var e=t.message;E.escapeHtml&&(e=o(t.message)),B.append(e).addClass(E.messageClass),I.append(B)}}function p(){E.closeButton&&(j.addClass(E.closeClass).attr("role","button"),I.prepend(j))}function g(){E.progressBar&&(q.addClass(E.progressClass),I.prepend(q))}function C(){E.rtl&&I.addClass("rtl")}function O(e,t){if(e.preventDuplicates){if(t.message===w)return!0;w=t.message}return!1}function b(t){var n=t&&E.closeMethod!==!1?E.closeMethod:E.hideMethod,o=t&&E.closeDuration!==!1?E.closeDuration:E.hideDuration,s=t&&E.closeEasing!==!1?E.closeEasing:E.hideEasing;if(!e(":focus",I).length||t)return clearTimeout(F.intervalId),I[n]({duration:o,easing:s,complete:function(){h(I),clearTimeout(k),E.onHidden&&"hidden"!==P.state&&E.onHidden(),P.state="hidden",P.endTime=new Date,f(P)}})}function D(){(E.timeOut>0||E.extendedTimeOut>0)&&(k=setTimeout(b,E.extendedTimeOut),F.maxHideTime=parseFloat(E.extendedTimeOut),F.hideEta=(new Date).getTime()+F.maxHideTime)}function H(){clearTimeout(k),F.hideEta=0,I.stop(!0,!0)[E.showMethod]({duration:E.showDuration,easing:E.showEasing})}function x(){var e=(F.hideEta-(new Date).getTime())/F.maxHideTime*100;q.width(e+"%")}var E=m(),y=t.iconClass||E.iconClass;if("undefined"!=typeof t.optionsOverride&&(E=e.extend(E,t.optionsOverride),y=t.optionsOverride.iconClass||y),!O(E,t)){T++,v=n(E,!0);var k=null,I=e("<div/>"),M=e("<div/>"),B=e("<div/>"),q=e("<div/>"),j=e(E.closeHtml),F={intervalId:null,hideEta:null,maxHideTime:null},P={toastId:T,state:"visible",startTime:new Date,options:E,map:t};return s(),r(),a(),f(P),E.debug&&console&&console.log(P),I}}function m(){return e.extend({},p(),b.options)}function h(e){v||(v=n()),e.is(":visible")||(e.remove(),e=null,0===v.children().length&&(v.remove(),w=void 0))}var v,C,w,T=0,O={error:"error",info:"info",success:"success",warning:"warning"},b={clear:r,remove:c,error:t,getContainer:n,info:o,options:{},subscribe:s,success:i,version:"2.1.3",warning:a};return b}()})}("function"==typeof define&&define.amd?define:function(e,t){"undefined"!=typeof module&&module.exports?module.exports=t(require("jquery")):window.toastr=t(window.jQuery)});
    (function(){$("head").append('<style>.toast-title{font-weight:700}.toast-message{-ms-word-wrap:break-word;word-wrap:break-word}.toast-message a,.toast-message label{color:#FFF}.toast-message a:hover{color:#CCC;text-decoration:none}.toast-close-button{position:relative;right:-.3em;top:-.3em;float:right;font-size:20px;font-weight:700;color:#FFF;-webkit-text-shadow:0 1px 0#fff;text-shadow:0 1px 0#fff;opacity:.8;-ms-filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=80);filter:alpha(opacity=80);line-height:1}.toast-close-button:focus,.toast-close-button:hover{color:#000;text-decoration:none;cursor:pointer;opacity:.4;-ms-filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=40);filter:alpha(opacity=40)}.rtl.toast-close-button{left:-.3em;float:left;right:.3em}button.toast-close-button{padding:0;cursor:pointer;background:0 0;border:0;-webkit-appearance:none}.toast-top-center{top:0;right:0;width:100%}.toast-bottom-center{bottom:0;right:0;width:100%}.toast-top-full-width{top:0;right:0;width:100%}.toast-bottom-full-width{bottom:0;right:0;width:100%}.toast-top-left{top:12px;left:12px}.toast-top-right{top:12px;right:12px}.toast-bottom-right{right:12px;bottom:12px}.toast-bottom-left{bottom:12px;left:12px}#toast-container{position:fixed;z-index:999999;pointer-events:none}#toast-container*{-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box}#toast-container>div{position:relative;pointer-events:auto;overflow:hidden;margin:0 0 6px;padding:15px 15px 15px 50px;width:300px;-moz-border-radius:3px;-webkit-border-radius:3px;border-radius:3px;background-position:15px center;background-repeat:no-repeat;-moz-box-shadow:0 0 12px#999;-webkit-box-shadow:0 0 12px#999;box-shadow:0 0 12px#999;color:#FFF;opacity:.8;-ms-filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=80);filter:alpha(opacity=80)}#toast-container>div.rtl{direction:rtl;padding:15px 50px 15px 15px;background-position:right 15px center}#toast-container>div:hover{-moz-box-shadow:0 0 12px#000;-webkit-box-shadow:0 0 12px#000;box-shadow:0 0 12px#000;opacity:1;-ms-filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=100);filter:alpha(opacity=100);cursor:pointer}#toast-container>.toast-info{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGwSURBVEhLtZa9SgNBEMc9sUxxRcoUKSzSWIhXpFMhhYWFhaBg4yPYiWCXZxBLERsLRS3EQkEfwCKdjWJAwSKCgoKCcudv4O5YLrt7EzgXhiU3/4+b2ckmwVjJSpKkQ6wAi4gwhT+z3wRBcEz0yjSseUTrcRyfsHsXmD0AmbHOC9Ii8VImnuXBPglHpQ5wwSVM7sNnTG7Za4JwDdCjxyAiH3nyA2mtaTJufiDZ5dCaqlItILh1NHatfN5skvjx9Z38m69CgzuXmZgVrPIGE763Jx9qKsRozWYw6xOHdER+nn2KkO+Bb+UV5CBN6WC6QtBgbRVozrahAbmm6HtUsgtPC19tFdxXZYBOfkbmFJ1VaHA1VAHjd0pp70oTZzvR+EVrx2Ygfdsq6eu55BHYR8hlcki+n+kERUFG8BrA0BwjeAv2M8WLQBtcy+SD6fNsmnB3AlBLrgTtVW1c2QN4bVWLATaIS60J2Du5y1TiJgjSBvFVZgTmwCU+dAZFoPxGEEs8nyHC9Bwe2GvEJv2WXZb0vjdyFT4Cxk3e/kIqlOGoVLwwPevpYHT+00T+hWwXDf4AJAOUqWcDhbwAAAAASUVORK5CYII=)!important}#toast-container>.toast-error{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHOSURBVEhLrZa/SgNBEMZzh0WKCClSCKaIYOED+AAKeQQLG8HWztLCImBrYadgIdY+gIKNYkBFSwu7CAoqCgkkoGBI/E28PdbLZmeDLgzZzcx83/zZ2SSXC1j9fr+I1Hq93g2yxH4iwM1vkoBWAdxCmpzTxfkN2RcyZNaHFIkSo10+8kgxkXIURV5HGxTmFuc75B2RfQkpxHG8aAgaAFa0tAHqYFfQ7Iwe2yhODk8+J4C7yAoRTWI3w/4klGRgR4lO7Rpn9+gvMyWp+uxFh8+H+ARlgN1nJuJuQAYvNkEnwGFck18Er4q3egEc/oO+mhLdKgRyhdNFiacC0rlOCbhNVz4H9FnAYgDBvU3QIioZlJFLJtsoHYRDfiZoUyIxqCtRpVlANq0EU4dApjrtgezPFad5S19Wgjkc0hNVnuF4HjVA6C7QrSIbylB+oZe3aHgBsqlNqKYH48jXyJKMuAbiyVJ8KzaB3eRc0pg9VwQ4niFryI68qiOi3AbjwdsfnAtk0bCjTLJKr6mrD9g8iq/S/B81hguOMlQTnVyG40wAcjnmgsCNESDrjme7wfftP4P7SP4N3CJZdvzoNyGq2c/HWOXJGsvVg+RA/k2MC/wN6I2YA2Pt8GkAAAAASUVORK5CYII=)!important}#toast-container>.toast-success{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADsSURBVEhLY2AYBfQMgf</style>');})();
    //hDialog弹出层
    //!function($,window,document,undefined){var _doc=$(document),$body=$('body');methods={init:function(options){return this.each(function(){var $this=$(this),opt=$this.data('hDialog');if(typeof(opt)=='undefined'){var defaults={title:'',box:'#HBox',boxBg:'#fff',modalBg:'rgba(0,0,0,0.5)',closeBg:'#ccc',width:300,height:270,positions:'center',triggerEvent:'click',effect:'hide',resetForm:true,modalHide:true,closeHide:true,escHide:true,beforeShow:function(){},afterHide:function(){}};opt=$.extend({},defaults,options);$this.data('hDialog',opt)}opt=$.extend({},opt,options);$(opt.box).hide();$this.on(opt.triggerEvent,function(){if(opt.resetForm){var $obj=$(opt.box);$obj.find('input[type=text],textarea').val('');$obj.find('select option').removeAttr('selected');$obj.find('input[type=radio],input[type=checkbox]').removeAttr('checked')}if(opt.escHide){$(document).keyup(function(event){switch(event.keyCode){case 27:methods.close(opt);break}})}methods.fire.call(this,opt.beforeShow);methods.add(opt,$this);var $close=$('#HCloseBtn');if(opt.modalHide){$close=$('#HOverlay,#HCloseBtn')}$close.on('click',function(event){event=event||window.event;event.stopPropagation();methods.close(opt)})})})},add:function(o,$this){var w,h,t,l,m;$obj=$(o.box);title=o.title;c=$this.attr("class");modalBg=o.modalBg;closeBg=o.closeBg;w=o.width!=undefined?parseInt(o.width):'300';h=o.height!=undefined?parseInt(o.height):'270';m=""+(-(h/2))+'px 0 0 '+(-(w/2))+"px";switch(o.positions){case'center':t=l='50%';break;case'top':t=0;l='50%';m="0 0 0 "+(-(w/2))+"px";break;case'left':t=l=m=0;break;default:t=l='50%'}methods.remove('#HOverlay,#HCloseBtn,#HTitle');$body.stop().append("<div id='HOverlay' style='width:"+_doc.width()+"px;height:"+_doc.height()+"px;background-color:"+modalBg+";position:fixed;top:0;left:0;z-index:9999;'></div>");if(o.title!=''){$obj.stop().prepend('<div id="HTitle" style="padding:10px 45px 10px 12px;border-bottom:1px solid #ddd;background-color:#f2f2f2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+o.title+'</div>')}if(o.closeHide!=false){$obj.stop().append('<a id="HCloseBtn" title="关闭" style="width:24px;height:24px;line-height:18px;display:inline-block;cursor:pointer;background-color:'+closeBg+';color:#fff;font-size:1.4em;text-align:center;position:absolute;top:8px;right:8px;"><span style="width:24px;height:24px;display:inline-block;">×</span></a>').css({'position':'fixed','backgroundColor':o.boxBg,'top':t,'left':l,'margin':m,'zIndex':'100000'})}$obj.stop().animate({'width':o.width,'height':o.height},300).removeAttr('class').addClass('animated '+c+'').show()},close:function(o,urls){var $obj=$(o.box);switch(o.effect){case"hide":$obj.stop().hide(_effect);break;case"fadeOut":$obj.stop().fadeOut(_effect);break;default:$obj.stop().hide(_effect)}function _effect(){methods.remove('#HOverlay,.HTooltip');$(this).removeAttr('class').removeAttr('style').addClass('animated').hide();if(urls!=undefined){setTimeout(function(){window.location.href=urls},1000)}methods.fire.call(this,o.afterHide)}},remove:function(a){$(a).remove()},fire:function(event,data){if($.isFunction(event)){return event.call(this,data)}}};$.fn.hDialog=function(method){if(methods[method]){return methods[method].apply(this,Array.prototype.slice.call(arguments,1))}else if(typeof method==='object'||!method){return methods.init.apply(this,arguments)}else{$.error('Error! Method'+method+'does not exist on jQuery.hDialog！')}};$.extend({showLoading:function(t,w,h){t=t!=undefined?t:'正在加载...';w=w!=undefined?parseInt(w):'90';h=h!=undefined?parseInt(h):'30';var margin=""+(-(h/2))+'px 0 0 '+(-(w/2))+"px";methods.remove('#HLoading');$body.stop().append('<div id="HLoading" style="width:'+w+'px;height:'+h+'px;line-height:'+h+'px;background:rgba(0,0,0,0.6);color:#fff;text-align:center;position:fixed;top:50%;left:50%;margin:'+margin+';">'+t+'</div>')},hideLoading:function(){methods.remove('#HLoading')},tooltip:function(t1,t2,t3){t1=t1!=undefined?t1:'哎呀，出错啦 ！';t2=t2!=undefined?parseInt(t2):2500;var tip='<div class="HTooltip shake animated" style="width:280px;padding:10px;text-align:center;background-color:#D84C31;color:#fff;position:fixed;top:10px;left:50%;z-index:100001;margin-left:-150px;box-shadow:1px 1px 5px #333;-webkit-box-shadow:1px 1px 5px #333;">'+t1+'</div>';if(t3){tip='<div class="HTooltip fadeIn animated" style="width:280px;padding:10px;text-align:center;background-color:#5cb85c;color:#fff;position:fixed;top:10px;left:50%;z-index:100001;margin-left:-150px;box-shadow:1px 1px 5px #333;-webkit-box-shadow:1px 1px 5px #333;">'+t1+'</div>'}methods.remove('.HTooltip');$body.stop().append(tip);setTimeout(function(){methods.remove('.HTooltip')},t2)},goTop:function(b,r){b=b!=undefined?b:'30px';r=r!=undefined?r:'20px';methods.remove('#HGoTop');$body.stop().append('<a id="HGoTop" href="javascript:;" class="animated" style="width:40px;height:40px;line-height:40px;display:inline-block;text-align:center;background:#333;color:#fff;position:fixed;bottom:'+b+';right:'+r+';z-index:100000;">Top</a>').find('#HGoTop').hide();$(window).scroll(function(){if($(window).scrollTop()>150){$('#HGoTop').removeClass('rollIn rollOut').addClass('rollIn').show()}else{$('#HGoTop').removeClass('rollIn rollOut').addClass('rollOut')}});$('#HGoTop').on('click',function(){$('body,html').animate({scrollTop:0},500);return false})}})}

    class EDE {
        constructor() {
            this.xml_uploader = new XMLUploader(api_url + "danmuku?type=upload");
            this.xml_uploader.init();

            this.chConvert = 1;
            if (window.localStorage.getItem('chConvert')) {
                this.chConvert = window.localStorage.getItem('chConvert');
            }
            //弹幕属性
            this.danmuLimit = 5;
            if (window.localStorage.getItem('danmuLimit')) {
                this.danmuLimit = window.localStorage.getItem('danmuLimit');
            }
            this.danmuSize = 25;
            if (window.localStorage.getItem('danmuSize')) {
                this.danmuSize = window.localStorage.getItem('danmuSize');
            }
            // 0:当前状态关闭 1:当前状态打开
            this.danmakuSwitch = 1;
            if (window.localStorage.getItem('danmakuSwitch')) {
                this.danmakuSwitch = parseInt(window.localStorage.getItem('danmakuSwitch'));
            }
            this.withSwitch = 1;
            if (window.localStorage.getItem('withSwitch')) {
                this.withSwitch = parseInt(window.localStorage.getItem('withSwitch'));
            }
            this.danmaku = null;
            this.episode_info = null;
            this.ob = null;
            this.reloading = false;
        }
    }

    function console_log(data){
        console.log(data);
        data = JSON.stringify(data);
        toastr.info(data);//提醒

    }

    function dialog(title, data){

    }

    function createButton(opt, onclick) {
        let button = document.createElement('button', buttonOptions);
        button.setAttribute('title', opt.title);
        button.setAttribute('id', opt.id);
        let icon = document.createElement('span');
        icon.className = 'md-icon';
        icon.innerText = opt.innerText;
        button.appendChild(icon);
        button.onclick = onclick;
        return button;
    }

    function createButton2(opt, onclick){
        //<button is="paper-icon-button-light" class="btnVideoOsdSettings btnVideoOsdSettings-right videoOsd-hideWhenLocked paper-icon-button-light" title="设置" aria-label="设置"><i class="largePaperIconButton md-icon"></i></button>

        let button = document.createElement('button', buttonOptions);
        button.setAttribute('title', opt.title);
        button.setAttribute('id', opt.id);
    }

    function displayButtonClick() {
        console_log('切换弹幕开关');
        window.ede.danmakuSwitch = (window.ede.danmakuSwitch + 1) % 2;
        window.localStorage.setItem('danmakuSwitch', window.ede.danmakuSwitch);
        document.querySelector('#displayDanmaku').children[0].innerText = danmaku_icon[window.ede.danmakuSwitch];
        if (window.ede.danmaku) {
            window.ede.danmakuSwitch == 1 ? window.ede.danmaku.show() : window.ede.danmaku.hidden();
        }
    }

    function searchButtonClick() {

        // // 获取当前页面的HTML代码
        // var currentHtml = document.documentElement.outerHTML;
        //
        // // 使用prompt()方法弹出一个带输入框的提示框，并将当前页面的HTML代码作为默认值
        // var userInput = prompt("请输入HTML代码：", currentHtml);

        console_log('手动匹配弹幕');
        reloadDanmaku('search');
    }

    async function localButtonClick() {
        console_log('上传本地弹幕');
        let item = await getEmbyItemInfo();
        console.log(item);
        if(item){
            window.ede.xml_uploader.setVideoInfo(item);
            window.ede.xml_uploader.setCallBack(function(data){
                if(data["status"] == "success"){
                    console_log("成功引用本地弹幕数量:" + data["count"]);
                    reloadDanmaku('reload');
                }
                else{
                    console_log("引用本地弹幕失败");
                }
            });
            window.ede.xml_uploader.chooseFile();
        }
    }

    async function autoexportBUttonClick(){
        console_log('尝试自动引用');
        let item = await getEmbyItemInfo();
        let video_id, animeName, episode;
        if (item.Type == 'Episode') {
            video_id = item.Id;
            animeName = item.SeriesName;
            episode = item.IndexNumber.toString();
            let session = item.ParentIndexNumber;
            if (session != 1) {
                animeName += ' 第' + session + '季';
            }
            if (session == 0){
                animeName += ' ova';
            }
            let _name_key = '_anime_name_rel_' + item.SeasonId;
            if (window.localStorage.getItem(_name_key)) {
                animeName = window.localStorage.getItem(_name_key);
            }
        } else {
            video_id = item.Id;
            animeName = item.Name;
            episode = '0';
        }

        let data = {
                "id": video_id,
                "title": animeName,
                "episode": episode
            };
        let options = {
            method: "POST",
            body: JSON.stringify(data),
            headers: new Headers({
                            'Content-Type': 'application/json'
                          })
        };
        let response = await fetch(api_url + "danmuku?type=export", options);
        if(response.status == 200){
            let data = await response.json();
            console.log(data);
            if(data["status"] == "success"){
                console_log("成功引用第三方弹幕数量:" + data["count"]);
                reloadDanmaku('reload');
            }
            else{
                console_log("引用第三方弹幕失败");
            }
        }


    }

    async function exportBUttonClick(){
        console_log('引用其他网站弹幕');
        let item = await getEmbyItemInfo();


        let video_id, animeName, episode;
        if (item.Type == 'Episode') {
            video_id = item.Id;
            animeName = item.SeriesName;
            episode = item.IndexNumber.toString();
            let session = item.ParentIndexNumber;
            if (session != 1) {
                animeName += ' 第' + session + '季';
            }
            if (session == 0){
                animeName += ' ova';
            }
            let _name_key = '_anime_name_rel_' + item.SeasonId;
            if (window.localStorage.getItem(_name_key)) {
                animeName = window.localStorage.getItem(_name_key);
            }


        } else {
            video_id = item.Id;
            animeName = item.Name;
            episode = 'movie';
        }

        let export_url = prompt('请输入引用的第三方视频网址(支持: 腾讯, 爱奇艺)\n 爱奇艺列表: base_info?entity_id=', '');
        if(export_url != ''){
            let data = {
                "id": video_id,
                "title": animeName,
                "episode": episode,
                "export_url": export_url
            };
            let options = {
                method: "POST",
                body: JSON.stringify(data),
                headers: new Headers({
                                'Content-Type': 'application/json'
                              })
            };

            let response = await fetch(api_url + "danmuku?type=export", options);
            if(response.status == 200){
                let data = await response.json();
                console.log(data);
                if(data["status"] == "success"){
                    console_log("成功引用第三方弹幕数量:" + data["count"]);
                    reloadDanmaku('reload');
                }
                else{
                    console_log("引用第三方弹幕失败");
                }
            }

        }

    }

    function translateButtonClick() {
        if (window.ede.reloading) {
            console_log('正在重新加载,请稍后再试');
            return;
        }
        console_log('切换简繁转换');
        window.ede.chConvert = (window.ede.chConvert + 1) % 3;
        window.localStorage.setItem('chConvert', window.ede.chConvert);
        document.querySelector('#translateDanmaku').setAttribute('title', chConverTtitle[window.ede.chConvert]);
        reloadDanmaku('reload');
        console_log(document.querySelector('#translateDanmaku').getAttribute('title'));
    }

    function refreshButtonClick(){
        reloadDanmaku('reload');
    }

    function withButtonClick(){

        window.ede.withSwitch = (window.ede.withSwitch + 1) % 2;

        window.localStorage.setItem('withSwitch', window.ede.withSwitch);
        document.querySelector('#withDanmu').children[0].innerText = with_icon[window.ede.withSwitch];
        if(window.ede.withSwitch == 0){
            console_log('取消引用外部弹幕');
        }
        else{
            console_log('引用外部弹幕');
        }
        reloadDanmaku('reload');
    }

    function infoButtonClick() {
        console_log('设置弹幕');
        let limit = prompt('弹幕每秒数量(默认5):', window.ede.danmuLimit);

        if(limit != null){
            window.ede.danmuLimit = limit;
            window.localStorage.setItem('danmuLimit', window.ede.danmuLimit);
        }

        let size = prompt('弹幕大小(默认25):', window.ede.danmuSize);
        if(size != null){
            window.ede.danmuSize = size;
            window.localStorage.setItem('danmuSize', window.ede.danmuSize);
        }
        if(window.ede.offset == null)
            window.ede.offset = 0;

        window.ede.offset = prompt('弹幕时间偏移(单位:秒):', window.ede.offset);


    }

    function initListener() {
        let container = document.querySelector(mediaQueryStr);
        // 页面未加载
        if (!container) {
            if (window.ede.episode_info) {
                window.ede.episode_info = null;
            }
            return;
        }
        // 已初始化
        if (!container.getAttribute('ede_listening')) {
            //console_log('正在初始化Listener');
            container.setAttribute('ede_listening', true);
            container.addEventListener('click', pauseVideo);
            //console_log('Listener初始化完成');
            reloadDanmaku();
        }
    }

    function initUI() {

        // 页面未加载btnVideoOsdSettings
        if (!document.querySelector(uiQueryStr) && !document.querySelector(".btnVideoOsdSettings")) {
            return;
        }
        // 已初始化
        if (document.getElementById('danmakuCtr')) {
            return;
        }
        //console_log('正在初始化UI');

        // 弹幕按钮容器div

        let menubar = document.createElement('div');
        menubar.id = 'danmakuCtr';
        menubar.style.opacity = 0.5;
        // 弹幕开关
        displayButtonOpts.innerText = danmaku_icon[window.ede.danmakuSwitch];
        menubar.appendChild(createButton(displayButtonOpts, displayButtonClick));
        // 手动匹配
        menubar.appendChild(createButton(searchButtonOpts, searchButtonClick));
        // 本地弹幕
        menubar.appendChild(createButton(localButtonOpts, localButtonClick));
        //引用弹幕
        menubar.appendChild(createButton(exportButtonOpts, exportBUttonClick));
        //重载弹幕
        menubar.appendChild(createButton(refreshButtonOpts, refreshButtonClick));
        //自动外部
        menubar.appendChild(createButton(autoexportButtonOpts, autoexportBUttonClick));
        //外部弹幕
        withButtonOpts.innerText = with_icon[window.ede.withSwitch];
        menubar.appendChild(createButton(withButtonOpts, withButtonClick));
        // 简繁转换
        //translateButtonOpts.title = chConverTtitle[window.ede.chConvert];
        //menubar.appendChild(createButton(translateButtonOpts, translateButtonClick));
        // 弹幕信息
        menubar.appendChild(createButton(infoButtonOpts, infoButtonClick));

        if(document.querySelector(uiQueryStr)){
            let parent = document.querySelector(uiQueryStr).parentNode.parentNode;
            parent.append(menubar);
        }
        else{
            let parent2 = document.querySelector(".videoosd-tabsslider");
            parent2.appendChild(menubar);
            console_log("UI电视模式");
        }
        //console_log('UI初始化完成');


        fristLoad();

    }


    async function fristLoad(){

        // let item =await getEmbyItemInfo();
        // let _id;
        // if (item.Type == 'Episode') {
        //     _id = item.SeasonId;
        // } else {
        //     _id = item.Id;
        // }
        // reloadDanmaku();
    }

    function sendNotification(title, msg) {
        const Notification = window.Notification || window.webkitNotifications;
        //console_log(msg);
        if (Notification.permission === 'granted') {
            return new Notification(title, {
                body: msg,
            });
        } else {
            Notification.requestPermission((permission) => {
                if (permission === 'granted') {
                    return new Notification(title, {
                        body: msg,
                    });
                }
            });
        }
    }

    function danmuPrompt(title, data, defaultValue) {
			  return new Promise((resolve, reject) => {
                const randomValue = Math.random();
				// 创建弹出框容器
				const container = document.createElement('div');
				container.style.position = 'fixed';
				container.style.top = '30%';
				container.style.left = '50%';
				container.style.transform = 'translate(-50%, -50%)';
				container.style.backgroundColor = '#0e0e0e';
                container.style.borderRadius = "10px";
				container.style.padding = '3px';
				container.style.border = '1px solid black';
				container.style.zIndex = 1000;
                container.style.textAlign = 'center';

				// 创建标题元素
				const titleElement = document.createElement('h3');
				titleElement.style.textAlign = 'center';
				titleElement.textContent = title;
				container.appendChild(titleElement);

                // 创建选项列表元素
				const ulElement = document.createElement('ul');
                ulElement.style.textAlign = 'left';
                ulElement.id = 'prompt-ul';
                ulElement.style.maxHeight = '300px';
                ulElement.style.width = '400px';
                ulElement.style.overflowY = 'auto';
				let index = 0;
				data.forEach(item => {
				  index = index + 1;
				  const liElement = document.createElement('li');
				  liElement.textContent = index + ":" + item;
				  liElement.style.listStyleType = 'none';
                  liElement.style.cursor = 'pointer';
				  liElement.setAttribute('index', index);
				  liElement.addEventListener('click', function() {
					let input = document.getElementById('prompt-input');
					let value = this.getAttribute('index');
					input.value = value;
					console.log('li元素的内部文本是：' + this.index);
					
					
					if(isInteger(value) && parseInt(value)> 0){
                        value = parseInt(value);

                        let listItems = document.querySelectorAll('#prompt-ul li');
                        let ul = document.getElementById('prompt-ul');
                        for (let i = 0; i < listItems.length; i++) {
                            if (i + 1 === value) {
                                listItems[i].classList.add('selected');
                                // 获取li元素在ul中的高度
                                let liHeight = listItems[i].offsetTop;
                                console.log(liHeight);
                                // 滚动到该高度
                                ul.scrollTop = Math.max(liHeight - 200, 0);
                            } else {
                                listItems[i].classList.remove('selected');
                            }
                        }
                    }
					
				  });
				  ulElement.appendChild(liElement);
				});
				container.appendChild(ulElement);

				// 创建输入框元素
				const inputElement = document.createElement('input');
				inputElement.style.borderRadius = "10px";
				inputElement.style.fontSize = "2em";
				inputElement.style.paddingLeft = "10px";
                inputElement.id = "prompt-input";
				inputElement.type = 'text';
                // 为input元素添加键盘按下事件监听器
                inputElement.addEventListener("keydown", function(event){
                    // // 判断按下的键是否为回车键或上下左右4个方向键
                    // if (event.key === "Enter" || event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    //     // 在这里执行相应的操作
                    //     console.log("按下了回车键或方向键");
                    //     // 阻止事件继续传递
                    //     event.stopPropagation();
                    //     let btn = document.getElementById('prompt-okbtn');
                    //     btn.focus();
                    // }
                    if (event.key === "Enter"){
                        console.log("按下了回车键或方向键");
                        let btn = document.getElementById('prompt-okbtn' + randomValue);
                        btn.focus();
                    }

                });

                inputElement.addEventListener('input', function(e){
                    let value = e.target.value;
                    if(value.charAt(0) === '-' || value.charAt(0) === '0' || value.charAt(0) === '+' ){
                        if(value.charAt(0) === '+'){
                            let v2 = value.substring(1);
                            if(isInteger(v2) && isInteger(defaultValue)){
                                value = parseInt(defaultValue) + parseInt(v2);
                            }
                        }
                        else{
                            let v2 = value.substring(1);
                            if(isInteger(v2) && isInteger(defaultValue)){
                                value = parseInt(defaultValue) - parseInt(v2);
                            }
                        }
                    }

                    if(isInteger(value) && parseInt(value)> 0){
                        value = parseInt(value);

                        let listItems = document.querySelectorAll('#prompt-ul li');
                        let ul = document.getElementById('prompt-ul');
                        for (let i = 0; i < listItems.length; i++) {
                            if (i + 1 === value) {
                                listItems[i].classList.add('selected');
                                // 获取li元素在ul中的高度
                                let liHeight = listItems[i].offsetTop;
                                console.log(liHeight);
                                // 滚动到该高度
                                ul.scrollTop = Math.max(liHeight - 200, 0);
                            } else {
                                listItems[i].classList.remove('selected');
                            }
                        }
                    }

                });

				container.appendChild(inputElement);


                const pElement = document.createElement('br');
                container.appendChild(pElement);


				// 添加关闭按钮
				// const closeButton = document.createElement('button');
				// closeButton.textContent = '关闭';
				// closeButton.onclick = () => {
				//   document.body.removeChild(container);
				//   resolve(null);
				// };
				// container.appendChild(closeButton);

                // 创建一个遮罩层元素
                const maskLayer = document.createElement('div');
                maskLayer.style.position = 'fixed';
                maskLayer.style.top = '0';
                maskLayer.style.left = '0';
                maskLayer.style.width = '100%';
                maskLayer.style.height = '100%';
                maskLayer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                maskLayer.style.zIndex = '3';
                document.body.appendChild(maskLayer);

				// 添加确定按钮
				const okButton = document.createElement('button');
				okButton.textContent = '确定';
                okButton.id = 'prompt-okbtn' + randomValue;
                okButton.style.fontSize = "2em";
                okButton.style.borderRadius = "10px";
				okButton.onclick = () => {
                    document.body.removeChild(maskLayer);
                    document.body.removeChild(container);
                    resolve(inputElement.value);
				};
				container.appendChild(okButton);


                // 创建一个新的<style>元素
                let style = document.createElement('style');

                // 设置<style>元素的内容
                style.innerHTML = `
                  #prompt-ul .selected{
                    background-color: lightblue;
                  }
                `;
                document.head.appendChild(style);



				// 将弹出框添加到页面中
				document.body.appendChild(container);
                // 添加焦点
                inputElement.focus();
                okButton.setAttribute("tabIndex", "0");
                // 设置默认值
                inputElement.value = defaultValue;
                let event = new Event('input', { 'bubbles': true, 'cancelable': true });
                inputElement.dispatchEvent(event);
			  });
			}
    function showObjectAsString(obj) {
        // 将对象转换为字符串
        const str = JSON.stringify(obj);

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '30%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.backgroundColor = '#0e0e0e';
        container.style.borderRadius = "10px";
        container.style.padding = '3px';
        container.style.border = '1px solid black';
        container.style.zIndex = 1000;
        container.style.textAlign = 'center';


        const richText = document.createElement('textarea');
        richText.setAttribute('id', 'richText');
        richText.setAttribute('class', 'richText');
        richText.style.width = "800px";
        richText.style.height = "800px";
        richText.value = str;
        container.append(richText);
        // 将弹出框添加到页面中
        document.body.appendChild(container);
    }

    function getEmbyItemInfo() {

        return window.require(['pluginManager']).then((items) => {


            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                for (let j = 0; j < item.pluginsList.length; j++) {
                    const plugin = item.pluginsList[j];
                    if (plugin.hasOwnProperty("streamInfo") && plugin.streamInfo.hasOwnProperty("item")){
                        return plugin.streamInfo.item;
                    }

                    // if(window.device == "app"){
                    //     if (plugin.id == 'exovideoplayer') {
                    //
                    //         return plugin.streamInfo.item;
                    //     }
                    // }
                    // else{
                    //     if (plugin.id == 'htmlvideoplayer') {
                    //         return plugin._currentPlayOptions.item;
                    //     }
                    // }
                }
            }
        });
    }

    async function getEpisodeInfo(is_auto = true) {
        let item = await getEmbyItemInfo();
        const html = document.documentElement.outerHTML;
        // showObjectAsString(html);
        let _id;
        let animeName;
        let anime_id = -1;
        let episode =1;
        let true_episode = 0;
        if (item.Type == 'Episode') {
            _id = item.SeasonId;
            animeName = item.SeriesName;
            episode = item.IndexNumber;
            true_episode = item.IndexNumber;
            let session = item.ParentIndexNumber;
            if (session != 1) {
                animeName += '第' + session + '季';
            }
            if (session == 0){
                episode.to
                episode = episode.toString().substr(1);
                console.log("第0季剧集");
            }
        } else {
            _id = item.Id;
            animeName = item.Name;
            episode = 'movie';
        }
        let _id_key = '_anime_id_rel_' + _id;
        let _name_key = '_anime_name_rel_' + _id;
        let _autoload_key = '_anime_autoload_rel_' + _id;
        let _episode_key = '_episode_key_' + _id;
        if (window.localStorage.getItem(_id_key)) {
            anime_id = window.localStorage.getItem(_id_key);
        }
        if (window.localStorage.getItem(_name_key)) {
            animeName = window.localStorage.getItem(_name_key);
        }
        // if (episode >= 200){
        //     // 集数过大, 把集数也放到查询关键词中并将episode重置为1
        //     animeName = `${item.SeriesName} ${episode}`;
        //     episode = 1;
        // }

        if (!is_auto) {
            //animeName = prompt('确认动画名:', animeName);
			let anime_split_name = splitString(animeName);
            //animeName = await danmuPrompt('确认动画名:', [], animeName);
			animeName = await danmuPrompt('确认动画名:', anime_split_name, animeName);
			if(isInteger(animeName) && parseInt(animeName)> 0){
				animeName = anime_split_name[animeName];
			}
        }
		
        //let searchUrl = 'https://api.acplay.net/api/v2/search/episodes?anime=' + animeName + '&withRelated=true';
        let searchUrl = api_url + 'danmuku?type=search&keyword=' + animeName + '&withRelated=true';
        if (is_auto) {
            
			let episode2 = window.localStorage.getItem(_episode_key);
            if(episode2 != null && (episode2.charAt(0) === '-' || episode2.charAt(0) === '0' || episode2.charAt(0) === '+' )){
                if(episode2.charAt(0) === '+' ){
                    episode2 = episode2.substring(1);
                    console.log("偏差 + " + episode2);
                    let e  = parseInt(episode) + parseInt(episode2);
                    episode = e;
                }
                else{
                    episode2 = episode2.substring(1);
                    console.log("偏差 - " + episode2);
                    let e  = parseInt(episode) - parseInt(episode2);
                    if(e>= 1){
                        episode = e;
                    }
                    else{
                        console_log("偏差后数值小于1, 使用源生剧集")
                    }
                }


            }
            searchUrl += '&episode=' + episode + "&animeid=" + anime_id;
        }
        let animaInfo = await fetch(searchUrl).then((response) => response.json());
        //console_log('查询成功');
        if(is_auto && animaInfo.animes.length == 0 && animeName.indexOf("第")>=0 && animeName.indexOf("季")>=0 ){

            searchUrl = `${api_url}danmuku?type=search&keyword=${item.SeriesName}&episode=${episode}`;
            animaInfo = await fetch(searchUrl).then((response) => response.json());
            if(animaInfo.animes.length > 0){
                // console_log("季查找未找到, 移除重查");
                // console_log(animaInfo.animes[0].animeTitle);
                window.localStorage.setItem(_id_key, animaInfo.animes[0].animeId);
                window.localStorage.setItem(_name_key, animaInfo.animes[0].animeTitle);
                window.localStorage.setItem(_autoload_key, "1");
            }

        }
        //console_log(animaInfo);
        let selecAnime_id = 1;
        if (anime_id != -1) {

            for (let index = 0; index < animaInfo.animes.length; index++) {
                if (animaInfo.animes[index].animeId == anime_id) {
                    selecAnime_id = index + 1;
                }
            }

        }
        if (!is_auto) {
            let anime_lists_str = list2string(animaInfo);
            console.log(animaInfo);
            let anime_lists = getAnimes(animaInfo);
            console.log(anime_lists);
            //selecAnime_id = prompt('选择:\n' + anime_lists_str, selecAnime_id);
            selecAnime_id = await danmuPrompt('选择:', anime_lists, selecAnime_id);

            selecAnime_id = parseInt(selecAnime_id) - 1;
            window.localStorage.setItem(_id_key, animaInfo.animes[selecAnime_id].animeId);
            window.localStorage.setItem(_name_key, animaInfo.animes[selecAnime_id].animeTitle);
            window.localStorage.setItem(_autoload_key, "1");


            let episode_lists_str = ep2string(animaInfo.animes[selecAnime_id].episodes);
            let ep_lists = getEps(animaInfo.animes[selecAnime_id].episodes);
            console.log(ep_lists);
            if(episode == "movie")
                episode = 1;
			await sleep(500);
			
			let e3 = window.localStorage.getItem(_episode_key);
			let episode2 = 0;
			if(e3 != null && (e3.charAt(0) === '-' || e3.charAt(0) === '0' || e3.charAt(0) === '+' )){
				episode2 = await danmuPrompt('确认集数:', ep_lists, parseInt(e3));
			}
            //let episode2 = prompt('确认集数:\n' + episode_lists_str, parseInt(episode));
            else{
				episode2 = await danmuPrompt('确认集数:', ep_lists, parseInt(episode));
			}
            if(episode2.charAt(0) === '-' || episode2.charAt(0) === '0' || episode2.charAt(0) === '+' ){
                if(episode2.charAt(0) === '+' ){
                    window.localStorage.setItem(_episode_key, episode2);
                    episode2 = episode2.substring(1);
                    console.log("偏差 + " + episode2);
                    episode = parseInt(episode) + parseInt(episode2);
                }
                else{
                    window.localStorage.setItem(_episode_key, episode2);
                    episode2 = episode2.substring(1);
                    console.log("偏差 - " + episode2);
                    episode = parseInt(episode) - parseInt(episode2);
                }

            }
            else{
                window.localStorage.setItem(_episode_key, null);
                episode = episode2;
            }
            console.log("当前集数: " + episode);
            episode = parseInt(episode) - 1;

        } else {
            //selecAnime_id = parseInt(episode);
            //selecAnime_id = parseInt(selecAnime_id) - 1;
			//selecAnime_id = parseInt(episode) - 1;
			selecAnime_id = 0;
            console.log("当前集数: " + episode);
            episode = parseInt(episode) - 1;
        }
        let episodeInfo = {};
        if(selecAnime_id in animaInfo.animes){
            episodeInfo = {
                episode: true_episode,
                episodeId: animaInfo.animes[selecAnime_id].episodes[episode].episodeId,
                animeTitle: animaInfo.animes[selecAnime_id].animeTitle,
                episodeTitle: animaInfo.animes[selecAnime_id].type == 'tvseries' ? animaInfo.animes[selecAnime_id].episodes[episode].episodeTitle : null,
            };
        }
        else{
            episodeInfo = {
                episode: true_episode,
                episodeId: item.Id,
                animeTitle: "",
                episodeTitle: "未知"
            }
        }

        return episodeInfo;
    }

    async function getComments(episodeInfo) {
        let episodeId = episodeInfo.episodeId;
        //let url = 'https://api.xn--7ovq92diups1e.com/cors/https://api.acplay.net/api/v2/comment/' + episodeId + '?withRelated=true&chConvert=' + window.ede.chConvert;
        let withRelated = "true";
        if(window.ede.withSwitch == 0)
            withRelated = "false";
        let title = episodeInfo.animeTitle;
        let ep = episodeInfo.episode;
        let item = await getEmbyItemInfo();
        let id = item.Id;
        let url = `${api_url}danmuku?type=comment&id=${id}&episodeId=${episodeId}&withRelated=${withRelated}&chConvert=${window.ede.chConvert}`;
        //url = url + `&title=${title}&ep=${ep}`;
        //let url = api_url + 'danmuku?type=comment&id='+ id +'&episodeId=' + episodeId + '&withRelated='+withRelated+'&chConvert=' + window.ede.chConvert;
        return fetch(url)
            .then((response) => response.json())
            .then((data) => {
            //console_log('弹幕加载成功: ' + data.comments.length);
            console.log(data.comments);
            let comments = data.comments;
                // 使用 filter 方法创建一个新的数组，其中不包含 comments 中包含 pb_list 中任意一个值的元素
            let saveComments = comments.filter(comment => !pb_list.some(item => comment["m"].includes(item)));
                let deletedComments = comments.filter(comment => pb_list.some(item => comment["m"].includes(item)));
                // 计算删除的元素数量
            //console_log('屏蔽弹幕数量:' + deletedComments.length);
            console.log(deletedComments);
            console_log(`集数:${episodeInfo.episode};弹幕数量${data.comments.length};屏蔽数量${deletedComments.length}`);
            if(data.comments.length == 0){
                //尝试自动引用外部弹幕
                autoexportBUttonClick();
            }

            return saveComments;
        });
    }

    function createDanmaku(comments) {
        let _comments = bilibiliParser(comments);

        //if(_comments.length >=5000){
        //_comments = _comments.slice(0,5000);
        //}
        _comments = danmuToDict(_comments)
        let _container = document.querySelector(mediaContainerQueryStr);
        // alert(`${_container.offsetWidth}  ${_container.offsetHeight}`);

        //let _media = document.querySelector(mediaQueryStr);

        console.log(_comments);
        window.ede.comments = _comments;
        if (window.ede.danmaku != null &&  $(mediaContainerQueryStr).attr("danmuku") == "open") {
            window.ede.danmaku.clear();
            window.ede.danmaku.stop();
            console.log("已清除弹幕");

        }
        else{
            window.ede.danmaku = Danmuku.create({
                height: 24,
                container:_container,
                rowGap:5,
                limit:60,
                capacity:50,
                interval:1,
                hooks: {
                    send (manager, data) {
                        //console.log(data);
                    },
                    barrageCreate (barrage, node) {
                        if (!barrage.isSpecial) {
                            //console.log(barrage.data) // -> { content: 'one' }
                            // 设置弹幕内容和样式
                            //node.textContent = barrage.data.text + " " + barrage.data.time;
                            node.textContent = barrage.data.text;

                            node.classList.add('barrage-style');
                            $.each(barrage.data.style, function(key,val){
                                node.style[key] = val;
                            });
                            node.style["font-size"] = window.ede.danmuSize + "px";
                            //console.log(`弹幕- 设定时间:${barrage.data.time}, 实际时间:${barrage.data.showtime}, 内容:${barrage.data.text}`);
                        }
                    }
                }
            });
        }
        $(mediaContainerQueryStr).attr("danmuku", "open");
        window.ede.danmaku.start();





        if(window.ede.danmakuSwitch == 1)
            window.ede.danmaku.show()
        else
            window.ede.danmaku.hidden();


        //建立一个窗口重绘的监视
        if (window.ede.ob) {
            window.ede.ob.disconnect();
        }
        window.ede.ob = new ResizeObserver(() => {
            if (window.ede.danmaku) {
                //console_log('Resizing');
                window.ede.danmaku.resize();
            }
        });
        window.ede.ob.observe(_container);
        //建立一个时间文本改变的监视 监视进度条的时间改变
        if (window.ede.timeOb) {
            window.ede.timeOb.disconnect();
        }
        let top_line = 0;
        window.ede.timeOb = new MutationObserver(() => {

            let playerTime = $(mediaVideoPositionStr).html();
            playerTime = getSec(playerTime);
            if(window.ede.playerTime != playerTime){
                window.ede.playerTime = playerTime;
                if(window.ede.offset == null)
                    window.ede.offset = 0;
                let offset = parseInt(window.ede.offset);
                let offset_player_time = playerTime + offset;
                if(offset_player_time in _comments){
                    let comment_list = _comments[offset_player_time];
                    if(comment_list){
                        for(let i=0;i<window.ede.danmuLimit;i++){
                            if(i in comment_list){
                                let msg = comment_list[i];
                                msg.showtime = playerTime;
                                window.ede.danmaku.send(msg);
                            }
                        }
                    }

                }
                //设置高级(顶部)弹幕，每秒只允许1条
                if((offset_player_time+"_top") in _comments){
                    let comment_special = _comments[offset_player_time+"_top"][random(0, _comments[offset_player_time+"_top"].length)];
                    if(comment_special != null){
                        console.log(comment_special);
                        window.ede.danmaku.sendSpecial({
                            duration: random(3, 5),
                            direction: "none",
                            position (barrage) {
                                if(top_line >= 10)
                                    top_line = 1;
                                else
                                    top_line = top_line + 1;
                                return {
                                    x: window.ede.danmaku.containerWidth / 2 - comment_special.text.length * 25 / 2,
                                    y: 24 * (top_line -1),
                                }
                            },
                            hooks: {
                                create (barrage, node) {
                                    node.textContent = comment_special.text;
                                    $.each(comment_special.style, function(key,val){
                                        node.style[key] = val;
                                    });
                                    node.classList.add('special-barrage');
                                    //console.log(`弹幕- 设定时间:${comment_special.time}, 实际时间:${playerTime}, 内容:${comment_special.text}`);
                                },
                                destroy () {
                                    //console.log('高级弹幕销毁');
                                }
                            }
                        });
                    }

                }
            }
        });
        let config = {
            characterData: true,
            subtree: true,
            childList: true
        };
        let timeDiv = document.querySelector(mediaVideoPositionStr);
        window.ede.timeOb.observe(timeDiv, config);
        window.ede.playerTime = -1;
        //建立一个剧集改变的监视
        if (window.ede.epOb) {
            window.ede.epOb.disconnect();
        }
        window.ede.epOb = new MutationObserver(() => {
            reloadDanmaku();
            //console_log("视频已切换");
        });

        let epDiv = document.querySelector(mediaVideoTitleStr);
        window.ede.epOb.observe(epDiv, config);
    }

    function reloadDanmaku(type = 'check') {
        // if (window.ede.reloading) {
        //     console_log('正在重新加载,请稍后再试');
        //     return;
        // }
        window.ede.reloading = true;
        getEpisodeInfo(type != 'search')
            .then((info) => {
            return new Promise((resolve, reject) => {
                if (type != 'search' && type != 'reload' && window.ede.danmaku && window.ede.episode_info && window.ede.episode_info.episodeId == info.episodeId ) {
                    reject('当前播放视频未变动');
                } else {
                    window.ede.comments = [];
                    console.log("弹幕已清理")
                    window.ede.episode_info = info;
                    resolve(info);
                }
            });
        })
            .then(
            (episodeInfo) => getComments(episodeInfo).then((comments) => createDanmaku(comments)),
            (msg) => {
                console.log(msg);
            }
        )
            .then(() => {
            window.ede.reloading = false;
            if (document.getElementById('danmakuCtr').style.opacity != 1) {
                document.getElementById('danmakuCtr').style.opacity = 1;
            }
        });
    }


    function pauseVideo(){
        let videoPause = $(".videoOsd-btnPause");
        //reloadDanmaku();
        if(videoPause.attr("title") == "播放"){
            if (window.ede.danmaku != null) {
                window.ede.danmaku.start();
            }
        }
        else{
            if (window.ede.danmaku != null) {
                window.ede.danmaku.stop();
            }
        }
    }


    function bilibiliParser($obj) {
        //const $xml = new DOMParser().parseFromString(string, 'text/xml')
        return $obj
            .map(($comment) => {
            const p = $comment.p;
            //if (p === null || $comment.childNodes[0] === undefined) return null
            const values = p.split(',');
            const mode = { 6: 'ltr', 1: 'rtl', 5: 'top', 4: 'bottom' }[values[1]];
            if (!mode) return null;
            //const fontSize = Number(values[2]) || 25
            const fontSize = 25;
            const color = `000000${Number(values[2]).toString(16)}`.slice(-6);
            return {
                text: $comment.m,
                mode,
                time: values[0] * 1,
                style: {
                    fontSize: `${fontSize}px`,
                    color: `#${color}`,
                    textShadow:
                    color === '00000' ? '-1px -1px #fff, -1px 1px #fff, 1px -1px #fff, 1px 1px #fff' : '-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000',

                    font: `${fontSize}px sans-serif`,
                    fillStyle: `#${color}`,
                    strokeStyle: color === '000000' ? '#fff' : '#000',
                    lineWidth: 2.0,
                },
            };
        })
            .filter((x) => x);
    }

    function danmuToDict(comments){
        //将弹幕转换成根据秒速的字典
        let dict = new Array();
        comments.forEach(item => {
            let commentTime = parseInt(item.time);
            let mode = "";
            if(item.mode == "top")
                mode = "_top";
            if(((commentTime + mode) in dict)==false){
                dict[commentTime + mode] = new Array();
            }
            dict[commentTime + mode].push(item);
        });
        return dict;

    }

    function list2string($obj2) {
        const $animes = $obj2.animes;
        let anime_lists = $animes.map(($single_anime) => {
            return $single_anime.animeTitle + ' 类型:' + $single_anime.typeDescription;
        });
        let anime_lists_str = '1:' + anime_lists[0];
        for (let i = 1; i < anime_lists.length; i++) {
            anime_lists_str = anime_lists_str + '\n' + (i + 1).toString() + ':' + anime_lists[i];
        }
        return anime_lists_str;
    }

    function getAnimes($obj2) {
        const $animes = $obj2.animes;
        let anime_lists = $animes.map(($single_anime) => {
            return $single_anime.animeTitle + ' 类型:' + $single_anime.typeDescription;
        });
        return anime_lists;
    }

    function sleep(time){
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, time);
      });
    }

    function ep2string($obj3) {
        const $animes = $obj3;
        let anime_lists = $animes.map(($single_ep) => {
            return $single_ep.episodeTitle;
        });
        let ep_lists_str = '1:' + anime_lists[0];
        for (let i = 1; i < anime_lists.length; i++) {
            if(i>=5){
                ep_lists_str = ep_lists_str + '\n' + "...";
                ep_lists_str = ep_lists_str + '\n' + (anime_lists.length-1).toString() + ':' + anime_lists[anime_lists.length-2];
                ep_lists_str = ep_lists_str + '\n' + (anime_lists.length).toString() + ':' + anime_lists[anime_lists.length-1];
                break;
            }
            else{
                ep_lists_str = ep_lists_str + '\n' + (i + 1).toString() + ':' + anime_lists[i];
            }
        }
        return ep_lists_str;
    }

    function getEps($obj3){
        const $animes = $obj3;
        let anime_lists = $animes.map(($single_ep) => {
            return $single_ep.episodeTitle;
        });
        return anime_lists;
    }

    function isInteger(str) {
      return /^-?\d+$/.test(str);
    }


    function getSec(time) {
        let timeSplit = time.split(":");
        if(timeSplit.length == 3){
            var hour = time.split(":")[0];
            var min = time.split(":")[1];
            var sec = time.split(":")[2];
            var s = parseInt(parseFloat(hour * 3600) + parseFloat(min * 60) + parseFloat(sec));
            return s;
        }
        if(timeSplit.length == 2){
            var min = time.split(":")[0];
            var sec = time.split(":")[1];
            var s = parseInt((parseFloat(min * 60) + parseFloat(sec)));
            return s;
        }
        return 0;

    }

    async function getEmbyItem(){
        // 获取当前媒体信息
        let userId = window.ApiClient._serverInfo.UserId;
        let itemId = /\?id=(\d*)/.exec(window.location.hash)[1];
        let response = await window.ApiClient.getItem(userId, itemId);
        console.log(response);
        return response;
    }

    function checkDc(path){
        const arr = ["普通AV"];
        // 判断一个path 是否可以解码
        for (let i = 0; i < arr.length; i++) {
        if (path.includes(arr[i])) {
                return true;
            }
          }
          return false;
    }

    function getFanhao(str) {
      const index = str.indexOf(' ');
      if (index === -1) {
        return str;
      } else {
        return str.slice(0, index);
      }
    }

    async function setAvChange(){

        // 添加av解码按钮
        let item = await getEmbyItem();
        let path = item.Path;
        let fanhao = getFanhao(item.Name);
        if(checkDc(path)){
            let option = {
                "group_name": "tool",
                "group_title": "工具",
                "name": "decode_av",
                "title": "解码AV",
                "value": `${api_url}api${api_key}?type=dcav&path=${path}`
            };
            addLinksSection(option);

            addLinksSection({
                "group_name": "tool",
                "group_title": "工具",
                "name": "niya_search",
                "title": "niya查询",
                "value": `https://sukebei.nyaa.si/?f=0&c=0_0&q=${fanhao}`
            });
			
			addLinksSection({
                "group_name": "tool",
                "group_title": "工具",
                "name": "tukube_search",
                "title": "tukube查询",
                "value": `https://tktube.com/zh/search/${fanhao.replace("-", "--")}/`
            });

           addLinksSection({
                "group_name": "tool",
                "group_title": "工具",
                "name": "niya_search",
                "title": "niya查询",
                "value": `https://sukebei.nyaa.si/?f=0&c=0_0&q=${fanhao}`
            });
        }

    }

    function addLinksSection(option){
        /*
        * option{
        *   group_name: 分类名称
        *   group_title: 分类标题 cn
        *   name: 数据名称
        *   title: 数据标题 cn
        *   value: 数据值  url
        * }
        * */

        // 向linksSection 中添加指定元素
        $(".linksSection").each(function() {
            let links_section = $(this);
            if(links_section.find("." + option.group_name).length == 0){
                // 添加分类项
                let html = `<h2 class="sectionTitle padded-left padded-right " style="margin-bottom:.4em;">${option.group_title}</h2>`;
                html += `<div class="itemLinks padded-left padded-right focusable ${option.group_name}" data-focusabletype="nearest"></div>`;
                links_section.append(html);
            }
            if(links_section.find("." + option.name).length == 0){
                // 添加元素
                let html = `<a is="emby-linkbutton" class="raised item-tag-button nobackdropfilter emby-button ${option.name}" href="${option.value}" target="_blank"><i class="md-icon button-icon button-icon-left">link</i>${option.title}</a>`;
                let group_div = links_section.find("." + option.group_name);
                group_div.append(html);
            }
        });
    }

    async function setLink(){
        // let media_info = await getEmbyItemInfo()
        // console.log(media_info);

        $(".linksSection").each(function() {
            let links_section = $(this);
            if (links_section.find(".bgm-link").length == 0) {
                links_section.removeClass("hide");
                let search_h1 = links_section.parent().parent().find(".itemName-primary");
				let search = "";
				if(search_h1.find("a").length>0)
					search = search_h1.find("a").eq(0).html();
				else
					search = search_h1.html();
				console.log(search);
                setAvChange()
                let href = `https://bangumi.tv/subject_search/${search}?cat=2`;
                let fanzu_a = `<a is="emby-linkbutton" class="raised item-tag-button nobackdropfilter emby-button bgm-link" href="${href}" target="_blank"><i class="md-icon button-icon button-icon-left">link</i>番组计划</a>`;
                links_section.find(".itemLinks").append(fanzu_a);

                console.log("添加番组link");
            }
        });
    }
	
	function replaceChars(str, charArray) {
	  let result = '';
	  for (let i = 0; i < str.length; i++) {
		if (!charArray.includes(str[i])) {
		  result += str[i];
		}
	  }
	  return result;
	}

	
	
	function splitString(str) {
	  const specialChars = [' ', '.', '~', '。', '，', '～'];
	  let result = [str];
	  let temp = '';

	  for (let i = 0; i < str.length; i++) {
		if (specialChars.includes(str[i])) {
		  if (temp.length > 0) {
			if (temp.split('').filter(char => specialChars.includes(char)).length <= 2) {
			  temp = replaceChars(temp, specialChars);
			  result.push(temp);
			}
			temp = '';
		  }
		} else {
		  temp += str[i];
		}
	  }

	  if (temp.length > 0 && temp.split('').filter(char => specialChars.includes(char)).length <= 2) {
		result.push(temp);
	  }

	  return result;
	}


    while (!window.require) {
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!window.ede) {
        window.ede = new EDE(window);
        setInterval(() => {
            initListener();
        }, check_interval);
        setInterval(() => {
            initUI();
        }, check_interval);
        setInterval(() => {
            setLink();
        }, check_interval);
    }
}
 })();