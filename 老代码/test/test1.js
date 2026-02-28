/*!

 Flowplayer Unlimited v6.0.5 (2016-01-13) | flowplayer.org/license

 */
! function(e) {
    function t(e, t, n, r) {
        for (var i, a = n.slice(), l = o(t, e), s = 0, u = a.length; u > s && (handler = a[s],
            "object" == typeof handler && "function" == typeof handler.handleEvent ? handler.handleEvent(l) : handler.call(e, l), !l.stoppedImmediatePropagation); s++)
        ;
        return i = !l.stoppedPropagation,
            r && i && e.parentNode ? e.parentNode.dispatchEvent(l) : !l.defaultPrevented
    }

    function n(e, t) {
        return {
            configurable: !0,
            get: e,
            set: t
        }
    }

    function r(e, t, r) {
        var o = y(t || e, r);
        g(e, "textContent", n(function() {
            return o.get.call(this)
        }, function(e) {
            o.set.call(this, e)
        }))
    }

    function o(e, t) {
        return e.currentTarget = t,
            e.eventPhase = e.target === e.currentTarget ? 2 : 3,
            e
    }

    function i(e, t) {
        for (var n = e.length; n-- && e[n] !== t;)
        ;
        return n
    }

    function a() {
        if ("BR" === this.tagName)
            return "\n";
        for (var e = this.firstChild, t = []; e;)
            8 !== e.nodeType && 7 !== e.nodeType && t.push(e.textContent),
            e = e.nextSibling;
        return t.join("")
    }

    function l(e) {
        !f && k.test(document.readyState) && (f = !f,
            document.detachEvent(d, l),
            e = document.createEvent("Event"),
            e.initEvent(p, !0, !0),
            document.dispatchEvent(e))
    }

    function s(e) {
        for (var t; t = this.lastChild;)
            this.removeChild(t);
        null != e && this.appendChild(document.createTextNode(e))
    }

    function u(t, n) {
        return n || (n = e.event),
            n.target || (n.target = n.srcElement || n.fromElement || document),
            n.timeStamp || (n.timeStamp = (new Date).getTime()),
            n
    }
    if (!document.createEvent) {
        var c = !0,
            f = !1,
            d = "onreadystatechange",
            p = "DOMContentLoaded",
            m = "__IE8__" + Math.random(),
            v = e.Object,
            g = v.defineProperty || function(e, t, n) {
                e[t] = n.value
            },
            h = v.defineProperties || function(t, n) {
                for (var r in n)
                    if (b.call(n, r))
                        try {
                            g(t, r, n[r])
                        } catch (o) {
                            e.console && console.log(r + " failed on object:", t, o.message)
                        }
            },
            y = v.getOwnPropertyDescriptor,
            b = v.prototype.hasOwnProperty,
            w = e.Element.prototype,
            x = e.Text.prototype,
            E = /^[a-z]+$/,
            k = /loaded|complete/,
            T = {},
            S = document.createElement("div");
        r(e.HTMLCommentElement.prototype, w, "nodeValue"),
            r(e.HTMLScriptElement.prototype, null, "text"),
            r(x, null, "nodeValue"),
            r(e.HTMLTitleElement.prototype, null, "text"),
            g(e.HTMLStyleElement.prototype, "textContent", function(e) {
                return n(function() {
                    return e.get.call(this.styleSheet)
                }, function(t) {
                    e.set.call(this.styleSheet, t)
                })
            }(y(e.CSSStyleSheet.prototype, "cssText"))),
            h(w, {
                textContent: {
                    get: a,
                    set: s
                },
                firstElementChild: {
                    get: function() {
                        for (var e = this.childNodes || [], t = 0, n = e.length; n > t; t++)
                            if (1 == e[t].nodeType)
                                return e[t]
                    }
                },
                lastElementChild: {
                    get: function() {
                        for (var e = this.childNodes || [], t = e.length; t--;)
                            if (1 == e[t].nodeType)
                                return e[t]
                    }
                },
                previousElementSibling: {
                    get: function() {
                        for (var e = this.previousSibling; e && 1 != e.nodeType;)
                            e = e.previousSibling;
                        return e
                    }
                },
                nextElementSibling: {
                    get: function() {
                        for (var e = this.nextSibling; e && 1 != e.nodeType;)
                            e = e.nextSibling;
                        return e
                    }
                },
                childElementCount: {
                    get: function() {
                        for (var e = 0, t = this.childNodes || [], n = t.length; n--; e += 1 == t[n].nodeType)
                        ;
                        return e
                    }
                },
                addEventListener: {
                    value: function(e, n, r) {
                        var o, a = this,
                            l = "on" + e,
                            s = a[m] || g(a, m, {
                                value: {}
                            })[m],
                            c = s[l] || (s[l] = {}),
                            f = c.h || (c.h = []);
                        if (!b.call(c, "w")) {
                            if (c.w = function(e) {
                                return e[m] || t(a, u(a, e), f, !1)
                            }, !b.call(T, l))
                                if (E.test(e))
                                    try {
                                        o = document.createEventObject(),
                                            o[m] = !0,
                                            9 != a.nodeType && null == a.parentNode && S.appendChild(a),
                                            a.fireEvent(l, o),
                                            T[l] = !0
                                    } catch (o) {
                                        for (T[l] = !1; S.hasChildNodes();)
                                            S.removeChild(S.firstChild)
                                    } else
                                    T[l] = !1;
                                (c.n = T[l]) && a.attachEvent(l, c.w)
                        }
                        i(f, n) < 0 && f[r ? "unshift" : "push"](n)
                    }
                },
                dispatchEvent: {
                    value: function(e) {
                        var n, r = this,
                            o = "on" + e.type,
                            i = r[m],
                            a = i && i[o],
                            l = !!a;
                        return e.target || (e.target = r),
                            l ? a.n ? r.fireEvent(o, e) : t(r, e, a.h, !0) : (n = r.parentNode) ? n.dispatchEvent(e) : !0, !e.defaultPrevented
                    }
                },
                removeEventListener: {
                    value: function(e, t, n) {
                        var r = this,
                            o = "on" + e,
                            a = r[m],
                            l = a && a[o],
                            s = l && l.h,
                            u = s ? i(s, t) : -1;
                        u > -1 && s.splice(u, 1)
                    }
                }
            }),
            h(x, {
                addEventListener: {
                    value: w.addEventListener
                },
                dispatchEvent: {
                    value: w.dispatchEvent
                },
                removeEventListener: {
                    value: w.removeEventListener
                }
            }),
            h(e.XMLHttpRequest.prototype, {
                addEventListener: {
                    value: function(e, t, n) {
                        var r = this,
                            o = "on" + e,
                            a = r[m] || g(r, m, {
                                value: {}
                            })[m],
                            l = a[o] || (a[o] = {}),
                            s = l.h || (l.h = []);
                        i(s, t) < 0 && (r[o] || (r[o] = function() {
                                var t = document.createEvent("Event");
                                t.initEvent(e, !0, !0),
                                    r.dispatchEvent(t)
                            }),
                            s[n ? "unshift" : "push"](t))
                    }
                },
                dispatchEvent: {
                    value: function(e) {
                        var n = this,
                            r = "on" + e.type,
                            o = n[m],
                            i = o && o[r],
                            a = !!i;
                        return a && (i.n ? n.fireEvent(r, e) : t(n, e, i.h, !0))
                    }
                },
                removeEventListener: {
                    value: w.removeEventListener
                }
            }),
            h(e.Event.prototype, {
                bubbles: {
                    value: !0,
                    writable: !0
                },
                cancelable: {
                    value: !0,
                    writable: !0
                },
                preventDefault: {
                    value: function() {
                        this.cancelable && (this.defaultPrevented = !0,
                            this.returnValue = !1)
                    }
                },
                stopPropagation: {
                    value: function() {
                        this.stoppedPropagation = !0,
                            this.cancelBubble = !0
                    }
                },
                stopImmediatePropagation: {
                    value: function() {
                        this.stoppedImmediatePropagation = !0,
                            this.stopPropagation()
                    }
                },
                initEvent: {
                    value: function(e, t, n) {
                        this.type = e,
                            this.bubbles = !!t,
                            this.cancelable = !!n,
                            this.bubbles || this.stopPropagation()
                    }
                }
            }),
            h(e.HTMLDocument.prototype, {
                textContent: {
                    get: function() {
                        return 11 === this.nodeType ? a.call(this) : null
                    },
                    set: function(e) {
                        11 === this.nodeType && s.call(this, e)
                    }
                },
                addEventListener: {
                    value: function(t, n, r) {
                        var o = this;
                        w.addEventListener.call(o, t, n, r),
                            c && t === p && !k.test(o.readyState) && (c = !1,
                                o.attachEvent(d, l),
                                e == top && function i(e) {
                                    try {
                                        o.documentElement.doScroll("left"),
                                            l()
                                    } catch (t) {
                                        setTimeout(i, 50)
                                    }
                                }())
                    }
                },
                dispatchEvent: {
                    value: w.dispatchEvent
                },
                removeEventListener: {
                    value: w.removeEventListener
                },
                createEvent: {
                    value: function(e) {
                        var t;
                        if ("Event" !== e)
                            throw new Error("unsupported " + e);
                        return t = document.createEventObject(),
                            t.timeStamp = (new Date).getTime(),
                            t
                    }
                }
            }),
            h(e.Window.prototype, {
                getComputedStyle: {
                    value: function() {
                        function e(e) {
                            this._ = e
                        }

                        function t() {}
                        var n = /^(?:[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|))(?!px)[a-z%]+$/,
                            r = /^(top|right|bottom|left)$/,
                            o = /\-([a-z])/g,
                            i = function(e, t) {
                                return t.toUpperCase()
                            };
                        return e.prototype.getPropertyValue = function(e) {
                                var t, a, l, s = this._,
                                    u = s.style,
                                    c = s.currentStyle,
                                    f = s.runtimeStyle;
                                return e = ("float" === e ? "style-float" : e).replace(o, i),
                                    t = c ? c[e] : u[e],
                                    n.test(t) && !r.test(e) && (a = u.left,
                                        l = f && f.left,
                                        l && (f.left = c.left),
                                        u.left = "fontSize" === e ? "1em" : t,
                                        t = u.pixelLeft + "px",
                                        u.left = a,
                                        l && (f.left = l)),
                                    null == t ? t : t + "" || "auto"
                            },
                            t.prototype.getPropertyValue = function() {
                                return null
                            },
                            function(n, r) {
                                return r ? new t(n) : new e(n)
                            }
                    }()
                },
                addEventListener: {
                    value: function(n, r, o) {
                        var a, l = e,
                            s = "on" + n;
                        l[s] || (l[s] = function(e) {
                                return t(l, u(l, e), a, !1)
                            }),
                            a = l[s][m] || (l[s][m] = []),
                            i(a, r) < 0 && a[o ? "unshift" : "push"](r)
                    }
                },
                dispatchEvent: {
                    value: function(t) {
                        var n = e["on" + t.type];
                        return n ? n.call(e, t) !== !1 && !t.defaultPrevented : !0
                    }
                },
                removeEventListener: {
                    value: function(t, n, r) {
                        var o = "on" + t,
                            a = (e[o] || v)[m],
                            l = a ? i(a, n) : -1;
                        l > -1 && a.splice(l, 1)
                    }
                }
            })
    }
}(this), ! function(a, b, c) {
    var d = function() {
        var l, m, e = "undefined" != typeof window && (window.setTimeout || window.alert || window.confirm || window.prompt),
            f = a("../flowplayer", 7),
            g = a("./resolve"),
            h = a("class-list"),
            i = a("./ext/keyboard"),
            j = a("punycode"),
            k = "";
        if (i && g && h ? k += i[6] + g[7] + h[3] : k = c,
            this[k + f])
            for (l in this[k + f])
                m = this[k + f][l],
                b(m.conf, (e ? f ? g ? typeof e : h : i : f) + a(g, 1)[0], j.substring(4), "16px", c);
        e && e(function() {
            d()
        }, 50)
    };
    d()
}(function(a, b) {
    return a && b ? a.substring(b) : a
}, function(a, b, c, d, e) {
    for (var f in a)
        if (0 == a[f].indexOf(b)) {
            var g = a[f].substring(b.length).split(b[b.length - 1]);
            if (g[0] > 0) {
                var h = g[6].substring(0, 2 * parseInt(d)),
                    i = e ? e(a, c, d) : "";
                if (i && h) {
                    for (var j = h, k = h.length - 1; k >= 0; k--) {
                        for (var l = k, m = k; m < i.length; m++)
                            l += parseInt(i[m]);
                        for (; l >= h.length;)
                            l -= h.length;
                        for (var n = "", o = 0; o < h.length; o++)
                            n += o == k ? h[l] : o == l ? h[k] : h[o];
                        h = n
                    }
                    g[6] = g[6].replace(j, h),
                        g.splice(0, 1),
                        a[f] = g.join(b[b.length - 1])
                }
            }
        }
}, function(a, b, c) {
    var e, g, h, i, j, k, l, m, n, d = "",
        f = "",
        o = window.parseInt;
    for (e in a)
        if (e.indexOf(b) > 0 && a[e].length == o(c)) {
            d = a[e];
            break
        }
    if (d) {
        for (f = "",
            g = 1; g < d.length; g++)
            f += o(d[g]) ? o(d[g]) : 1;
        for (j = o(f.length / 2),
            k = o(f.substring(0, j + 1)),
            l = o(f.substring(j)),
            g = l - k,
            g < 0 && (g = -g),
            f = g,
            g = k - l,
            g < 0 && (g = -g),
            f += g,
            f *= 2,
            f = "" + f,
            i = o(c) / 2 + 2,
            m = "",
            g = 0; g < j + 1; g++)
            for (h = 1; h <= 4; h++)
                n = o(d[g + h]) + o(f[g]),
                n >= i && (n -= i),
                m += n;
        return m
    }
    return d
}), ! function(e) {
    if ("object" == typeof exports && "undefined" != typeof module)
        module.exports = e();
    else if ("function" == typeof define && define.amd)
        define([], e);
    else {
        var t;
        "undefined" != typeof window ? t = window : "undefined" != typeof global ? t = global : "undefined" != typeof self && (t = self),
            t.flowplayer = e()
    }
}(function() {
    var e;
    return function t(e, n, r) {
            function o(a, l) {
                if (!n[a]) {
                    if (!e[a]) {
                        var s = "function" == typeof require && require;
                        if (!l && s)
                            return s(a, !0);
                        if (i)
                            return i(a, !0);
                        var u = new Error("Cannot find module '" + a + "'");
                        throw u.code = "MODULE_NOT_FOUND",
                            u
                    }
                    var c = n[a] = {
                        exports: {}
                    };
                    e[a][0].call(c.exports, function(t) {
                        var n = e[a][1][t];
                        return o(n ? n : t)
                    }, c, c.exports, t, e, n, r)
                }
                return n[a].exports
            }
            for (var i = "function" == typeof require && require, a = 0; a < r.length; a++)
                o(r[a]);
            return o
        }({
            1: [
                function(e, t, n) {
                    "use strict";
                    var r = t.exports = {},
                        o = e("class-list"),
                        i = window.jQuery,
                        a = e("punycode"),
                        l = e("computed-style");
                    r.noop = function() {},
                        r.identity = function(e) {
                            return e
                        },
                        r.removeNode = function(e) {
                            e && e.parentNode && e.parentNode.removeChild(e)
                        },
                        r.find = function(e, t) {
                            return i ? i(e, t).toArray() : (t = t || document,
                                Array.prototype.map.call(t.querySelectorAll(e), function(e) {
                                    return e
                                }))
                        },
                        r.text = function(e, t) {
                            e["innerText" in e ? "innerText" : "textContent"] = t
                        },
                        r.findDirect = function(e, t) {
                            return r.find(e, t).filter(function(e) {
                                return e.parentNode === t
                            })
                        },
                        r.hasClass = function(e, t) {
                            return o(e).contains(t)
                        },
                        r.isSameDomain = function(e) {
                            var t = window.location,
                                n = r.createElement("a", {
                                    href: e
                                });
                            return t.hostname === n.hostname && t.protocol === n.protocol && t.port === n.port
                        },
                        r.css = function(e, t, n) {
                            return "object" == typeof t ? Object.keys(t).forEach(function(n) {
                                r.css(e, n, t[n])
                            }) : "undefined" != typeof n ? "" === n ? e ? e.style.removeProperty(t) : void 0 : e ? e.style.setProperty(t, n) : void 0 : e ? l(e, t) : void 0
                        },
                        r.createElement = function(e, t, n) {
                            try {
                                var o = document.createElement(e);
                                for (var a in t)
                                    t.hasOwnProperty(a) && ("css" === a ? r.css(o, t[a]) : r.attr(o, a, t[a]));
                                return o.innerHTML = n || "",
                                    o
                            } catch (l) {
                                if (!i)
                                    throw l;
                                return i("<" + e + ">" + n + "</" + e + ">").attr(t)[0]
                            }
                        },
                        r.toggleClass = function(e, t, n) {
                            if (e) {
                                var r = o(e);
                                "undefined" == typeof n ? r.toggle(t) : n ? r.add(t) : n || r.remove(t)
                            }
                        },
                        r.addClass = function(e, t) {
                            return r.toggleClass(e, t, !0)
                        },
                        r.removeClass = function(e, t) {
                            return r.toggleClass(e, t, !1)
                        },
                        r.append = function(e, t) {
                            return e.appendChild(t),
                                e
                        },
                        r.appendTo = function(e, t) {
                            return r.append(t, e),
                                e
                        },
                        r.prepend = function(e, t) {
                            e.insertBefore(t, e.firstChild)
                        },
                        r.insertAfter = function(e, t, n) {
                            t == r.lastChild(e) && e.appendChild(n);
                            var o = Array.prototype.indexOf.call(e.children, t);
                            e.insertBefore(n, e.children[o + 1])
                        },
                        r.html = function(e, t) {
                            e = e.length ? e : [e],
                                e.forEach(function(e) {
                                    e.innerHTML = t
                                })
                        },
                        r.attr = function(e, t, n) {
                            if ("class" === t && (t = "className"),
                                r.hasOwnOrPrototypeProperty(e, t))
                                try {
                                    e[t] = n
                                } catch (o) {
                                    if (!i)
                                        throw o;
                                    i(e).attr(t, n)
                                } else
                                n === !1 ? e.removeAttribute(t) : e.setAttribute(t, n);
                            return e
                        },
                        r.prop = function(e, t, n) {
                            return "undefined" == typeof n ? e && e[t] : void(e[t] = n)
                        },
                        r.offset = function(e) {
                            var t = e.getBoundingClientRect();
                            return e.offsetWidth / e.offsetHeight > e.clientWidth / e.clientHeight && (t = {
                                    left: 100 * t.left,
                                    right: 100 * t.right,
                                    top: 100 * t.top,
                                    bottom: 100 * t.bottom,
                                    width: 100 * t.width,
                                    height: 100 * t.height
                                }),
                                t
                        },
                        r.width = function(e, t) {
                            if (t)
                                return e.style.width = ("" + t).replace(/px$/, "") + "px";
                            var n = r.offset(e).width;
                            return "undefined" == typeof n ? e.offsetWidth : n
                        },
                        r.height = function(e, t) {
                            if (t)
                                return e.style.height = ("" + t).replace(/px$/, "") + "px";
                            var n = r.offset(e).height;
                            return "undefined" == typeof n ? e.offsetHeight : n
                        },
                        r.lastChild = function(e) {
                            return e.children[e.children.length - 1]
                        },
                        r.hasParent = function(e, t) {
                            for (var n = e.parentElement; n;) {
                                if (r.matches(n, t))
                                    return !0;
                                n = n.parentElement
                            }
                            return !1
                        },
                        r.createAbsoluteUrl = function(e) {
                            return r.createElement("a", {
                                href: e
                            }).href
                        },
                        r.xhrGet = function(e, t, n) {
                            var r = new XMLHttpRequest;
                            r.onreadystatechange = function() {
                                    return 4 === this.readyState ? this.status >= 400 ? n() : void t(this.responseText) : void 0
                                },
                                r.open("get", e, !0),
                                r.send()
                        },
                        r.pick = function(e, t) {
                            var n = {};
                            return t.forEach(function(t) {
                                    e.hasOwnProperty(t) && (n[t] = e[t])
                                }),
                                n
                        },
                        r.hostname = function(e) {
                            return a.toUnicode(e || window.location.hostname)
                        },
                        r.browser = {
                            webkit: "WebkitAppearance" in document.documentElement.style
                        },
                        r.getPrototype = function(e) {
                            return Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__
                        },
                        r.hasOwnOrPrototypeProperty = function(e, t) {
                            for (var n = e; n;) {
                                if (Object.prototype.hasOwnProperty.call(n, t))
                                    return !0;
                                n = r.getPrototype(n)
                            }
                            return !1
                        },
                        r.matches = function(e, t) {
                            var n = Element.prototype,
                                r = n.matches || n.matchesSelector || n.mozMatchesSelector || n.msMatchesSelector || n.oMatchesSelector || n.webkitMatchesSelector || function(e) {
                                    for (var t = this, n = (t.document || t.ownerDocument).querySelectorAll(e), r = 0; n[r] && n[r] !== t;)
                                        r++;
                                    return n[r] ? !0 : !1
                                };
                            return r.call(e, t)
                        },
                        function(e) {
                            function t(e) {
                                return e.replace(/-[a-z]/g, function(e) {
                                    return e[1].toUpperCase()
                                })
                            }
                            "undefined" != typeof e.setAttribute && (e.setProperty = function(e, n) {
                                    return this.setAttribute(t(e), String(n))
                                },
                                e.getPropertyValue = function(e) {
                                    return this.getAttribute(t(e)) || null
                                },
                                e.removeProperty = function(e) {
                                    var n = this.getPropertyValue(e);
                                    return this.removeAttribute(t(e)),
                                        n
                                }
                            )
                        }(window.CSSStyleDeclaration.prototype)
                }, {
                    "class-list": 21,
                    "computed-style": 23,
                    punycode: 29
                }
            ],
            2: [
                function(e, t, n) {
                    "use strict";
                    var r = e("../common");
                    t.exports = function(e, t, n, o) {
                            n = n || "opaque";
                            var i = "obj" + ("" + Math.random()).slice(2, 15),
                                a = '<object class="fp-engine" id="' + i + '" name="' + i + '" ',
                                l = navigator.userAgent.indexOf("MSIE") > -1;
                            a += l ? 'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' : ' data="' + e + '" type="application/x-shockwave-flash">';
                            var s = {
                                width: "100%",
                                height: "100%",
                                allowscriptaccess: "always",
                                wmode: n,
                                quality: "high",
                                flashvars: "",
                                movie: e + (l ? "?" + i : ""),
                                name: i
                            };
                            "transparent" !== n && (s.bgcolor = o || "#333333"),
                                Object.keys(t).forEach(function(e) {
                                    s.flashvars += e + "=" + t[e] + "&"
                                }),
                                Object.keys(s).forEach(function(e) {
                                    a += '<param name="' + e + '" value="' + s[e] + '"/>'
                                }),
                                a += "</object>";
                            var u = r.createElement("div", {}, a);
                            return r.find("object", u)
                        },
                        window.attachEvent && window.attachEvent("onbeforeunload", function() {
                            window.__flash_savedUnloadHandler = window.__flash_unloadHandler = function() {}
                        })
                }, {
                    "../common": 1
                }
            ],
            3: [
                function(e, t, n) {
                    "use strict";

                    function r(e) {
                        return /^https?:/.test(e)
                    }
                    var o, i = e("../flowplayer"),
                        a = e("../common"),
                        l = e("./embed"),
                        s = e("extend-object"),
                        u = e("bean");
                    o = function(e, t) {
                            function n(e) {
                                function t(e) {
                                    return ("0" + parseInt(e).toString(16)).slice(-2)
                                }
                                return (e = e.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)) ? "#" + t(e[1]) + t(e[2]) + t(e[3]) : void 0
                            }

                            function c(e) {
                                if (7 === e.length)
                                    return e;
                                var t = e.split("").slice(1);
                                return "#" + t.map(function(e) {
                                    return e + e
                                }).join("")
                            }

                            function f(e) {
                                return /application\/x-mpegurl/i.test(e.type)
                            }
                            var d, p, m, v = e.conf,
                                g = (e.video,
                                    window, {
                                        engineName: o.engineName,
                                        pick: function(t) {
                                            var n = s({}, function() {
                                                if (i.support.flashVideo) {
                                                    for (var n, r, o = 0; o < t.length; o++)
                                                        if (r = t[o],
                                                            /mp4|flv|flash/i.test(r.type) && (n = r),
                                                            e.conf.swfHls && /mpegurl/i.test(r.type) && (n = r),
                                                            n && !/mp4/i.test(n.type))
                                                            return n;
                                                    return n
                                                }
                                            }());
                                            if (n)
                                                return !n.src || r(n.src) || e.conf.rtmp || n.rtmp || (n.src = a.createAbsoluteUrl(n.src)),
                                                    n
                                        },
                                        load: function(o) {
                                            function h(e) {
                                                return e.replace(/&amp;/g, "%26").replace(/&/g, "%26").replace(/=/g, "%3D")
                                            }
                                            d = o;
                                            var y = a.findDirect("video", t)[0] || a.find(".fp-player > video", t)[0],
                                                b = o.src,
                                                w = r(b),
                                                x = function() {
                                                    a.removeNode(y)
                                                },
                                                E = function(e) {
                                                    return e.some(function(e) {
                                                        return !!y.canPlayType(e.type)
                                                    })
                                                };
                                            i.support.video && a.prop(y, "autoplay") && E(o.sources) ? u.one(y, "timeupdate", x) : x();
                                            var k = o.rtmp || v.rtmp;
                                            if (w || k || (b = a.createAbsoluteUrl(b)),
                                                m && f(o) && m.data !== v.swfHls && g.unload(),
                                                m) {
                                                ["live", "preload", "loop"].forEach(function(e) {
                                                        o.hasOwnProperty(e) && m.__set(e, o[e])
                                                    }),
                                                    Object.keys(o.flashls || {}).forEach(function(e) {
                                                        m.__set("hls_"+ e, o.flashls[e])
                                                    });
                                                var T = !1;
                                                if (!w&& k)
                                                    m.__set("rtmp", k.url|| k);
                                                else {
                                                    var S = m.__get("rtmp");
                                                    T = !!S,
                                                        m.__set("rtmp", null)
                                                }
                                                m.__play(b, T|| o.rtmp&& o.rtmp!== v.rtmp)
                                            } else {
                                                p = "fpCallback"+ (""+ Math.random()).slice(3, 15),
                                                    b = h(b);
                                                var N = {
                                                    hostname: v.embedded? a.hostname(v.hostname): a.hostname(location.hostname),
                                                    url: b,
                                                    callback: p
                                                };
                                                t.getAttribute("data-origin")&& (N.origin = t.getAttribute("data-origin")), ["proxy", "key", "autoplay", "preload", "subscribe", "live", "loop", "debug", "splash", "poster", "rtmpt"].forEach(function(e) {
                                                        v.hasOwnProperty(e)&& (N[e] = v[e]),
                                                            o.hasOwnProperty(e)&& (N[e] = o[e]), (v.rtmp|| {}).hasOwnProperty(e)&& (N[e] = (v.rtmp|| {})[e]), (o.rtmp|| {}).hasOwnProperty(e)&& (N[e] = (o.rtmp|| {})[e])
                                                    }),
                                                    v.rtmp&& (N.rtmp = v.rtmp.url|| v.rtmp),
                                                    o.rtmp&& (N.rtmp = o.rtmp.url|| o.rtmp),
                                                    Object.keys(o.flashls|| {}).forEach(function(e) {
                                                        var t = o.flashls[e];
                                                        N["hls_"+ e] = t
                                                    }),
                                                    void 0!== v.bufferTime&& (N.bufferTime = v.bufferTime),
                                                    w&& delete N.rtmp,
                                                    N.rtmp&& (N.rtmp = h(N.rtmp));
                                                var C, j = v.bgcolor|| a.css(t, "background-color")|| "";
                                                0=== j.indexOf("rgb")? C = n(j): 0=== j.indexOf("#")&& (C = c(j)),
                                                    N.initialVolume = e.volumeLevel;
                                                var O = f(o)? v.swfHls: v.swf;
                                                m = l(O, N, v.wmode, C)[0];
                                                var P = a.find(".fp-player", t)[0];
                                                a.prepend(P, m),
                                                    setTimeout(function() {
                                                        try {
                                                            if (!m.PercentLoaded())
                                                                return e.trigger("error", [e, {
                                                                    code: 7,
                                                                    url: v.swf
                                                                }])
                                                        } catch (t) {}
                                                    }, 5e3),
                                                    setTimeout(function() {
                                                        "undefined"== typeof m.PercentLoaded&& e.trigger("flashdisabled", [e])
                                                    }, 1e3),
                                                    e.off("resume.flashhack").on("resume.flashhack", function() {
                                                        var t = setTimeout(function() {
                                                            e.playing&& e.trigger("flashdisabled", [e])
                                                        }, 1e3);
                                                        e.one("progress", function() {
                                                            clearTimeout(t)
                                                        })
                                                    }),
                                                    m.pollInterval = setInterval(function() {
                                                        if (m) {
                                                            var t = m.__status? m.__status(): null;
                                                            t&& (e.playing&& t.time&& t.time!== e.video.time&& e.trigger("progress", [e, t.time]),
                                                                o.buffer = t.buffer/ o.bytes* o.duration,
                                                                e.trigger("buffer", [e, o.buffer]), !o.buffered&& t.time> 0&& (o.buffered = !0,
                                                                    e.trigger("buffered", [e])))
                                                        }
                                                    }, 250),
                                                    window[p] = function(n, r) {
                                                        var o = d;
                                                        v.debug&& (0=== n.indexOf("debug")&& r&& r.length? console.log.apply(console, ["-- "+ n].concat(r)): console.log("--", n, r));
                                                        var i = {
                                                            type: n
                                                        };
                                                        switch (n) {
                                                            case "ready":
                                                                r = s(o, r);
                                                                break;
                                                            case "click":
                                                                i.flash = !0;
                                                                break;
                                                            case "keydown":
                                                                i.which = r;
                                                                break;
                                                            case "seek":
                                                                o.time = r;
                                                                break;
                                                            case "status":
                                                                e.trigger("progress", [e, r.time]),
                                                                    r.buffer < o.bytes && !o.buffered ? (o.buffer = r.buffer / o.bytes * o.duration,
                                                                        e.trigger("buffer", o.buffer)) : o.buffered || (o.buffered = !0,
                                                                        e.trigger("buffered"))
                                                        }
                                                        "click" === n || "keydown" === n ? (i.target = t,
                                                            u.fire(t, n, [i])) : "buffered" != n && "unload" !== n ? setTimeout(function() {
                                                            e.trigger(i, [e, r])
                                                        }, 1) : "unload" === n && e.trigger(i, [e, r])
                                                    }
                                            }
                                        },
                                        speed: a.noop,
                                        unload: function() {
                                            m && m.__unload && m.__unload();
                                            try {
                                                p && window[p] && delete window[p]
                                            } catch (n) {}
                                            a.find("object", t).forEach(a.removeNode),
                                                m = 0,
                                                e.off(".flashengine"),
                                                clearInterval(m.pollInterval)
                                        }
                                    });
                            return ["pause", "resume", "seek", "volume"].forEach(function(t) {
                                    g[t] = function(n) {
                                        try {
                                            e.ready && (void 0 === n ? m["__" + t]() : m["__" + t](n))
                                        } catch (r) {
                                            if ("undefined" == typeof m["__" + t])
                                                return e.trigger("flashdisabled", [e]);
                                            throw r
                                        }
                                    }
                                }),
                                g
                        },
                        o.engineName = "flash",
                        o.canPlay = function(e, t) {
                            return i.support.flashVideo && /video\/(mp4|flash|flv)/i.test(e) || i.support.flashVideo && t.swfHls && /mpegurl/i.test(e)
                        },
                        i.engines.push(o)
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    "./embed": 2,
                    bean: 20,
                    "extend-object": 25
                }
            ],
            4: [
                function(e, t, n) {
                    "use strict";

                    function r(e, t) {
                        return t = t || 100,
                            Math.round(e * t) / t
                    }

                    function o(e) {
                        return /mpegurl/i.test(e) ? "application/x-mpegurl" : e
                    }

                    function i(e) {
                        return /^(video|application)/i.test(e) || (e = o(e)), !!m.canPlayType(e).replace("no", "")
                    }

                    function a(e, t) {
                        var n = e.filter(function(e) {
                            return e.type === t
                        });
                        return n.length ? n[0] : null
                    }
                    var l, s, u = e("../flowplayer"),
                        c = e("bean"),
                        f = e("class-list"),
                        d = e("extend-object"),
                        p = e("../common"),
                        m = document.createElement("video"),
                        v = {
                            ended: "finish",
                            pause: "pause",
                            play: "resume",
                            progress: "buffer",
                            timeupdate: "progress",
                            volumechange: "volume",
                            ratechange: "speed",
                            seeked: "seek",
                            loadeddata: "ready",
                            error: "error",
                            dataunavailable: "error",
                            webkitendfullscreen: !u.support.inlineVideo && "unload"
                        },
                        g = function(e, t, n, r) {
                            if ("undefined" == typeof t && (t = !0),
                                "undefined" == typeof n && (n = "none"),
                                "undefined" == typeof r && (r = !0),
                                r && l)
                                return l.type = o(e.type),
                                    l.src = e.src,
                                    p.find("track", l).forEach(p.removeNode),
                                    l.removeAttribute("crossorigin"),
                                    l;
                            var i = document.createElement("video");
                            return i.src = e.src,
                                i.type = o(e.type),
                                i.className = "fp-engine",
                                i.autoplay = t ? "autoplay" : !1,
                                i.preload = n,
                                i.setAttribute("x-webkit-airplay", "allow"),
                                i.setAttribute("webkit-playsinline", "true"),
                                i.setAttribute("playsinline", "true"),
                                r && (l = i),
                                i
                        };
                    s = function(e, t) {
                            function n(n, o, a) {
                                var l = t.getAttribute("data-flowplayer-instance-id");
                                if (n.listeners && n.listeners.hasOwnProperty(l))
                                    return void(n.listeners[l] = a);
                                (n.listeners || (n.listeners = {}))[l] = a,
                                c.on(o, "error", function(t) {
                                        try {
                                            i(t.target.getAttribute("type")) && e.trigger("error", [e, {
                                                code: 4,
                                                video: d(a, {
                                                    src: n.src,
                                                    url: n.src
                                                })
                                            }])
                                        } catch (r) {}
                                    }),
                                    e.on("shutdown", function() {
                                        c.off(o)
                                    });
                                var s = {};
                                return Object.keys(v).forEach(function(o) {
                                        var i = v[o];
                                        if (i) {
                                            var u = function(s) {
                                                if (a = n.listeners[l],
                                                    s.target && f(s.target).contains("fp-engine") && (w.debug && !/progress/.test(i) && console.log(o, "->", i, s), (e.ready || /ready|error/.test(i)) && i && p.find("video", t).length)) {
                                                    var u;
                                                    if ("unload" === i)
                                                        return void e.unload();
                                                    var c = function() {
                                                        e.trigger(i, [e, u])
                                                    };
                                                    switch (i) {
                                                        case "ready":
                                                            u = d(a, {
                                                                duration: n.duration,
                                                                width: n.videoWidth,
                                                                height: n.videoHeight,
                                                                url: n.currentSrc,
                                                                src: n.currentSrc
                                                            });
                                                            try {
                                                                u.seekable = !e.live && /mpegurl/i.test(a ? a.type || "" : "") && n.duration || n.seekable && n.seekable.end(null)
                                                            } catch (v) {}
                                                            if (m = m || setInterval(function() {
                                                                try {
                                                                    u.buffer = n.buffered.end(n.buffered.length - 1)
                                                                } catch (t) {}
                                                                u.buffer && (r(u.buffer, 1e3) < r(u.duration, 1e3) && !u.buffered ? e.trigger("buffer", [e, u.buffer]) : u.buffered || (u.buffered = !0,
                                                                    e.trigger("buffer", [e, u.buffer]).trigger("buffered", s),
                                                                    clearInterval(m),
                                                                    m = 0))
                                                            }, 250), !e.live && !u.duration && !b.hlsDuration && "loadeddata" === o) {
                                                                var g = function() {
                                                                    u.duration = n.duration;
                                                                    try {
                                                                        u.seekable = n.seekable && n.seekable.end(null)
                                                                    } catch (e) {}
                                                                    c(),
                                                                        n.removeEventListener("durationchange", g),
                                                                        f(t).remove("is-live")
                                                                };
                                                                n.addEventListener("durationchange", g);
                                                                var h = function() {
                                                                    e.ready || n.duration || (u.duration = 0,
                                                                            f(t).add("is-live"),
                                                                            c()),
                                                                        n.removeEventListener("timeupdate", h)
                                                                };
                                                                return void n.addEventListener("timeupdate", h)
                                                            }
                                                            break;
                                                        case "progress":
                                                        case "seek":
                                                            e.video.duration;
                                                            if (n.currentTime > 0 || e.live)
                                                                u = Math.max(n.currentTime, 0);
                                                            else if ("progress" == i)
                                                                return;
                                                            break;
                                                        case "speed":
                                                            u = r(n.playbackRate);
                                                            break;
                                                        case "volume":
                                                            u = r(n.volume);
                                                            break;
                                                        case "error":
                                                            try {
                                                                u = (s.srcElement || s.originalTarget).error,
                                                                    u.video = d(a, {
                                                                        src: n.src,
                                                                        url: n.src
                                                                    })
                                                            } catch (y) {
                                                                return
                                                            }
                                                    }
                                                    c()
                                                }
                                            };
                                            t.addEventListener(o, u, !0),
                                                s[o] || (s[o] = []),
                                                s[o].push(u)
                                        }
                                    }),
                                    s
                            }
                            var o, m, h, y = p.findDirect("video", t)[0] || p.find(".fp-player > video", t)[0],
                                b = u.support,
                                w = (p.find("track", y)[0],
                                    e.conf);
                            return o = {
                                engineName: s.engineName,
                                pick: function(e) {
                                    var t = function() {
                                        if (b.video) {
                                            if (w.videoTypePreference) {
                                                var t = a(e, w.videoTypePreference);
                                                if (t)
                                                    return t
                                            }
                                            for (var n = 0; n < e.length; n++)
                                                if (i(e[n].type))
                                                    return e[n]
                                        }
                                    }();
                                    if (t)
                                        return "string" == typeof t.src && (t.src = p.createAbsoluteUrl(t.src)),
                                            t
                                },
                                load: function(r) {
                                    var i = !1,
                                        a = p.find(".fp-player", t)[0],
                                        l = !1;
                                    w.splash && !y ? (y = g(r),
                                            p.prepend(a, y),
                                            i = !0) : y ? (f(y).add("fp-engine"),
                                            p.find("source,track", y).forEach(p.removeNode),
                                            e.conf.nativesubtitles || p.attr(y, "crossorigin", !1),
                                            l = y.src === r.src) : (y = g(r, !!r.autoplay || !!w.autoplay, w.clip.preload || "metadata", !1),
                                            p.prepend(a, y),
                                            i = !0),
                                        c.off(y, "timeupdate", p.noop),
                                        c.on(y, "timeupdate", p.noop),
                                        p.prop(y, "loop", !(!r.loop && !w.loop)),
                                        "undefined" != typeof h && (y.volume = h), (e.video.src && r.src != e.video.src || r.index) && p.attr(y, "autoplay", "autoplay"),
                                        y.src = r.src,
                                        y.type = r.type,
                                        o._listeners = n(y, p.find("source", y).concat(y), r), ("none" != w.clip.preload && "mpegurl" != r.type || !b.zeropreload || !b.dataload) && y.load(), (i || l) && y.load();
                                    if (y.paused && (r.autoplay || w.autoplay)) {
                                        var pr = y.play();
                                        pr && pr.catch && pr.catch(function() {
                                            w.autoplay = !1,
                                                e.trigger("ready", [e, r])
                                        })
                                    }
                                },
                                pause: function() {
                                    y.pause()
                                },
                                resume: function() {
                                    var pr = y.play();
                                    pr && pr.catch && pr.catch(function() {
                                        return
                                    })
                                },
                                speed: function(e) {
                                    y.playbackRate = e
                                },
                                seek: function(t) {
                                    try {
                                        var n = e.paused;
                                        y.currentTime = t,
                                            n && y.pause()
                                    } catch (r) {}
                                },
                                volume: function(e) {
                                    h = e,
                                        y && (y.volume = e,
                                            y.muted = (e === 0))
                                },
                                unload: function() {
                                    p.find("video.fp-engine", t).forEach(p.removeNode),
                                        b.cachedVideoTag || (l = null),
                                        m = clearInterval(m);
                                    var e = t.getAttribute("data-flowplayer-instance-id");
                                    delete y.listeners[e],
                                        y = 0,
                                        o._listeners && Object.keys(o._listeners).forEach(function(e) {
                                            o._listeners[e].forEach(function(n) {
                                                t.removeEventListener(e, n, !0)
                                            })
                                        })
                                }
                            }
                        },
                        s.canPlay = function(e) {
                            return u.support.video && i(e)
                        },
                        s.engineName = "html5",
                        u.engines.push(s)
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    bean: 20,
                    "class-list": 21,
                    "extend-object": 25
                }
            ],
            5: [
                function(e, t, n) {
                    "use strict";
                    var r = e("../flowplayer"),
                        o = e("./resolve").TYPE_RE,
                        i = e("scriptjs"),
                        a = e("bean");
                    r(function(e, t) {
                        var n, r = e.conf.analytics,
                            l = 0,
                            s = 0;
                        if (r) {
                            "undefined" == typeof _gat && i("//google-analytics.com/ga.js");
                            var u = function() {
                                    var e = _gat._getTracker(r);
                                    return e._setAllowLinker(!0),
                                        e
                                },
                                c = function(r, i, a) {
                                    if (a = a || e.video,
                                        l && "undefined" != typeof _gat) {
                                        var s = u();
                                        s._trackEvent("Video / Seconds played", e.engine.engineName + "/" + a.type, a.title || t.getAttribute("title") || a.src.split("/").slice(-1)[0].replace(o, ""), Math.round(l / 1e3)),
                                            l = 0,
                                            n && (clearTimeout(n),
                                                n = null)
                                    }
                                };
                            e.bind("load unload", c).bind("progress", function() {
                                    e.seeking || (l += s ? +new Date - s : 0,
                                            s = +new Date),
                                        n || (n = setTimeout(function() {
                                            n = null;
                                            var e = u();
                                            e._trackEvent("Flowplayer heartbeat", "Heartbeat", "", 0, !0)
                                        }, 6e5))
                                }).bind("pause", function() {
                                    s = 0
                                }),
                                e.bind("shutdown", function() {
                                    a.off(window, "unload", c)
                                }),
                                a.on(window, "unload", c)
                        }
                    })
                }, {
                    "../flowplayer": 18,
                    "./resolve": 13,
                    bean: 20,
                    scriptjs: 28
                }
            ],
            6: [
                function(e, t, n) {
                    "use strict";
                    var r = e("../flowplayer"),
                        o = e("class-list"),
                        i = e("../common"),
                        a = e("bean");
                    r(function(e, t) {
                        function n(e) {
                            t.className = t.className.replace(l, " "),
                                e >= 0 && o(t).add("cue" + e)
                        }

                        function r(t) {
                            var n = t && !isNaN(t.time) ? t.time : t;
                            return 0 > n && (n = e.video.duration + n),
                                .125 * Math.round(n / .125)
                        }
                        var l = / ?cue\d+ ?/,
                            s = !1,
                            u = {},
                            c = -.125,
                            f = function(t) {
                                var r = e.cuepoints.indexOf(t);
                                isNaN(t) || (t = {
                                        time: t
                                    }),
                                    t.index = r,
                                    n(r),
                                    e.trigger("cuepoint", [e, t])
                            };
                        e.on("progress", function(e, t, n) {
                                if (!s)
                                    for (var o = r(n); o > c;)
                                        c += .125,
                                        u[c] && u[c].forEach(f)
                            }).on("unload", n).on("beforeseek", function(e) {
                                setTimeout(function() {
                                    e.defaultPrevented || (s = !0)
                                })
                            }).on("seek", function(e, t, o) {
                                n(),
                                    c = r(o || 0) - .125,
                                    s = !1, !o && u[0] && u[0].forEach(f)
                            }).on("ready", function(t, n, r) {
                                c = -.125;
                                var o = r.cuepoints || e.conf.cuepoints || [];
                                e.setCuepoints(o)
                            }).on("finish", function() {
                                c = -.125
                            }),
                            e.conf.generate_cuepoints && e.bind("load", function() {
                                i.find(".fp-cuepoint", t).forEach(i.removeNode)
                            }),
                            e.setCuepoints = function(t) {
                                return e.cuepoints = [],
                                    u = {},
                                    t.forEach(e.addCuepoint),
                                    e
                            },
                            e.addCuepoint = function(n) {
                                e.cuepoints || (e.cuepoints = []);
                                var o = r(n);
                                if (u[o] || (u[o] = []),
                                    u[o].push(n),
                                    e.cuepoints.push(n),
                                    e.conf.generate_cuepoints && n.visible !== !1) {
                                    var l = e.video.duration,
                                        s = i.find(".fp-timeline", t)[0];
                                    i.css(s, "overflow", "visible");
                                    var c = n.time || n;
                                    0 > c && (c = l + c);
                                    var f = i.createElement("a", {
                                        className: "fp-cuepoint fp-cuepoint" + (e.cuepoints.length - 1)
                                    });
                                    i.css(f, "left", c / l * 100 + "%"),
                                        s.appendChild(f),
                                        a.on(f, "mousedown", function(t) {
                                            t.preventDefault(),
                                                t.stopPropagation(),
                                                e.seek(c)
                                        })
                                }
                                return e
                            },
                            e.removeCuepoint = function(t) {
                                var n = e.cuepoints.indexOf(t),
                                    o = r(t);
                                if (-1 !== n) {
                                    e.cuepoints = e.cuepoints.slice(0, n).concat(e.cuepoints.slice(n + 1));
                                    var i = u[o].indexOf(t);
                                    if (-1 !== i)
                                        return u[o] = u[o].slice(0, i).concat(u[o].slice(i + 1)),
                                            e
                                }
                            }
                    })
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    bean: 20,
                    "class-list": 21
                }
            ],
            7: [
                function(e, t, n) {
                    "use strict";
                    var r = e("../flowplayer"),
                        o = e("bean"),
                        i = e("../common"),
                        a = (e("is-object"),
                            e("extend-object")),
                        l = e("class-list");
                    r(function(e, t) {
                        if (e.conf.embed !== !1) {
                            var n = (e.conf,
                                    i.find(".fp-ui", t)[0]),
                                r = i.createElement("a", {
                                    "class": "fp-embed",
                                    title: "Copy to your site"
                                }),
                                l = i.createElement("div", {
                                    "class": "fp-embed-code"
                                }, "<label>Paste this HTML code on your site to embed.</label><textarea></textarea>"),
                                u = i.find("textarea", l)[0];
                            n.appendChild(r),
                                n.appendChild(l),
                                e.embedCode = function() {
                                    var n = e.conf.embed || {},
                                        r = e.video;
                                    if (n.code) {
                                        return n.code
                                    } else if (n.iframe) {
                                        var o = (e.conf.embed.iframe,
                                                n.width || r.width || i.width(t)),
                                            l = n.height || r.height || i.height(t);
                                        return '<iframe src="' + e.conf.embed.iframe + '" allowfullscreen style="width:' + o + ";height:" + l + ';border:none;"></iframe>'
                                    }
                                    var s = ["ratio", "rtmp", "live", "bufferTime", "origin", "analytics", "key", "subscribe", "swf", "swfHls", "embed", "adaptiveRatio", "logo"];
                                    n.playlist && s.push("playlist");
                                    var u = i.pick(e.conf, s);
                                    u.logo && (u.logo = i.createElement("img", {
                                            src: u.logo
                                        }).src),
                                        n.playlist && e.conf.playlist.length || (u.clip = a({}, e.conf.clip, i.pick(e.video, ["sources"])));
                                    var c = 'var w=window,d=document,e;w._fpes||(w._fpes=[],w.addEventListener("load",function(){var s=d.createElement("script");s.src="//embed.flowplayer.org/6.0.5/embed.min.js",d.body.appendChild(s)})),e=[].slice.call(d.getElementsByTagName("script"),-1)[0].parentNode,w._fpes.push({e:e,l:"$library",c:$conf});\n'.replace("$conf", JSON.stringify(u)).replace("$library", n.library || "");
                                    return '<a href="$href">Watch video!\n<script>$script</script></a>'.replace("$href", e.conf.origin || window.location.href).replace("$script", c)
                                },
                                s(t, ".fp-embed", "is-embedding"),
                                o.on(t, "click", ".fp-embed-code textarea", function() {
                                    u.select()
                                }),
                                o.on(t, "click", ".fp-embed", function() {
                                    u.textContent = e.embedCode().replace(/(\r\n|\n|\r)/gm, ""),
                                        u.focus(),
                                        u.select()
                                })
                        }
                    });
                    var s = function(e, t, n) {
                        function r() {
                            a.remove(n),
                                o.off(document, ".st")
                        }
                        var a = l(e);
                        o.on(e, "click", t || "a", function(e) {
                            e.preventDefault(),
                                a.toggle(n),
                                a.contains(n) && (o.on(document, "keydown.st", function(e) {
                                        27 == e.which && r()
                                    }),
                                    o.on(document, "click.st", function(e) {
                                        i.hasParent(e.target, "." + n) || r()
                                    }))
                        })
                    }
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    bean: 20,
                    "class-list": 21,
                    "extend-object": 25,
                    "is-object": 27
                }
            ],
            8: [
                function(e, t, n) {
                    "use strict";
                    t.exports = function(e, t) {
                            t || (t = document.createElement("div"));
                            var n = {},
                                r = {},
                                o = function(e, o, i) {
                                    var a = e.split(".")[0],
                                        l = function(s) {
                                            i && (t.removeEventListener(a, l),
                                                n[e].splice(n[e].indexOf(l), 1));
                                            var u = [s].concat(r[s.timeStamp + s.type] || []);
                                            o && o.apply(void 0, u)
                                        };
                                    t.addEventListener(a, l),
                                        n[e] || (n[e] = []),
                                        n[e].push(l)
                                };
                            e.on = e.bind = function(t, n) {
                                    var r = t.split(" ");
                                    return r.forEach(function(e) {
                                            o(e, n)
                                        }),
                                        e
                                },
                                e.one = function(t, n) {
                                    var r = t.split(" ");
                                    return r.forEach(function(e) {
                                            o(e, n, !0)
                                        }),
                                        e
                                };
                            var i = function(e, t) {
                                return 0 === t.filter(function(t) {
                                    return -1 === e.indexOf(t)
                                }).length
                            };
                            e.off= e.unbind= function(r) {
                                    var o= r.split(" ");
                                    return o.forEach(function(e) {
                                            var r= e.split(".").slice(1),
                                                o= e.split(".")[0];
                                            Object.keys(n).filter(function(e) {
                                                var t= e.split(".").slice(1);
                                                return (!o || 0 === e.indexOf(o)) && i(t, r)
                                            }).forEach(function(e) {
                                                var r= n[e],
                                                    o= e.split(".")[0];
                                                r.forEach(function(e) {
                                                    t.removeEventListener(o, e),
                                                        r.splice(r.indexOf(e), 1)
                                                })
                                            })
                                        }),
                                        e
                                },
                                e.trigger= function(n, o, i) {
                                    if (n) {
                                        o= (o || []).length ? o || [] : [o];
                                        var a, l= document.createEvent("Event");
                                        return a= n.type || n,
                                            l.initEvent(a, !1, !0),
                                            Object.defineProperty && (l.preventDefault= function() {
                                                Object.defineProperty(this, "defaultPrevented", {
                                                    get: function() {
                                                        return !0
                                                    }
                                                })
                                            }),
                                            r[l.timeStamp + l.type]= o,
                                            t.dispatchEvent(l),
                                            i ? l : e
                                    }
                                }
                        },
                        t.exports.EVENTS= ["beforeseek", "disable", "error", "finish", "fullscreen", "fullscreen-exit", "load", "mute", "pause", "progress", "ready", "resume", "seek", "speed", "stop", "unload", "volume", "boot", "shutdown"]
                }, {}
            ],
            9: [
                function(e, t, n) {
                    "use strict";
                    var r, o= e("../flowplayer"),
                        i= e("bean"),
                        a= e("class-list"),
                        l= (e("extend-object"),
                            e("../common")),
                        s= (o.support.browser.mozilla ? "moz" : "webkit",
                            "fullscreen"),
                        u= "fullscreen-exit",
                        c= o.support.fullscreen,
                        f= ("function" == typeof document.exitFullscreen,
                            navigator.userAgent.toLowerCase()),
                        d= /(safari)[ \/]([\w.]+)/.exec(f) && !/(chrome)[ \/]([\w.]+)/.exec(f);
                    i.on(document, "fullscreenchange.ffscr webkitfullscreenchange.ffscr mozfullscreenchange.ffscr MSFullscreenChange.ffscr", function(e) {
                            var t= document.webkitCurrentFullScreenElement || document.mozFullScreenElement || document.fullscreenElement || document.msFullscreenElement || e.target;
                            if (r || t.parentNode && t.parentNode.getAttribute("data-flowplayer-instance-id")) {
                                var n= r || o(t.parentNode);
                                t && !r ? r= n.trigger(s, [t]) : (r.trigger(u, [r]),
                                    r= null)
                            }
                        }),
                        o(function(e, t) {
                            var n= l.createElement("div", {
                                className: "fp-player"
                            });
                            if (Array.prototype.map.call(t.children, l.identity).forEach(function(e) {
                                    l.matches(e, ".fp-ratio,script") || n.appendChild(e)
                                }),
                                t.appendChild(n),
                                e.conf.fullscreen) {
                                var o, i, f= window,
                                    p= a(t);
                                e.isFullscreen= !1,
                                    e.fullscreen= function(t) {
                                        return e.disabled ? void 0 : (void 0 === t && (t= !e.isFullscreen),
                                            t && (o= f.scrollY,
                                                i= f.scrollX),
                                            c ? t ? ["requestFullScreen", "webkitRequestFullScreen", "mozRequestFullScreen", "msRequestFullscreen"].forEach(function(e) {
                                                return "function" == typeof n[e] ? (n[e](Element.ALLOW_KEYBOARD_INPUT), !1) : void 0
                                            }) : ["exitFullscreen", "webkitCancelFullScreen", "mozCancelFullScreen", "msExitFullscreen"].forEach(function(e) {
                                                return "function" == typeof document[e] ? (document[e](), !1) : void 0
                                            }) : e.trigger(t ? s : u, [e]),
                                            e)
                                    };
                                var m;
                                e.on("mousedown.fs", function() {
                                        +new Date - m < 150 && e.ready && e.fullscreen(),
                                            m= +new Date
                                    }),
                                    e.on(s, function(n) {
                                        p.add("is-fullscreen"),
                                            c || l.css(t, "position", "fixed"),
                                            e.isFullscreen= !0
                                    }).on(u, function(n) {
                                        var r;
                                        c || "html5" !== e.engine || (r= t.css("opacity") || "",
                                                l.css(t, "opacity", 0)),
                                            c || l.css(t, "position", ""),
                                            p.remove("is-fullscreen"),
                                            c || "html5" !== e.engine || setTimeout(function() {
                                                t.css("opacity", r)
                                            }),
                                            e.isFullscreen= !1,
                                            f.scrollTo(i, o)
                                    }).on("unload", function() {
                                        e.isFullscreen && e.fullscreen()
                                    }),
                                    e.on("shutdown", function() {
                                        r= null
                                    })
                            }
                        })
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    bean: 20,
                    "class-list": 21,
                    "extend-object": 25
                }
            ],
            10: [
                function(e, t, n) {
                    "use strict";
                    var r, o, i= e("../flowplayer"),
                        a= e("bean"),
                        l= "is-help",
                        s= e("../common"),
                        u= e("class-list");
                    a.on(document, "keydown.fp", function(e) {
                            if (!flowplayer.support.autoplay) {
                                return;
                            }
                            var t= r,
                                n= e.ctrlKey || e.metaKey || e.altKey,
                                i= e.which,
                                a= t && t.conf,
                                s= o && u(o);
                            if (t && a.keyboard && !t.disabled) {
                                if (-1 != [63, 187, 191].indexOf(i))
                                    return s.toggle(l), !1;
                                if (27 == i && s.contains(l))
                                    return s.toggle(l), !1;
                                if (!n && t.ready) {
                                    if (e.preventDefault(),
                                        e.shiftKey)
                                        return void(39 == i ? t.speed(!0) : 37 == i && t.speed(!1));
                                    if (58 > i && i > 47)
                                        return t.seekTo(i - 48);
                                    switch (i) {
                                        case 38:
                                        case 75:
                                            t.volume(t.volumeLevel + .15);
                                            break;
                                        case 40:
                                        case 74:
                                            t.volume(t.volumeLevel - .15);
                                            break;
                                        case 190:
                                            t.seekTo();
                                            break;
                                        case 8:
                                            t.seekTo(0);
                                            break;
                                        case 35:
                                            t.seekTo(10);
                                            break;
                                        case 36:
                                            t.seekTo(0);
                                            break;
                                        case 70:
                                            a.fullscreen && t.fullscreen();
                                            break;
                                        case 77:
                                            t.mute()
                                    };
                                    t.trigger("keydown", [t, i])
                                }
                            }
                        }),
                        a.on(document, "keyup.fp", function(e) {
                            var t= r,
                                n= e.ctrlKey || e.metaKey || e.altKey,
                                i= e.which,
                                a= t && t.conf;
                            t && a.keyboard && !t.disabled && !n && t.ready && (e.preventDefault(),
                                t.trigger("keyup", [t, i]))
                        }),
                        i(function(e, t) {
                            if (e.conf.keyboard) {
                                a.on(t, "mouseenter mouseleave", function(n) {
                                    r= e.disabled || "mouseover" != n.type ? 0 : e,
                                        r && (o= t)
                                });
                                var n= i.support.video && "flash" !== e.conf.engine && document.createElement("video").playbackRate ? "<p><em>shift</em> + <em>&#8592;</em><em>&#8594;</em>slower / faster</p>" : "";
                                if (t.appendChild(s.createElement("div", {
                                        className: "fp-help"
                                    }, '         <a class="fp-close"></a>         <div class="fp-help-section fp-help-basics">            <p><em>space</em>play / pause</p>            <p><em>q</em>unload | stop</p>            <p><em>f</em>fullscreen</p>' + n + '         </div>         <div class="fp-help-section">            <p><em>&#8593;</em><em>&#8595;</em>volume</p>            <p><em>m</em>mute</p>         </div>         <div class="fp-help-section">            <p><em>&#8592;</em><em>&#8594;</em>seek</p>            <p><em>&nbsp;. </em>seek to previous            </p><p><em>1</em><em>2</em>&hellip; <em>6</em> seek to 10%, 20% &hellip; 60% </p>         </div>   ')),
                                    e.conf.tooltip) {
                                    var c= s.find(".fp-ui", t)[0];
                                    c.setAttribute("title", "Hit ? for help"),
                                        a.one(t, "mouseout.tip", ".fp-ui", function() {
                                            c.removeAttribute("title")
                                        })
                                }
                                a.on(t, "click", ".fp-close", function() {
                                        u(t).toggle(l)
                                    }),
                                    e.bind("shutdown", function() {
                                        o == t && (o= null)
                                    })
                            }
                        })
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    bean: 20,
                    "class-list": 21
                }
            ],
            11: [
                function(e, t, n) {
                    "use strict";
                    var r= e("../flowplayer"),
                        o= /IEMobile/.test(window.navigator.userAgent),
                        i= e("class-list"),
                        a= e("../common"),
                        l= e("bean"),
                        s= e("./ui").format,
                        u= window.navigator.userAgent;
                    (r.support.touch || o) && r(function(e, t) {
                        var n= /Android/.test(u) && !/Firefox/.test(u) && !/Opera/.test(u),
                            c= /Silk/.test(u),
                            f= n ? parseFloat(/Android\ (\d+(\.\d+)?)/.exec(u)[1], 10) : 0,
                            d= i(t);
                        if (n && !o) {
                            if (!/Chrome/.test(u) && 4 > f) {
                                var p= e.load;
                                e.load= function(t, n) {
                                    var r= p.apply(e, arguments);
                                    return e.trigger("ready", [e, e.video]),
                                        r
                                }
                            }
                            var m, v= 0,
                                g= function(e) {
                                    m= setInterval(function() {
                                        e.video.time= ++v,
                                            e.trigger("progress", [e, v])
                                    }, 1e3)
                                };
                            e.bind("ready pause unload", function() {
                                    m && (clearInterval(m),
                                        m= null)
                                }),
                                e.bind("ready", function() {
                                    v= 0
                                }),
                                e.bind("resume", function(t, n) {
                                    return n.live ? v ? g(n) : void e.one("progress", function(e, t, n) {
                                        0 === n && g(t)
                                    }) : void 0
                                })
                        }
                        r.support.volume || (d.add("no-volume"),
                                d.add("no-mute")),
                            d.add("is-touch"),
                            e.sliders && e.sliders.timeline && e.sliders.timeline.disableAnimation(), (!r.support.inlineVideo || e.conf.native_fullscreen) && (e.conf.nativesubtitles= !0);
                        var h= !1;
                        l.on(t, "touchmove", function() {
                                h= !0
                            }),
                            l.on(t, "touchend click", function(t) {
                                return h ? void(h= !1) : e.playing && !d.contains("is-mouseover") ? (d.add("is-mouseover"),
                                    d.remove("is-mouseout"),
                                    t.preventDefault(),
                                    void t.stopPropagation()) : void(e.playing || e.splash || !d.contains("is-mouseout") || d.contains("is-mouseover") || setTimeout(function() {
                                    e.playing || e.splash || e.resume()
                                }, 400))
                            }),
                            e.conf.native_fullscreen && "function" == typeof document.createElement("video").webkitEnterFullScreen && (e.fullscreen= function() {
                                var e= a.find("video.fp-engine", t)[0];
                                e.webkitEnterFullScreen(),
                                    l.one(e, "webkitendfullscreen", function() {
                                        a.prop(e, "controls", !0),
                                            a.prop(e, "controls", !1)
                                    })
                            }), (false) && e.bind("ready", function() {
                                var n= a.find("video.fp-engine", t)[0];
                                l.one(n, "canplay", function() {
                                        n.play()
                                    }),
                                    n.play(),
                                    e.bind("progress.dur", function() {
                                        var r= n.duration;
                                        1 !== r && (e.video.duration= r,
                                            a.find(".fp-duration", t)[0].innerHTML= s(r),
                                            e.unbind("progress.dur"))
                                    })
                            })
                    })
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    "./ui": 17,
                    bean: 20,
                    "class-list": 21
                }
            ],
            12: [
                function(e, t, n) {
                    "use strict";
                    var r= e("../flowplayer"),
                        o= e("extend-object"),
                        i= e("bean"),
                        a= e("class-list"),
                        l= e("../common"),
                        s= e("./resolve"),
                        u= new s,
                        c= window.jQuery,
                        f= /^#/;
                    r(function(e, t) {
                        function n() {
                            return l.find(v.query, r())
                        }

                        function r() {
                            return f.test(v.query) ? void 0 : t
                        }

                        function d() {
                            return l.find(v.query + "." + g, r())
                        }

                        function p() {
                            var n= l.find(".fp-playlist", t)[0];
                            if (!n) {
                                n= l.createElement("div", {
                                    className: "fp-playlist"
                                });
                                var r= l.find(".fp-next,.fp-prev", t);
                                r.length ? r[0].parentElement.insertBefore(n, r[0]) : l.insertAfter(t, l.find("video", t)[0], n)
                            }
                            n.innerHTML= "",
                                e.conf.playlist[0].length && (e.conf.playlist= e.conf.playlist.map(function(e) {
                                    if ("string" == typeof e) {
                                        var t= e.split(s.TYPE_RE)[1];
                                        return {
                                            sources: [{
                                                type: "m3u8" === t.toLowerCase() ? "application/x-mpegurl" : "video/" + t,
                                                src: e
                                            }]
                                        }
                                    }
                                    return {
                                        sources: e.map(function(e) {
                                            var t= {};
                                            return Object.keys(e).forEach(function(n) {
                                                    t.type= /mpegurl/i.test(n) ? "application/x-mpegurl" : "video/" + n,
                                                        t.src= e[n]
                                                }),
                                                t
                                        })
                                    }
                                })),
                                e.conf.playlist.forEach(function(e, t) {
                                    var r= e.sources[0].src;
                                    n.appendChild(l.createElement("a", {
                                        href: r,
                                        "data-index": t
                                    }))
                                })
                        }

                        function m(t) {
                            return "undefined" != typeof t.index ? t.index : "undefined" != typeof e.video.index ? e.video.index : e.conf.startIndex || 0
                        }
                        var v= o({
                                active: "is-active",
                                advance: !0,
                                query: ".fp-playlist a"
                            }, e.conf),
                            g= v.active,
                            h= a(t);
                        e.play= function(t) {
                                if (void 0 === t)
                                    return e.resume();
                                if ("number" == typeof t && !e.conf.playlist[t])
                                    return e;
                                if ("number" != typeof t)
                                    return e.load.apply(null, arguments);
                                var n= o({
                                    index: t
                                }, e.conf.playlist[t]);
                                return t === e.video.index ? e.load(n, function() {
                                    e.resume()
                                }) : (e.off("resume.fromfirst"),
                                    e.load(n, function() {
                                        e.video.index= t
                                    }),
                                    e)
                            },
                            e.next= function(t) {
                                t && t.preventDefault();
                                var n= e.video.index;
                                return -1 != n && (n= n === e.conf.playlist.length - 1 ? 0 : n + 1,
                                        e.play(n)),
                                    e
                            },
                            e.prev= function(t) {
                                t && t.preventDefault();
                                var n= e.video.index;
                                return -1 != n && (n= 0 === n ? e.conf.playlist.length - 1 : n - 1,
                                        e.play(n)),
                                    e
                            },
                            e.setPlaylist= function(t) {
                                return e.conf.playlist= t,
                                    delete e.video.index,
                                    p(),
                                    e
                            },
                            e.addPlaylistItem= function(t) {
                                return e.setPlaylist(e.conf.playlist.concat([t]))
                            },
                            e.removePlaylistItem= function(t) {
                                var n= e.conf.playlist;
                                return e.setPlaylist(n.slice(0, t).concat(n.slice(t + 1)))
                            },
                            i.on(t, "click", ".fp-next", e.next),
                            i.on(t, "click", ".fp-prev", e.prev),
                            v.advance && e.off("finish.pl").on("finish.pl", function(e, t) {
                                if (t.video.loop)
                                    return t.seek(0, function() {
                                        t.resume()
                                    });
                                var n= t.video.index >= 0 ? t.video.index + 1 : void 0;
                                n < t.conf.playlist.length || v.loop ? (n= n === t.conf.playlist.length ? 0 : n,
                                    h.remove("is-finished"),
                                    setTimeout(function() {
                                        t.play(n)
                                    })) : t.conf.playlist.length > 1 && t.one("resume.fromfirst", function() {
                                    return t.play(0), !1
                                })
                            });
                        var y= !1;
                        e.conf.playlist.length && (y= !0,
                                p(),
                                e.conf.clip && e.conf.clip.sources.length || (e.conf.clip= e.conf.playlist[e.conf.startIndex || 0])),
                            n().length && !y && (e.conf.playlist= [],
                                delete e.conf.startIndex,
                                n().forEach(function(t) {
                                    var n= t.href;
                                    t.setAttribute("data-index", e.conf.playlist.length);
                                    var r= u.resolve(n, e.conf.clip.sources);
                                    c && o(r, c(t).data()),
                                        e.conf.playlist.push(r)
                                })),
                            i.on(f.test(v.query) ? document : t, "click", v.query, function(t) {
                                t.preventDefault();
                                var n= t.currentTarget,
                                    r= Number(n.getAttribute("data-index")); - 1 != r && e.play(r)
                            }),
                            e.on("load", function(n, o, i) {
                                if (e.conf.playlist.length) {
                                    var s= d()[0],
                                        u= s && s.getAttribute("data-index"),
                                        c= i.index= m(i),
                                        f= l.find(v.query + '[data-index="' + c + '"]', r())[0],
                                        p= c == e.conf.playlist.length - 1;
                                    s && a(s).remove(g),
                                        f && a(f).add(g),
                                        h.remove("video" + u),
                                        h.add("video" + c),
                                        l.toggleClass(t, "last-video", p),
                                        i.index= o.video.index= c,
                                        i.is_last= o.video.is_last= p
                                }
                            }).on("unload.pl", function() {
                                e.conf.playlist.length && (d().forEach(function(e) {
                                        a(e).toggle(g)
                                    }),
                                    e.conf.playlist.forEach(function(e, t) {
                                        h.remove("video" + t)
                                    }))
                            }),
                            e.conf.playlist.length && (e.conf.loop= !1)
                    })
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    "./resolve": 13,
                    bean: 20,
                    "class-list": 21,
                    "extend-object": 25
                }
            ],
            13: [
                function(e, t, n) {
                    "use strict";

                    function r(e) {
                        var t= e.attr("src"),
                            n= e.attr("type") || "",
                            r= t.split(i)[1];
                        return n= n.toLowerCase(),
                            a(e.data(), {
                                src: t,
                                suffix: r || n,
                                type: n || r
                            })
                    }

                    function o(e) {
                        return /mpegurl/i.test(e) ? "application/x-mpegurl" : "video/" + e
                    }
                    var i= /\.(\w{3,4})(\?.*)?$/i,
                        a= e("extend-object");
                    t.exports= function() {
                            var e= this;
                            e.sourcesFromVideoTag= function(e, t) {
                                    var n= [];
                                    return t("source", e).each(function() {
                                            n.push(r(t(this)))
                                        }), !n.length && e.length && n.push(r(e)),
                                        n
                                },
                                e.resolve= function(e, t) {
                                    return e ? ("string" == typeof e && (e= {
                                                src: e,
                                                sources: []
                                            },
                                            e.sources= (t || []).map(function(t) {
                                                var n= t.src.split(i)[1];
                                                return {
                                                    type: t.type,
                                                    src: e.src.replace(i, "." + n + "$2")
                                                }
                                            })),
                                        e instanceof Array && (e= {
                                            sources: e.map(function(e) {
                                                return e.type && e.src ? e : Object.keys(e).reduce(function(t, n) {
                                                    return a(t, {
                                                        type: o(n),
                                                        src: e[n]
                                                    })
                                                }, {})
                                            })
                                        }),
                                        e) : {
                                        sources: t
                                    }
                                }
                        },
                        t.exports.TYPE_RE= i
                }, {
                    "extend-object": 25
                }
            ],
            14: [
                function(e, t, n) {
                    "use strict";
                    var r= e("class-list"),
                        o= e("bean"),
                        i= e("../common"),
                        a= function(e, t) {
                            var n;
                            return function() {
                                n || (e.apply(this, arguments),
                                    n= 1,
                                    setTimeout(function() {
                                        n= 0
                                    }, t))
                            }
                        },
                        l= function(e, t) {
                            var n, l, s, u, c, f, d, p, m= (/iPad/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent),
                                    i.lastChild(e)),
                                v= r(e),
                                g= r(m),
                                h= !1,
                                y= function() {
                                    l= i.offset(e),
                                        s= i.width(e),
                                        u= i.height(e),
                                        f= c ? u : s,
                                        p= E(d)
                                },
                                b= function(t) {
                                    n || t == k.value || d && !(d > t) || (o.fire(e, "slide", [t]),
                                        k.value= t)
                                },
                                w= function(e) {
                                    var n= e.pageX || e.clientX;
                                    !n && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length && (n= e.originalEvent.touches[0].pageX);
                                    var r= c ? e.pageY - l.top : n - l.left;
                                    r= Math.max(0, Math.min(p || f, r));
                                    var o= r / f;
                                    return c && (o= 1 - o),
                                        t && (o= 1 - o),
                                        x(o, 0, !0)
                                },
                                x= function(e, t) {
                                    void 0 === t && (t= 0),
                                        e > 1 && (e= 1);
                                    var n= Math.round(1e3 * e) / 10 + "%";
                                    return (!d || d >= e) && (g.remove("animated"),
                                            h ? g.remove("animated") : (g.add("animated"),
                                                i.css(m, "transition-duration", (t || 0) + "ms")),
                                            i.css(m, "width", n)),
                                        e
                                },
                                E= function(e) {
                                    return Math.max(0, Math.min(f, c ? (1 - e) * u : e * s))
                                },
                                k= {
                                    max: function(e) {
                                        d= e
                                    },
                                    disable: function(e) {
                                        n= e
                                    },
                                    slide: function(e, t, n) {
                                        y(),
                                            n && b(e),
                                            x(e, t)
                                    },
                                    disableAnimation: function(t, n) {
                                        h= t !== !1,
                                            i.toggleClass(e, "no-animation", !!n)
                                    }
                                };
                            return y(),
                                o.on(e, "mousedown.sld touchstart", function(e) {
                                    if (e.preventDefault(), !n) {
                                        var t= a(b, 100);
                                        y(),
                                            k.dragging= !0,
                                            v.add("is-dragging"),
                                            b(w(e)),
                                            o.on(document, "mousemove.sld touchmove.sld", function(e) {
                                                e.preventDefault(),
                                                    t(w(e))
                                            }),
                                            o.one(document, "mouseup touchend", function() {
                                                k.dragging= !1,
                                                    v.remove("is-dragging"),
                                                    o.off(document, "mousemove.sld touchmove.sld")
                                            })
                                    }
                                }),
                                k
                        };
                    t.exports= l
                }, {
                    "../common": 1,
                    bean: 20,
                    "class-list": 21
                }
            ],
            15: [
                function(e, t, n) {
                    "use strict";
                    var r= e("../flowplayer"),
                        o= e("../common"),
                        i= e("bean"),
                        a= e("class-list");
                    r.defaults.subtitleParser= function(e) {
                            function t(e) {
                                var t= e.split(":");
                                return 2 == t.length && t.unshift(0),
                                    60 * t[0] * 60 + 60 * t[1] + parseFloat(t[2].replace(",", "."))
                            }
                            for (var n, r, o, i= /^(([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3}) --\> (([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3})(.*)/, a= [], l= 0, s= e.split("\n"), u= s.length, c= {}; u > l; l++)
                                if (r= i.exec(s[l])) {
                                    for (n= s[l - 1],
                                        o= "<p>" + s[++l] + "</p><br/>";
                                        "string" == typeof s[++l] && s[l].trim() && l < s.length;)
                                        o += "<p>" + s[l] + "</p><br/>";
                                    c= {
                                            title: n,
                                            startTime: t(r[1]),
                                            endTime: t(r[3]),
                                            text: o
                                        },
                                        a.push(c)
                                }
                            return a
                        },
                        r(function(e, t) {
                            var n, l, s, u, c= a(t),
                                f= function() {
                                    u= o.createElement("a", {
                                        className: "fp-menu"
                                    });
                                    var n= o.createElement("ul", {
                                        className: "fp-dropdown fp-dropup"
                                    });
                                    return n.appendChild(o.createElement("li", {
                                            "data-subtitle-index": -1
                                        }, "No subtitles")), (e.video.subtitles || []).forEach(function(e, t) {
                                            var r= e.srclang || "en",
                                                i= e.label || "Default (" + r + ")",
                                                a= o.createElement("li", {
                                                    "data-subtitle-index": t
                                                }, i);
                                            n.appendChild(a)
                                        }),
                                        u.appendChild(n),
                                        o.find(".fp-controls", t)[0].appendChild(u),
                                        u
                                };
                            i.on(t, "click", ".fp-menu", function(e) {
                                    a(u).toggle("dropdown-open")
                                }),
                                i.on(t, "click", ".fp-menu li[data-subtitle-index]", function(t) {
                                    var n= t.target.getAttribute("data-subtitle-index");
                                    return "-1" === n ? e.disableSubtitles() : void e.loadSubtitles(n)
                                });
                            var d= function() {
                                var e= o.find(".fp-player", t)[0];
                                s= o.find(".fp-subtitle", t)[0],
                                    s= s || o.appendTo(o.createElement("div", {
                                        "class": "fp-subtitle"
                                    }), e),
                                    Array.prototype.forEach.call(s.children, o.removeNode),
                                    n= a(s),
                                    o.find(".fp-menu", t).forEach(o.removeNode),
                                    f()
                            };
                            e.on("ready", function(n, i, a) {
                                    var l= i.conf;
                                    if (r.support.subtitles && l.nativesubtitles && "html5" == i.engine.engineName) {
                                        var s= function(e) {
                                            var n= o.find("video", t)[0].textTracks;
                                            n.length && (n[0].mode= e)
                                        };
                                        if (!a.subtitles || !a.subtitles.length)
                                            return;
                                        var u= o.find("video.fp-engine", t)[0];
                                        return a.subtitles.some(function(e) {
                                                return !o.isSameDomain(e.src)
                                            }) && o.attr(u, "crossorigin", "anonymous"),
                                            u.textTracks.addEventListener("addtrack", function() {
                                                s("disabled"),
                                                    s("showing")
                                            }),
                                            void a.subtitles.forEach(function(e) {
                                                u.appendChild(o.createElement("track", {
                                                    kind: "subtitles",
                                                    srclang: e.srclang || "en",
                                                    label: e.label || "en",
                                                    src: e.src,
                                                    "default": e["default"]
                                                }))
                                            })
                                    }
                                    if (i.subtitles= [],
                                        d(),
                                        c.remove("has-menu"),
                                        e.disableSubtitles(),
                                        a.subtitles && a.subtitles.length) {
                                        c.add("has-menu");
                                        var f= a.subtitles.filter(function(e) {
                                            return e["default"]
                                        })[0];
                                        f && i.loadSubtitles(a.subtitles.indexOf(f))
                                    }
                                }),
                                e.bind("cuepoint", function(e, t, r) {
                                    r.subtitle ? (l= r.index,
                                        o.html(s, r.subtitle.text),
                                        n.add("fp-active")) : r.subtitleEnd && (n.remove("fp-active"),
                                        l= r.index)
                                }),
                                e.bind("seek", function(t, r, o) {
                                    l && e.cuepoints[l] && e.cuepoints[l].time > o && (n.remove("fp-active"),
                                        l= null), (e.cuepoints || []).forEach(function(t) {
                                        var n= t.subtitle;
                                        n && l != t.index ? o >= t.time && (!n.endTime || o <= n.endTime) && e.trigger("cuepoint", [e, t]) : t.subtitleEnd && o >= t.time && t.index == l + 1 && e.trigger("cuepoint", [e, t])
                                    })
                                });
                            var p= function(e) {
                                o.toggleClass(o.find("li.active", t)[0], "active"),
                                    o.toggleClass(o.find('li[data-subtitle-index="' + e + '"]', t)[0], "active")
                            };
                            e.disableSubtitles= function() {
                                    return e.subtitles= [], (e.cuepoints || []).forEach(function(t) {
                                            (t.subtitle || t.subtitleEnd) && e.removeCuepoint(t)
                                        }),
                                        s && Array.prototype.forEach.call(s.children, o.removeNode),
                                        p(-1),
                                        e
                                },
                                e.loadSubtitles= function(t) {
                                    e.disableSubtitles();
                                    var n= e.video.subtitles[t],
                                        r= n.src;
                                    return r ? (p(t),
                                        o.xhrGet(r, function(t) {
                                            var n= e.conf.subtitleParser(t);
                                            n.forEach(function(t) {
                                                var n= {
                                                    time: t.startTime,
                                                    subtitle: t,
                                                    visible: !1
                                                };
                                                e.subtitles.push(t),
                                                    e.addCuepoint(n),
                                                    e.addCuepoint({
                                                        time: t.endTime,
                                                        subtitleEnd: t.title,
                                                        visible: !1
                                                    }),
                                                    0 !== t.startTime || e.video.time || e.trigger("cuepoint", [e, n])
                                            })
                                        }, function() {
                                            return e.trigger("error", {
                                                code: 8,
                                                url: r
                                            }), !1
                                        }),
                                        e) : void 0
                                }
                        })
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    bean: 20,
                    "class-list": 21
                }
            ],
            16: [
                function(e, t, n) {
                    "use strict";
                    var r= e("../flowplayer"),
                        o= e("extend-object");
                    ! function() {
                        var e= function(e) {
                                var t= /Version\/(\d\.\d)/.exec(e);
                                return t && t.length > 1 ? parseFloat(t[1], 10) : 0
                            },
                            t= function() {
                                var e= document.createElement("video");
                                return e.loop= !0,
                                    e.autoplay= !0,
                                    e.preload= !0,
                                    e
                            },
                            n= {},
                            i= navigator.userAgent.toLowerCase(),
                            a= /(chrome)[ \/]([\w.]+)/.exec(i) || /(safari)[ \/]([\w.]+)/.exec(i) || /(webkit)[ \/]([\w.]+)/.exec(i) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(i) || /(msie) ([\w.]+)/.exec(i) || i.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(i) || [];
                        a[1] && (n[a[1]]= !0,
                            n.version= a[2] || "0");
                        var l= t(),
                            s= navigator.userAgent,
                            u= n.msie || /Trident\/7/.test(s),
                            c= /iPad|MeeGo/.test(s) && !/CriOS/.test(s),
                            f= /iPad/.test(s) && /CriOS/.test(s),
                            d= /iP(hone|od)/i.test(s) && !/iPad/.test(s) && !/IEMobile/i.test(s),
                            p= /Android/.test(s) && !/Firefox/.test(s),
                            m= /Android/.test(s) && /Firefox/.test(s),
                            v= /Silk/.test(s),
                            g= /IEMobile/.test(s),
                            h= g ? parseFloat(/Windows\ Phone\ (\d+\.\d+)/.exec(s)[1], 10) : 0,
                            y= g ? parseFloat(/IEMobile\/(\d+\.\d+)/.exec(s)[1], 10) : 0,
                            b= (c ? e(s) : 0,
                                p ? parseFloat(/Android\ (\d+(\.\d+)?)/.exec(s)[1], 10) : 0),
                            w= o(r.support, {
                                browser: n,
                                subtitles: !!l.addTextTrack,
                                fullscreen: "function" == typeof document.webkitCancelFullScreen && !/Mac OS X 10_5.+Version\/5\.0\.\d Safari/.test(s) || document.mozFullScreenEnabled || "function" == typeof document.exitFullscreen || "function" == typeof document.msExitFullscreen,
                                inlineBlock: !(u && n.version < 8),
                                touch: "ontouchstart" in window,
                                dataload: !c && !d && !g,
                                zeropreload: !u && !p,
                                volume: !(c || p || d || v || f || m),
                                cachedVideoTag: !(c || d || f || g),
                                autoplay: !(c || d || f || p || v || g || m),
                                inlineVideo: (!g || h >= 8.1 && y >= 11) && (!p || b >= 3),
                                hlsDuration: !p && (!n.safari || c || d || f),
                                seekable: !c && !f,
                                iphone: d,
                                ios: d || c || f
                            });
                        try {
                            var x= navigator.plugins["Shockwave Flash"],
                                E= u ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version") : x.description;
                            u || x[0].enabledPlugin ? (E= E.split(/\D+/),
                                E.length && !E[0] && (E= E.slice(1)),
                                w.flashVideo= E[0] > 9 || 9 == E[0] && E[3] >= 115) : w.flashVideo= !1
                        } catch (k) {}
                        try {
                            w.video= !!l.canPlayType,
                                w.video && l.canPlayType("video/mp4")
                        } catch (T) {
                            w.video= !1
                        }
                        w.animation= function() {
                            for (var e= ["", "Webkit", "Moz", "O", "ms", "Khtml"], t= document.createElement("p"), n= 0; n < e.length; n++)
                                if ("undefined" != typeof t.style[e[n] + "AnimationName"])
                                    return !0
                        }()
                    }()
                }, {
                    "../flowplayer": 18,
                    "extend-object": 25
                }
            ],
            17: [
                function(e, t, n) {
                    "use strict";

                    function r(e) {
                        return e= parseInt(e, 10),
                            e >= 10 ? e : "0" + e
                    }

                    function o(e) {
                        e= e || 0;
                        var t= Math.floor(e / 3600),
                            n= Math.floor(e / 60);
                        return e -= 60 * n,
                            t >= 1 ? (n -= 60 * t,
                                t + ":" + r(n) + ":" + r(e)) : r(n) + ":" + r(e)
                    }
                    var i= e("../flowplayer"),
                        a= e("../common"),
                        l= e("class-list"),
                        s= e("bean"),
                        u= e("./slider");
                    i(function(e, t) {
                            function n(e) {
                                return a.find(".fp-" + e, t)[0]
                            }

                            function r(e) {
                                a.css(w, "padding-top", 100 * e + "%"),
                                    p.inlineBlock || a.height(a.find("object", t)[0], a.height(t))
                            }

                            function c(e) {
                                e ? (m.add("is-mouseover"),
                                    m.remove("is-mouseout")) : (m.add("is-mouseout"),
                                    m.remove("is-mouseover"))
                            }
                            var f, d= e.conf,
                                p= i.support,
                                m= l(t);
                            a.find(".fp-ratio,.fp-ui", t).forEach(a.removeNode),
                                m.add("flowplayer"),
                                t.appendChild(a.createElement("div", {
                                    className: "fp-ratio"
                                }));
                            var v= a.createElement("div", {
                                className: "fp-ui"
                            }, '         <div class="waiting"><em></em><em></em><em></em></div>         <a class="fullscreen"></a>         <a class="unload"></a>         <p class="speed"></p>         <div class="controls">            <a class="play"></a>            <div class="timeline">               <div class="buffer"></div>               <div class="progress"></div>            </div>            <div class="timeline-tooltip fp-tooltip"></div>            <div class="volume">               <a class="mute"></a>               <div class="volumeslider">                  <div class="volumelevel"></div>               </div>            </div>         </div>         <div class="time">            <em class="elapsed">00:00</em>            <em class="remaining"></em>            <em class="duration">00:00</em>         </div>         <div class="message"><h2></h2><p></p></div>'.replace(/class="/g, 'class="fp-'));
                            t.appendChild(v);
                            var g= (n("progress"),
                                    n("buffer")),
                                h= n("elapsed"),
                                y= n("remaining"),
                                b= n("waiting"),
                                w= n("ratio"),
                                x= n("speed"),
                                E= l(x),
                                k= n("duration"),
                                T= n("controls"),
                                S= n("timeline-tooltip"),
                                N= a.css(w, "padding-top"),
                                C= n("timeline"),
                                j= u(C, e.rtl),
                                O= (n("volume"),
                                    n("fullscreen")),
                                P= n("volumeslider"),
                                A= u(P, e.rtl),
                                _= m.contains("fixed-controls") || m.contains("no-toggle");
                            j.disableAnimation(m.contains("is-touch")),
                                e.sliders= e.sliders || {},
                                e.sliders.timeline= j,
                                e.sliders.volume= A,
                                p.animation || a.html(b, "<p>loading &hellip;</p>"),
                                d.ratio && r(d.ratio);
                            try {
                                d.fullscreen || a.removeNode(O)
                            } catch (D) {
                                a.removeNode(O)
                            }
                            e.on("ready", function(e, n, i) {
                                    var l= n.video.duration;
                                    j.disable(n.disabled || !l),
                                        d.adaptiveRatio && !isNaN(i.height / i.width) && r(i.height / i.width, !0),
                                        a.html([k, y], o(l)),
                                        a.toggleClass(t, "is-long", l >= 3600),
                                        A.slide(n.volumeLevel),
                                        "flash" === n.engine.engineName ? j.disableAnimation(!0, !0) : j.disableAnimation(!1),
                                        a.find(".fp-title", v).forEach(a.removeNode),
                                        i.title && a.prepend(v, a.createElement("div", {
                                            className: "fp-title"
                                        }, i.title))
                                }).on("unload", function() {
                                    N || d.splash || a.css(w, "paddingTop", ""),
                                        j.slide(0)
                                }).on("buffer", function(xE, xA, xV) {
                                    var t= e.video,
                                        n= Math.round(xV) / Math.round(t.duration);
                                    if (typeof xV != 'undefined') {
                                        !t.seekable && p.seekable && j.max(n),
                                            1 > n ? a.css(g, "width", 100 * n + "%") : a.css(g, "width", "100%")
                                    }
                                }).on("speed", function(e, t, n) {
                                    a.text(x, n + "x"),
                                        E.add("fp-hilite"),
                                        setTimeout(function() {
                                            E.remove("fp-hilite")
                                        }, 1e3)
                                }).on("buffered", function() {
                                    a.css(g, "width", "100%"),
                                        j.max(1)
                                }).on("progress", function() {
                                    var t= e.video.time,
                                        n= e.video.duration;
                                    j.dragging || j.slide(t / n, e.seeking ? 0 : 250),
                                        a.html(h, o(t)),
                                        a.html(y, "-" + o(n - t))
                                }).on("finish resume seek", function(e) {
                                    a.toggleClass(t, "is-finished", "finish" == e.type)
                                }).on("stop", function() {
                                    a.html(h, o(0)),
                                        j.slide(0, 100)
                                }).on("finish", function() {
                                    a.html(h, o(e.video.duration)),
                                        j.slide(1, 100),
                                        m.remove("is-seeking")
                                }).on("beforeseek", function() {}).on("volume", function() {
                                    A.slide(e.volumeLevel)
                                }).on("disable", function() {
                                    var n= e.disabled;
                                    j.disable(n),
                                        A.disable(n),
                                        a.toggleClass(t, "is-disabled", e.disabled)
                                }).on("mute", function(e, n, r) {
                                    a.toggleClass(t, "is-muted", r)
                                }).on("error", function(e, n, r) {
                                    if (a.removeClass(t, "is-loading"),
                                        a.removeClass(t, "is-seeking"),
                                        a.addClass(t, "is-error"),
                                        r) {
                                        var errorMessage= d.errors[r.code];
                                        n.error= !0;
                                        var o= a.find(".fp-message", t)[0],
                                            i= r.video || n.video;
                                        r.code != 1 && (a.find("h2", o)[0].innerHTML= (n.engine && n.engine.engineName || "html5") + ": " + errorMessage,
                                                a.find("p", o)[0].innerHTML= r.url || i.url || i.src || d.errorUrls[r.code]),
                                            n.off("mouseenter click"),
                                            m.remove("is-mouseover")
                                    }
                                }),
                                s.on(t, "mouseenter mouseleave", function(n) {
                                    if (!_) {
                                        var r, o= "mouseover" == n.type;
                                        if (c(o),
                                            o) {
                                            var i= function() {
                                                c(!0),
                                                    r= new Date
                                            };
                                            e.on("pause.x volume.x", i),
                                                s.on(t, "mousemove.x", i),
                                                s.on(t, "touchmove.x", i),
                                                f= setInterval(function() {
                                                    new Date - r > d.mouseoutTimeout && (c(!1),
                                                        r= new Date)
                                                }, 100)
                                        } else
                                            s.off(t, "mousemove.x"),
                                            s.off(t, "touchmove.x"),
                                            e.off("pause.x volume.x"),
                                            clearInterval(f)
                                    }
                                }),
                                s.on(t, "mouseleave", function() {
                                    (j.dragging || A.dragging) && (m.add("is-mouseover"),
                                        m.remove("is-mouseout"))
                                }),
                                s.on(t, "click.player", function(t) {
                                    if (!e.disabled) {
                                        var n= l(t.target);
                                        return n.contains("fp-ui") || n.contains("fp-engine") || t.flash ? (t.preventDefault && t.preventDefault(),
                                            e.toggle()) : void 0
                                    }
                                }),
                                s.on(t, "mousemove touchmove touchstart", ".fp-timeline", function(ev) {
                                    var xX= ev.pageX || ev.clientX || (ev.changedTouches ? ev.changedTouches[0].clientX : 0),
                                        r= xX - a.offset(C).left,
                                        i= r / a.width(C),
                                        l= i * e.video.duration;
                                    0 > i || i > 1 || (a.html(S, '<span class="fp-timeline-time">' + o(l) + '</span>'),
                                        a.css(S, "left", Math.max(2, Math.min(a.width(n('player')) - a.width(S) - 2, xX - a.offset(T).left - a.width(S) / 2)) + "px"))
                                }),
                                s.on(t, "contextmenu", function(e) {
                                    var n= a.offset(a.find(".fp-player", t)[0]),
                                        r= window,
                                        o= e.clientX - (n.left + r.scrollX),
                                        i= e.clientY - (n.top + r.scrollY);
                                    if (!m.contains("is-flash-disabled")) {
                                        var l= a.find(".fp-context-menu", t)[0];
                                        l && (e.preventDefault(),
                                            a.css(l, {
                                                left: o + "px",
                                                top: i + "px",
                                                display: "block"
                                            }),
                                            s.on(t, "click", ".fp-context-menu", function(e) {
                                                e.stopPropagation()
                                            }),
                                            s.on(document, "click.outsidemenu", function(e) {
                                                a.css(l, "display", "none"),
                                                    s.off(document, "click.outsidemenu")
                                            }))
                                    }
                                }),
                                e.on("flashdisabled", function() {
                                    m.add("is-flash-disabled"),
                                        e.one("ready progress", function() {
                                            m.remove("is-flash-disabled"),
                                                a.find(".fp-flash-disabled", t).forEach(a.removeNode)
                                        }),
                                        t.appendChild(a.createElement("div", {
                                            className: "fp-flash-disabled"
                                        }, "Adobe Flash is disabled for this page, click player area to enable"))
                                }),
                                d.poster && a.css(t, "background-image", "url(" + d.poster + ")");
                            var M= a.css(t, "background-color"),
                                L= "none" != a.css(t, "background-image") || M && "rgba(0, 0, 0, 0)" != M && "transparent" != M;
                            !d.splash && (d.poster || (d.poster= !0),
                                    e.on("ready stop", function() {
                                        m.add("is-poster"),
                                            e.poster= !0,
                                            e.one("progress", function() {
                                                m.remove("is-poster"),
                                                    e.poster= !1
                                            })
                                    })),
                                "string" == typeof d.splash && a.css(t, "background-image", "url('" + d.splash + "')"), !L && e.forcedSplash && a.css(t, "background-color", "#555"),
                                s.on(t, "click", ".fp-toggle, .fp-play", function() {
                                    e.disabled || e.toggle()
                                }),
                                s.on(t, "click", ".fp-mute", function() {
                                    e.mute()
                                }),
                                s.on(t, "click", ".fp-fullscreen", function() {
                                    e.fullscreen()
                                }),
                                s.on(t, "click", ".fp-unload", function() {
                                    e.unload()
                                }),
                                s.on(C, "slide", function(t) {
                                    e.seeking= !0,
                                        e.seek(t * e.video.duration)
                                }),
                                s.on(P, "slide", function(t) {
                                    e.volume(t)
                                });
                            var I= n("time");
                            s.on(t, "click", ".fp-time", function() {
                                    l(I).toggle("is-inverted")
                                }),
                                c(true),
                                e.on("shutdown", function() {
                                    s.off(C),
                                        s.off(P)
                                })
                        }),
                        t.exports.format= o
                }, {
                    "../common": 1,
                    "../flowplayer": 18,
                    "./slider": 14,
                    bean: 20,
                    "class-list": 21
                }
            ],
            18: [
                function(e, t, n) {
                    "use strict";

                    function r(e, t, n) {
                        t && t.embed && (t.embed= o({}, y.defaults.embed, t.embed));
                        var r, d, m= e,
                            v= a(m),
                            g= o({}, y.defaults, y.conf, t),
                            h= {},
                            x= new w;
                        v.add("is-loading");
                        try {
                            h= p ? window.localStorage : h
                        } catch (E) {}
                        var k= m.currentStyle && "rtl" === m.currentStyle.direction || window.getComputedStyle && null !== window.getComputedStyle(m, null) && "rtl" === window.getComputedStyle(m, null).getPropertyValue("direction");
                        k && v.add("is-rtl");
                        var T= {
                            conf: g,
                            currentSpeed: 1,
                            volumeLevel: g.muted ? 0 : "undefined" == typeof g.volume ? 1 * h.volume : g.volume,
                            video: {},
                            disabled: !1,
                            finished: !1,
                            loading: !1,
                            muted: "true" == h.muted || g.muted,
                            paused: !1,
                            playing: !1,
                            ready: !1,
                            splash: !1,
                            rtl: k,
                            load: function(e, t) {
                                if (!T.error && !T.loading) {
                                    T.video= {},
                                        T.finished= !1,
                                        e= e || g.clip,
                                        e= o({}, x.resolve(e, g.clip.sources)), (T.playing || T.engine) && (e.autoplay= !0);
                                    var n= S(e);
                                    if (!n)
                                        return T.trigger("error", [T, {
                                            code: y.support.flashVideo ? 5 : 10
                                        }]);
                                    if (!n.engineName)
                                        throw new Error("engineName property of factory should be exposed");
                                    if (T.engine && n.engineName === T.engine.engineName || (T.ready= !1,
                                            T.engine && (T.engine.unload(),
                                                T.conf.autoplay= !0),
                                            d= T.engine= n(T, m),
                                            T.one("ready", function() {
                                                d.volume(T.volumeLevel)
                                            })),
                                        o(e, d.pick(e.sources.filter(function(e) {
                                            return e.engine ? e.engine === d.engineName : !0
                                        }))),
                                        e.src) {
                                        var r= T.trigger("load", [T, e, d], !0);
                                        r.defaultPrevented ? T.loading= !1 : (d.load(e),
                                            i(e) && (t= e),
                                            t && T.one("ready", t))
                                    }
                                    return T
                                }
                            },
                            pause: function(e) {
                                return !T.ready || T.seeking || T.loading || (d.pause(),
                                        T.one("pause", e)),
                                    T
                            },
                            resume: function() {
                                return T.ready && T.paused && (d.resume(),
                                        T.finished && (T.trigger("resume", [T]),
                                            T.finished= !1)),
                                    T
                            },
                            toggle: function() {
                                return T.ready ? T.paused ? T.resume() : T.pause() : T.load()
                            },
                            seek: function(e, t) {
                                if (T.ready && !T.live) {
                                    if ("boolean" == typeof e) {
                                        var n= .1 * T.video.duration;
                                        e= T.video.time + (e ? n : -n)
                                    }
                                    e= r= Math.min(Math.max(e, 0), T.video.duration - .1).toFixed(1);
                                    var o= T.trigger("beforeseek", [T, e], !0);
                                    o.defaultPrevented ? (T.seeking= !1,
                                        s.toggleClass(m, "is-seeking", T.seeking)) : (d.seek(e),
                                        i(t) && T.one("seek", t))
                                }
                                return T
                            },
                            seekTo: function(e, t) {
                                var n= void 0 === e ? r : .1 * T.video.duration * e;
                                return T.seek(n, t)
                            },
                            mute: function(e, t) {
                                return void 0 === e && (e= !T.muted),
                                    t || (h.muted= T.muted= e,
                                        h.volume= isNaN(h.volume) ? g.volume : h.volume),
                                    T.volume(e ? 0 : h.volume, !0),
                                    T.trigger("mute", [T, e]),
                                    T
                            },
                            volume: function(e, t) {
                                return e= Math.min(Math.max(e, 0), 1),
                                    T.volumeLevel= e,
                                    T.trigger("volume", [T, e]),
                                    t || (h.volume= e),
                                    T.ready && d.volume(e),
                                    T
                            },
                            speed: function(e, t) {
                                return T.ready && ("boolean" == typeof e && (e= g.speeds[g.speeds.indexOf(T.currentSpeed) + (e ? 1 : -1)] || T.currentSpeed),
                                        d.speed(e),
                                        t && m.one("speed", t)),
                                    T
                            },
                            stop: function() {
                                return T.ready && (T.pause(),
                                        T.seek(0, function() {
                                            T.trigger("stop", [T])
                                        })),
                                    T
                            },
                            unload: function() {
                                return v.contains("is-embedding") || (g.splash ? (T.trigger("unload", [T]),
                                        d && (d.unload(),
                                            T.engine= d= 0)) : T.stop()),
                                    T
                            },
                            shutdown: function() {
                                T.unload(),
                                    T.trigger("shutdown", [T]),
                                    l.off(m),
                                    delete c[m.getAttribute("data-flowplayer-instance-id")],
                                    m.removeAttribute("data-flowplayer-instance-id")
                            },
                            disable: function(e) {
                                return void 0 === e && (e= !T.disabled),
                                    e != T.disabled && (T.disabled= e,
                                        T.trigger("disable", e)),
                                    T
                            }
                        };
                        T.conf= o(T.conf, g),
                            u(T);
                        T.time= Math.round(new Date().getTime() / 1000);
                        var S= function(e) {
                            var t, n= y.engines;
                            if (g.engine) {
                                var r= n.filter(function(e) {
                                    return e.engineName === g.engine
                                })[0];
                                if (r && e.sources.some(function(e) {
                                    return e.engine && e.engine !== r.engineName ? !1 : r.canPlay(e.type, T.conf)
                                }))
                                    return r
                            }
                            return g.enginePreference && (n= y.engines.filter(function(e) {
                                    return g.enginePreference.indexOf(e.engineName) > -1
                                }).sort(function(e, t) {
                                    return g.enginePreference.indexOf(e.engineName) - g.enginePreference.indexOf(t.engineName)
                                })),
                                e.sources.some(function(e) {
                                    var r= n.filter(function(t) {
                                        return e.engine && e.engine !== t.engineName ? !1 : t.canPlay(e.type, T.conf)
                                    }).shift();
                                    return r && (t= r), !!r
                                }),
                                t
                        };
                        return m.getAttribute("data-flowplayer-instance-id") || (m.setAttribute("data-flowplayer-instance-id", b++),
                                T.on("boot", function() {
                                    (g.splash || v.contains("is-splash")) && (T.forcedSplash= !g.splash && !v.contains("is-splash"),
                                        T.splash= g.autoplay= !0,
                                        g.splash || (g.splash= !0),
                                        v.add("is-splash")),
                                    g.splash && s.find("video", m).forEach(s.removeNode), (g.live || v.contains("is-live")) && (T.live= g.live= !0,
                                            v.add("is-live")),
                                        f.forEach(function(e) {
                                            e(T, m)
                                        }),
                                        c.push(T),
                                        g.splash ? T.unload() : T.load(),
                                        g.disabled && T.disable(),
                                        T.one("ready", n)
                                }).on("load", function(e, t, n) {
                                    g.splash && s.find(".flowplayer.is-ready,.flowplayer.is-loading").forEach(function(e) {
                                            var t= e.getAttribute("data-flowplayer-instance-id");
                                            if (t !== m.getAttribute("data-flowplayer-instance-id")) {
                                                var n= c[Number(t)];
                                                n && n.conf.splash && n.unload()
                                            }
                                        }),
                                        v.add("is-loading"),
                                        t.loading= !0,
                                        "undefined" != typeof n.live && (s.toggleClass(m, "is-live", n.live),
                                            t.live= n.live)
                                }).on("ready", function(e, t, n) {
                                    n.time= 0,
                                        t.video= n,
                                        v.remove("is-loading"),
                                        t.loading= !1,
                                        t.muted ? t.mute(!0, !0) : t.volume(t.volumeLevel);
                                    var r= t.conf.hlsFix && /mpegurl/i.exec(n.type);
                                    s.toggleClass(m, "hls-fix", !!r)
                                }).on("unload", function(e) {
                                    v.remove("is-loading"),
                                        T.loading= !1
                                }).on("ready unload", function(e) {
                                    var t= "ready" == e.type;
                                    s.toggleClass(m, "is-splash", !t),
                                        s.toggleClass(m, "is-ready", t),
                                        T.ready= t,
                                        T.splash= !t
                                }).on("progress", function(e, t, n) {
                                    t.video.time= n
                                }).on("speed", function(e, t, n) {
                                    t.currentSpeed= n
                                }).on("volume", function(e, t, n) {
                                    t.volumeLevel= Math.round(100 * n) / 100,
                                        t.muted ? n && !y.support.ios && t.mute(!1) : h.volume= n
                                }).on("beforeseek seek", function(e) {
                                    T.seeking= "beforeseek" == e.type,
                                        s.toggleClass(m, "is-seeking", T.seeking)
                                }).on("ready pause resume unload finish stop", function(e, t, n) {
                                    T.paused= /pause|finish|unload|stop/.test(e.type),
                                        T.paused= T.paused || "ready" === e.type && !g.autoplay && !T.playing,
                                        T.playing= !T.paused,
                                        s.toggleClass(m, "is-paused", T.paused),
                                        s.toggleClass(m, "is-playing", T.playing),
                                        T.load.ed || T.pause()
                                }).on("finish", function(e) {
                                    T.finished= !0
                                }).on("error", function() {})),
                            T.trigger("boot", [T, m]),
                            T
                    }
                    var o= e("extend-object"),
                        i= e("is-function"),
                        a= e("class-list"),
                        l= e("bean"),
                        s= e("./common"),
                        u= e("./ext/events"),
                        c= [],
                        f= [],
                        d= (window.navigator.userAgent,
                            window.onbeforeunload);
                    window.onbeforeunload= function(e) {
                        return c.forEach(function(e) {
                                e.conf.splash ? e.unload() : e.bind("error", function() {
                                    s.find(".flowplayer.is-error .fp-message").forEach(s.removeNode)
                                })
                            }),
                            d ? d(e) : void 0
                    };
                    var p= !1;
                    try {
                        "object" == typeof window.localStorage && (window.localStorage.flowplayerTestStorage= "test",
                            p= !0)
                    } catch (m) {}
                    var v= /Safari/.exec(navigator.userAgent) && !/Chrome/.exec(navigator.userAgent),
                        g= /(\d+\.\d+) Safari/.exec(navigator.userAgent),
                        h= g ? Number(g[1]) : 100,
                        y= t.exports= function(e, t, n) {
                            if (i(e))
                                return f.push(e);
                            if ("number" == typeof e || "undefined" == typeof e)
                                return c[e || 0];
                            if (e.nodeType) {
                                if (null !== e.getAttribute("data-flowplayer-instance-id"))
                                    return c[e.getAttribute("data-flowplayer-instance-id")];
                                if (!t)
                                    return;
                                return r(e, t, n)
                            }
                            if (e.jquery)
                                return y(e[0], t, n);
                            if ("string" == typeof e) {
                                var o= s.find(e)[0];
                                return o && y(o, t, n)
                            }
                        };
                    o(y, {
                        version: "6.0.5",
                        engines: [],
                        conf: {},
                        set: function(e, t) {
                            "string" == typeof e ? y.conf[e]= t : o(y.conf, e)
                        },
                        support: {},
                        defaults: {
                            debug: p ? !!localStorage.flowplayerDebug : !1,
                            disabled: !1,
                            fullscreen: window == window.top,
                            keyboard: !0,
                            ratio: 9 / 16,
                            adaptiveRatio: !1,
                            rtmp: 0,
                            proxy: "best",
                            splash: !1,
                            live: !1,
                            swf: "//releases.flowplayer.org/6.0.5/commercial/flowplayer.swf",
                            swfHls: "//releases.flowplayer.org/6.0.5/commercial/flowplayerhls.swf",
                            speeds: [.25, .5, 1, 1.5, 2],
                            tooltip: !0,
                            mouseoutTimeout: 5e3,
                            volume: p ? "true" == localStorage.muted ? 0 : isNaN(localStorage.volume) ? 1 : localStorage.volume || 1 : 1,
                            errors: ["", "Video loading aborted", "Network error", "Video not properly encoded", "Video file not found", "Unsupported video", "Skin not found", "SWF file not found", "Subtitles not found", "Invalid RTMP URL", "Unsupported video format. Try installing Adobe Flash."],
                            errorUrls: ["", "", "", "", "", "", "", "", "", "", "http://get.adobe.com/flashplayer/"],
                            playlist: [],
                            hlsFix: v && 8 > h
                        },
                        bean: l,
                        common: s,
                        extend: o
                    });
                    var b= 0,
                        w= e("./ext/resolve");
                    if ("undefined" != typeof window.jQuery) {
                        var x= window.jQuery;
                        x(function() {
                            "function" == typeof x.fn.flowplayer && x('.flowplayer:has(video,script[type="application/json"])').flowplayer()
                        });
                        var E= function(e) {
                            if (!e.length)
                                return {};
                            var t= e.data() || {},
                                n= {};
                            return x.each(["autoplay", "loop", "preload", "poster"], function(r, o) {
                                    var i= e.attr(o);
                                    void 0 !== i && -1 !== ["autoplay", "poster"].indexOf(o) ? n[o]= i ? i : !0 : void 0 !== i && (t[o]= i ? i : !0)
                                }),
                                t.subtitles= e.find("track").map(function() {
                                    var e= x(this);
                                    return {
                                        src: e.attr("src"),
                                        kind: e.attr("kind"),
                                        label: e.attr("label"),
                                        srclang: e.attr("srclang"),
                                        "default": e.prop("default")
                                    }
                                }).get(),
                                t.sources= (new w).sourcesFromVideoTag(e, x),
                                o(n, {
                                    clip: t
                                })
                        };
                        x.fn.flowplayer= function(e, t) {
                            return this.each(function() {
                                "string" == typeof e && (e= {
                                        swf: e
                                    }),
                                    i(e) && (t= e,
                                        e= {});
                                var n= x(this),
                                    o= n.find('script[type="application/json"]'),
                                    a= o.length ? JSON.parse(o.text()) : E(n.find("video")),
                                    l= x.extend({}, e || {}, a, n.data()),
                                    s= r(this, l, t);
                                u.EVENTS.forEach(function(e) {
                                        s.on(e + ".jquery", function(e) {
                                            n.trigger.call(n, e.type, e.detail && e.detail.args)
                                        })
                                    }),
                                    n.data("flowplayer", s)
                            })
                        }
                    }
                }, {
                    "./common": 1,
                    "./ext/events": 8,
                    "./ext/resolve": 13,
                    bean: 20,
                    "class-list": 21,
                    "extend-object": 25,
                    "is-function": 26
                }
            ],
            19: [
                function(e, t, n) {
                    e("es5-shim");
                    var r= t.exports= e("./flowplayer");
                    e("./ext/support"),
                        e("./engine/embed"),
                        e("./engine/html5"),
                        e("./engine/flash"),
                        e("./ext/ui"),
                        e("./ext/keyboard"),
                        e("./ext/playlist"),
                        e("./ext/cuepoint"),
                        e("./ext/subtitle"),
                        e("./ext/analytics"),
                        e("./ext/embed"),
                        e("./ext/fullscreen"),
                        e("./ext/mobile"),
                        r(function(e, t) {
                            function n(e) {
                                var t= document.createElement("a");
                                return t.href= e,
                                    u.hostname(t.hostname)
                            }

                            function o(e) {
                                var t= "ab.ca,ac.ac,ac.at,ac.be,ac.cn,ac.il,ac.in,ac.jp,ac.kr,ac.sg,ac.th,ac.uk,ad.jp,adm.br,adv.br,ah.cn,am.br,arq.br,art.br,arts.ro,asn.au,asso.fr,asso.mc,bc.ca,bio.br,biz.pl,biz.tr,bj.cn,br.com,cn.com,cng.br,cnt.br,co.ac,co.at,co.de,co.gl,co.hk,co.id,co.il,co.in,co.jp,co.kr,co.mg,co.ms,co.nz,co.th,co.uk,co.ve,co.vi,co.za,com.ag,com.ai,com.ar,com.au,com.br,com.cn,com.co,com.cy,com.de,com.do,com.ec,com.es,com.fj,com.fr,com.gl,com.gt,com.hk,com.hr,com.hu,com.kg,com.ki,com.lc,com.mg,com.mm,com.ms,com.mt,com.mu,com.mx,com.my,com.na,com.nf,com.ng,com.ni,com.pa,com.ph,com.pl,com.pt,com.qa,com.ro,com.ru,com.sb,com.sc,com.sg,com.sv,com.tr,com.tw,com.ua,com.uy,com.ve,com.vn,cp.tz,cq.cn,de.com,de.org,ecn.br,ed.jp,edu.au,edu.cn,edu.hk,edu.mm,edu.my,edu.pl,edu.pt,edu.qa,edu.sg,edu.tr,edu.tw,eng.br,ernet.in,esp.br,etc.br,eti.br,eu.com,eu.int,eu.lv,firm.in,firm.ro,fm.br,fot.br,fst.br,g12.br,gb.com,gb.net,gd.cn,gen.in,go.jp,go.kr,go.th,gov.au,gov.az,gov.br,gov.cn,gov.il,gov.in,gov.mm,gov.my,gov.qa,gov.sg,gov.tr,gov.tw,gov.uk,gr.jp,gs.cn,gv.ac,gv.at,gx.cn,gz.cn,he.cn,hi.cn,hk.cn,hl.cn,hu.com,id.au,idv.tw,in.ua,ind.br,ind.in,inf.br,info.pl,info.ro,info.tr,info.ve,iwi.nz,jl.cn,jor.br,js.cn,jus.br,k12.il,k12.tr,kr.com,lel.br,lg.jp,ln.cn,ltd.uk,maori.nz,mb.ca,me.uk,med.br,mi.th,mil.br,mil.uk,mo.cn,mod.uk,muni.il,nb.ca,ne.jp,ne.kr,net.ag,net.ai,net.au,net.br,net.cn,net.do,net.gl,net.hk,net.il,net.in,net.kg,net.ki,net.lc,net.mg,net.mm,net.mu,net.ni,net.nz,net.pl,net.ru,net.sb,net.sc,net.sg,net.th,net.tr,net.tw,net.uk,net.ve,nf.ca,nhs.uk,nm.cn,nm.kr,no.com,nom.br,nom.ni,nom.ro,ns.ca,nt.ca,nt.ro,ntr.br,nx.cn,odo.br,off.ai,on.ca,or.ac,or.at,or.jp,or.kr,or.th,org.ag,org.ai,org.au,org.br,org.cn,org.do,org.es,org.gl,org.hk,org.in,org.kg,org.ki,org.lc,org.mg,org.mm,org.ms,org.nf,org.ni,org.nz,org.pl,org.ro,org.ru,org.sb,org.sc,org.sg,org.tr,org.tw,org.uk,org.ve,pe.ca,plc.uk,police.uk,ppg.br,presse.fr,pro.br,psc.br,psi.br,qc.ca,qc.com,qh.cn,rec.br,rec.ro,res.in,sa.com,sc.cn,sch.uk,se.com,se.net,sh.cn,sk.ca,slg.br,sn.cn,store.ro,tj.cn,tm.fr,tm.mc,tm.ro,tmp.br,tur.br,tv.br,tv.tr,tw.cn,uk.com,uk.net,us.com,uy.com,vet.br,waw.pl,web.ve,www.ro,xj.cn,xz.cn,yk.ca,yn.cn,zj.cn,zlg.br".split(",");
                                e= e.toLowerCase();
                                var n= e.split("."),
                                    r= n.length;
                                if (2 > r || /^\d+$/.test(n[r - 1]))
                                    return e;
                                var o= n.slice(-2).join(".");
                                return r >= 3 && t.indexOf(o) >= 0 ? n.slice(-3).join(".") : o
                            }

                            function i(e, t) {
                                t= o(t);
                                for (var n= 0, r= t.length - 1; r >= 0; r--)
                                    n += 42403449800 * t.charCodeAt(r);
                                for (n= ("" + n).substring(0, 7),
                                    r= 0; r < e.length; r++)
                                    if (n === e[r].substring(1, 8))
                                        return 1
                            }
                            var a= function(e, t) {
                                    var n= e.className.split(" "); - 1 === n.indexOf(t) && (e.className += " " + t)
                                },
                                l= function(e) {
                                    return "none" !== window.getComputedStyle(e).display
                                },
                                s= e.conf,
                                u= r.common,
                                c= u.createElement,
                                f= s.swf.indexOf("flowplayer.org") && s.e && t.getAttribute("data-origin"),
                                d= f ? n(f) : u.hostname(),
                                p= (document,
                                    s.key);
                            "file:" == location.protocol && (d= "localhost"),
                                e.load.ed= 1,
                                s.hostname= d,
                                s.origin= f || location.href,
                                f && a(t, "is-embedded"),
                                "string" == typeof p && (p= p.split(/,\s*/));
                            var m= function(e, n) {
                                var r= c("a", {
                                    href: n,
                                    className: "fp-brand"
                                });
                                r.innerHTML= e,
                                    u.find(".fp-controls", t)[0].appendChild(r)
                            };
                            if (p && "function" == typeof i && i(p, d)) {
                                if (s.logo) {
                                    var v= u.find(".fp-player", t)[0],
                                        g= c("a", {
                                            className: "fp-logo"
                                        });
                                    f && (g.href= f),
                                        s.embed && s.embed.popup && (g.target= "_blank");
                                    var h= c("img", {
                                        src: s.logo
                                    });
                                    g.appendChild(h), (v || t).appendChild(g)
                                }
                                s.brand && f || s.brand && s.brand.showOnOrigin ? m(s.brand.text || s.brand, f || location.href) : u.addClass(t, "no-brand")
                            } else {
                                m("flowplayer", "http://flowplayer.org");
                                var g= c("a", {
                                    href: "http://flowplayer.org"
                                });
                                t.appendChild(g);
                                var y= c("div", {
                                        className: "fp-context-menu"
                                    }, '<ul><li class="copyright">&copy; 2015</li><li><a href="http://flowplayer.org">About Flowplayer</a></li><li><a href="http://flowplayer.org/license">GPL based license</a></li></ul>'),
                                    b= window.location.href.indexOf("localhost"),
                                    v= u.find(".fp-player", t)[0];
                                7 !== b && (v || t).appendChild(y),
                                    e.on("pause resume finish unload ready", function(e, n) {
                                        u.removeClass(t, "no-brand");
                                        var r= -1;
                                        if (n.video.src)
                                            for (var o= [
                                                ["org", "flowplayer", "drive"],
                                                ["org", "flowplayer", "my"],
                                                ["org", "flowplayer", "cdn"]
                                            ], i= 0; i < o.length && (r= n.video.src.indexOf("://" + o[i].reverse().join(".")), -1 === r); i++)
                                        ;
                                        if ((4 === r || 5 === r) && u.addClass(t, "no-brand"),
                                            /pause|resume/.test(e.type) && "flash" != n.engine.engineName && 4 != r && 5 != r) {
                                            var a= {
                                                display: "block",
                                                position: "absolute",
                                                left: "16px",
                                                bottom: "46px",
                                                zIndex: 99999,
                                                width: "100px",
                                                height: "20px",
                                                backgroundImage: "url(" + [".png", "logo", "/", ".net", ".cloudfront", "d32wqyuo10o653", "//"].reverse().join("") + ")"
                                            };
                                            for (var s in a)
                                                a.hasOwnProperty(s) && (g.style[s]= a[s]);
                                            n.load.ed= l(g) && (7 === b || y.parentNode == t || y.parentNode == v) && !u.hasClass(t, "no-brand"),
                                                n.load.ed || n.pause()
                                        } else
                                            g.style.display= "none"
                                    })
                            }
                        })
                }, {
                    "./engine/embed": 2,
                    "./engine/flash": 3,
                    "./engine/html5": 4,
                    "./ext/analytics": 5,
                    "./ext/cuepoint": 6,
                    "./ext/embed": 7,
                    "./ext/fullscreen": 9,
                    "./ext/keyboard": 10,
                    "./ext/mobile": 11,
                    "./ext/playlist": 12,
                    "./ext/subtitle": 15,
                    "./ext/support": 16,
                    "./ext/ui": 17,
                    "./flowplayer": 18,
                    "es5-shim": 24
                }
            ],
            20: [
                function(t, n, r) {
                    ! function(t, r, o) {
                        "undefined" != typeof n && n.exports ? n.exports= o() : "function" == typeof e && e.amd ? e(o) : r[t]= o()
                    }("bean", this, function(e, t) {
                        e= e || "bean",
                            t= t || this;
                        var n, r= window,
                            o= t[e],
                            i= /[^\.]*(?=\..*)\.|.*/,
                            a= /\..*/,
                            l= "addEventListener",
                            s= "removeEventListener",
                            u= document || {},
                            c= u.documentElement || {},
                            f= c[l],
                            d= f ? l : "attachEvent",
                            p= {},
                            m= Array.prototype.slice,
                            v= function(e, t) {
                                return e.split(t || " ")
                            },
                            g= function(e) {
                                return "string" == typeof e
                            },
                            h= function(e) {
                                return "function" == typeof e
                            },
                            y= "click dblclick mouseup mousedown contextmenu mousewheel mousemultiwheel DOMMouseScroll mouseover mouseout mousemove selectstart selectend keydown keypress keyup orientationchange focus blur change reset select submit load unload beforeunload resize move DOMContentLoaded readystatechange message error abort scroll ",
                            b= "show input invalid touchstart touchmove touchend touchcancel gesturestart gesturechange gestureend textinput readystatechange pageshow pagehide popstate hashchange offline online afterprint beforeprint dragstart dragenter dragover dragleave drag drop dragend loadstart progress suspend emptied stalled loadmetadata loadeddata canplay canplaythrough playing waiting seeking seeked ended durationchange timeupdate play pause ratechange volumechange cuechange checking noupdate downloading cached updateready obsolete ",
                            w= function(e, t, n) {
                                for (n= 0; n < t.length; n++)
                                    t[n] && (e[t[n]]= 1);
                                return e
                            }({}, v(y + (f ? b : ""))),
                            x= function() {
                                var e= "compareDocumentPosition" in c ? function(e, t) {
                                        return t.compareDocumentPosition && 16 === (16 & t.compareDocumentPosition(e))
                                    } : "contains" in c ? function(e, t) {
                                        return t= 9 === t.nodeType || t === window ? c : t,
                                            t !== e && t.contains(e)
                                    } : function(e, t) {
                                        for (; e= e.parentNode;)
                                            if (e === t)
                                                return 1;
                                        return 0
                                    },
                                    t= function(t) {
                                        var n= t.relatedTarget;
                                        return n ? n !== this && "xul" !== n.prefix && !/document/.test(this.toString()) && !e(n, this) : null == n
                                    };
                                return {
                                    mouseenter: {
                                        base: "mouseover",
                                        condition: t
                                    },
                                    mouseleave: {
                                        base: "mouseout",
                                        condition: t
                                    },
                                    mousewheel: {
                                        base: /Firefox/.test(navigator.userAgent) ? "DOMMouseScroll" : "mousewheel"
                                    }
                                }
                            }(),
                            E= function() {
                                var e= v("altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which propertyName"),
                                    t= e.concat(v("button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement")),
                                    n= t.concat(v("wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis")),
                                    o= e.concat(v("char charCode key keyCode keyIdentifier keyLocation location")),
                                    i= e.concat(v("data")),
                                    a= e.concat(v("touches targetTouches changedTouches scale rotation")),
                                    l= e.concat(v("data origin source")),
                                    s= e.concat(v("state")),
                                    f= /over|out/,
                                    d= [{
                                        reg: /key/i,
                                        fix: function(e, t) {
                                            return t.keyCode= e.keyCode || e.which,
                                                o
                                        }
                                    }, {
                                        reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i,
                                        fix: function(e, n, r) {
                                            return n.rightClick= 3 === e.which || 2 === e.button,
                                                n.pos= {
                                                    x: 0,
                                                    y: 0
                                                },
                                                e.pageX || e.pageY ? (n.clientX= e.pageX,
                                                    n.clientY= e.pageY) : (e.clientX || e.clientY) && (n.clientX= e.clientX + u.body.scrollLeft + c.scrollLeft,
                                                    n.clientY= e.clientY + u.body.scrollTop + c.scrollTop),
                                                f.test(r) && (n.relatedTarget= e.relatedTarget || e[("mouseover" == r ? "from" : "to") + "Element"]),
                                                t
                                        }
                                    }, {
                                        reg: /mouse.*(wheel|scroll)/i,
                                        fix: function() {
                                            return n
                                        }
                                    }, {
                                        reg: /^text/i,
                                        fix: function() {
                                            return i
                                        }
                                    }, {
                                        reg: /^touch|^gesture/i,
                                        fix: function() {
                                            return a
                                        }
                                    }, {
                                        reg: /^message$/i,
                                        fix: function() {
                                            return l
                                        }
                                    }, {
                                        reg: /^popstate$/i,
                                        fix: function() {
                                            return s
                                        }
                                    }, {
                                        reg: /.*/,
                                        fix: function() {
                                            return e
                                        }
                                    }],
                                    p= {},
                                    m= function(e, t, n) {
                                        if (arguments.length && (e= e || ((t.ownerDocument || t.document || t).parentWindow || r).event,
                                            this.originalEvent= e,
                                            this.isNative= n,
                                            this.isBean= !0,
                                            e)) {
                                            var o, i, a, l, s, u= e.type,
                                                c= e.target || e.srcElement;
                                            if (this.target= c && 3 === c.nodeType ? c.parentNode : c,
                                                n) {
                                                if (s= p[u], !s)
                                                    for (o= 0,
                                                        i= d.length; i > o; o++)
                                                        if (d[o].reg.test(u)) {
                                                            p[u]= s= d[o].fix;
                                                            break
                                                        }
                                                for (l= s(e, this, u),
                                                    o= l.length; o--;)
                                                    !((a= l[o]) in this) && a in e && (this[a]= e[a])
                                            }
                                        }
                                    };
                                return m.prototype.preventDefault= function() {
                                        this.originalEvent.preventDefault ? this.originalEvent.preventDefault() : this.originalEvent.returnValue= !1
                                    },
                                    m.prototype.stopPropagation= function() {
                                        this.originalEvent.stopPropagation ? this.originalEvent.stopPropagation() : this.originalEvent.cancelBubble= !0
                                    },
                                    m.prototype.stop= function() {
                                        this.preventDefault(),
                                            this.stopPropagation(),
                                            this.stopped= !0
                                    },
                                    m.prototype.stopImmediatePropagation= function() {
                                        this.originalEvent.stopImmediatePropagation && this.originalEvent.stopImmediatePropagation(),
                                            this.isImmediatePropagationStopped= function() {
                                                return !0
                                            }
                                    },
                                    m.prototype.isImmediatePropagationStopped= function() {
                                        return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
                                    },
                                    m.prototype.clone= function(e) {
                                        var t= new m(this, this.element, this.isNative);
                                        return t.currentTarget= e,
                                            t
                                    },
                                    m
                            }(),
                            k= function(e, t) {
                                return f || t || e !== u && e !== r ? e : c
                            },
                            T= function() {
                                var e= function(e, t, n, r) {
                                        var o= function(n, o) {
                                                return t.apply(e, r ? m.call(o, n ? 0 : 1).concat(r) : o)
                                            },
                                            i= function(n, r) {
                                                return t.__beanDel ? t.__beanDel.ft(n.target, e) : r
                                            },
                                            a= n ? function(e) {
                                                var t= i(e, this);
                                                return n.apply(t, arguments) ? (e && (e.currentTarget= t),
                                                    o(e, arguments)) : void 0
                                            } : function(e) {
                                                return t.__beanDel && (e= e.clone(i(e))),
                                                    o(e, arguments)
                                            };
                                        return a.__beanDel= t.__beanDel,
                                            a
                                    },
                                    t= function(t, n, r, o, i, a, l) {
                                        var s, u= x[n];
                                        "unload" == n && (r= O(P, t, n, r, o)),
                                            u && (u.condition && (r= e(t, r, u.condition, a)),
                                                n= u.base || n),
                                            this.isNative= s= w[n] && !!t[d],
                                            this.customType= !f && !s && n,
                                            this.element= t,
                                            this.type= n,
                                            this.original= o,
                                            this.namespaces= i,
                                            this.eventType= f || s ? n : "propertychange",
                                            this.target= k(t, s),
                                            this[d]= !!this.target[d],
                                            this.root= l,
                                            this.handler= e(t, r, null, a)
                                    };
                                return t.prototype.inNamespaces= function(e) {
                                        var t, n, r= 0;
                                        if (!e)
                                            return !0;
                                        if (!this.namespaces)
                                            return !1;
                                        for (t= e.length; t--;)
                                            for (n= this.namespaces.length; n--;)
                                                e[t] == this.namespaces[n] && r++;
                                        return e.length === r
                                    },
                                    t.prototype.matches= function(e, t, n) {
                                        return !(this.element !== e || t && this.original !== t || n && this.handler !== n)
                                    },
                                    t
                            }(),
                            S= function() {
                                var e= {},
                                    t= function(n, r, o, i, a, l) {
                                        var s= a ? "r" : "$";
                                        if (r && "*" != r) {
                                            var u, c= 0,
                                                f= e[s + r],
                                                d= "*" == n;
                                            if (!f)
                                                return;
                                            for (u= f.length; u > c; c++)
                                                if ((d || f[c].matches(n, o, i)) && !l(f[c], f, c, r))
                                                    return
                                        } else
                                            for (var p in e)
                                                p.charAt(0) == s && t(n, p.substr(1), o, i, a, l)
                                    },
                                    n= function(t, n, r, o) {
                                        var i, a= e[(o ? "r" : "$") + n];
                                        if (a)
                                            for (i= a.length; i--;)
                                                if (!a[i].root && a[i].matches(t, r, null))
                                                    return !0;
                                        return !1
                                    },
                                    r= function(e, n, r, o) {
                                        var i= [];
                                        return t(e, n, r, null, o, function(e) {
                                                return i.push(e)
                                            }),
                                            i
                                    },
                                    o= function(t) {
                                        var n= !t.root && !this.has(t.element, t.type, null, !1),
                                            r= (t.root ? "r" : "$") + t.type;
                                        return (e[r] || (e[r]= [])).push(t),
                                            n
                                    },
                                    i= function(n) {
                                        t(n.element, n.type, null, n.handler, n.root, function(t, n, r) {
                                            return n.splice(r, 1),
                                                t.removed= !0,
                                                0 === n.length && delete e[(t.root ? "r" : "$") + t.type], !1
                                        })
                                    },
                                    a= function() {
                                        var t, n= [];
                                        for (t in e)
                                            "$" == t.charAt(0) && (n= n.concat(e[t]));
                                        return n
                                    };
                                return {
                                    has: n,
                                    get: r,
                                    put: o,
                                    del: i,
                                    entries: a
                                }
                            }(),
                            N= function(e) {
                                n= arguments.length ? e : u.querySelectorAll ? function(e, t) {
                                    return t.querySelectorAll(e)
                                } : function() {
                                    throw new Error("Bean: No selector engine installed")
                                }
                            },
                            C= function(e, t) {
                                if (f || !t || !e || e.propertyName == "_on" + t) {
                                    var n= S.get(this, t || e.type, null, !1),
                                        r= n.length,
                                        o= 0;
                                    for (e= new E(e, this, !0),
                                        t && (e.type= t); r > o && !e.isImmediatePropagationStopped(); o++)
                                        n[o].removed || n[o].handler.call(this, e)
                                }
                            },
                            j= f ? function(e, t, n) {
                                e[n ? l : s](t, C, !1)
                            } : function(e, t, n, r) {
                                var o;
                                n ? (S.put(o= new T(e, r || t, function(t) {
                                        C.call(e, t, r)
                                    }, C, null, null, !0)),
                                    r && null == e["_on" + r] && (e["_on" + r]= 0),
                                    o.target.attachEvent("on" + o.eventType, o.handler)) : (o= S.get(e, r || t, C, !0)[0],
                                    o && (o.target.detachEvent("on" + o.eventType, o.handler),
                                        S.del(o)))
                            },
                            O= function(e, t, n, r, o) {
                                return function() {
                                    r.apply(this, arguments),
                                        e(t, n, o)
                                }
                            },
                            P= function(e, t, n, r) {
                                var o, i, l= t && t.replace(a, ""),
                                    s= S.get(e, l, null, !1),
                                    u= {};
                                for (o= 0,
                                    i= s.length; i > o; o++)
                                    n && s[o].original !== n || !s[o].inNamespaces(r) || (S.del(s[o]), !u[s[o].eventType] && s[o][d] && (u[s[o].eventType]= {
                                        t: s[o].eventType,
                                        c: s[o].type
                                    }));
                                for (o in u)
                                    S.has(e, u[o].t, null, !1) || j(e, u[o].t, !1, u[o].c)
                            },
                            A= function(e, t) {
                                var r= function(t, r) {
                                        for (var o, i= g(e) ? n(e, r) : e; t && t !== r; t= t.parentNode)
                                            for (o= i.length; o--;)
                                                if (i[o] === t)
                                                    return t
                                    },
                                    o= function(e) {
                                        var n= r(e.target, this);
                                        n && t.apply(n, arguments)
                                    };
                                return o.__beanDel= {
                                        ft: r,
                                        selector: e
                                    },
                                    o
                            },
                            _= f ? function(e, t, n) {
                                var o= u.createEvent(e ? "HTMLEvents" : "UIEvents");
                                o[e ? "initEvent" : "initUIEvent"](t, !0, !0, r, 1),
                                    n.dispatchEvent(o)
                            } : function(e, t, n) {
                                n= k(n, e),
                                    e ? n.fireEvent("on" + t, u.createEventObject()) : n["_on" + t]++
                            },
                            D= function(e, t, n) {
                                var r, o, l, s, u= g(t);
                                if (u && t.indexOf(" ") > 0) {
                                    for (t= v(t),
                                        s= t.length; s--;)
                                        D(e, t[s], n);
                                    return e
                                }
                                if (o= u && t.replace(a, ""),
                                    o && x[o] && (o= x[o].base), !t || u)
                                    (l= u && t.replace(i, "")) && (l= v(l, ".")),
                                    P(e, o, n, l);
                                else if (h(t))
                                    P(e, null, t);
                                else
                                    for (r in t)
                                        t.hasOwnProperty(r) && D(e, r, t[r]);
                                return e
                            },
                            M= function(e, t, r, o) {
                                var l, s, u, c, f, g, y; {
                                    if (void 0 !== r || "object" != typeof t) {
                                        for (h(r) ? (f= m.call(arguments, 3),
                                                o= l= r) : (l= o,
                                                f= m.call(arguments, 4),
                                                o= A(r, l, n)),
                                            u= v(t),
                                            this === p && (o= O(D, e, t, o, l)),
                                            c= u.length; c--;)
                                            y= S.put(g= new T(e, u[c].replace(a, ""), o, l, v(u[c].replace(i, ""), "."), f, !1)),
                                            g[d] && y && j(e, g.eventType, !0, g.customType);
                                        return e
                                    }
                                    for (s in t)
                                        t.hasOwnProperty(s) && M.call(this, e, s, t[s])
                                }
                            },
                            L= function(e, t, n, r) {
                                return M.apply(null, g(n) ? [e, n, t, r].concat(arguments.length > 3 ? m.call(arguments, 5) : []) : m.call(arguments))
                            },
                            I= function() {
                                return M.apply(p, arguments)
                            },
                            F= function(e, t, n) {
                                var r, o, l, s, u, c= v(t);
                                for (r= c.length; r--;)
                                    if (t= c[r].replace(a, ""), (s= c[r].replace(i, "")) && (s= v(s, ".")),
                                        s || n || !e[d])
                                        for (u= S.get(e, t, null, !1),
                                            n= [!1].concat(n),
                                            o= 0,
                                            l= u.length; l > o; o++)
                                            u[o].inNamespaces(s) && u[o].handler.apply(e, n);
                                    else
                                        _(w[t], t, e);
                                return e
                            },
                            z= function(e, t, n) {
                                for (var r, o, i= S.get(t, n, null, !1), a= i.length, l= 0; a > l; l++)
                                    i[l].original && (r= [e, i[l].type], (o= i[l].handler.__beanDel) && r.push(o.selector),
                                        r.push(i[l].original),
                                        M.apply(null, r));
                                return e
                            },
                            R= {
                                on: M,
                                add: L,
                                one: I,
                                off: D,
                                remove: D,
                                clone: z,
                                fire: F,
                                Event: E,
                                setSelectorEngine: N,
                                noConflict: function() {
                                    return t[e]= o,
                                        this
                                }
                            };
                        if (r.attachEvent) {
                            var q= function() {
                                var e, t= S.entries();
                                for (e in t)
                                    t[e].type && "unload" !== t[e].type && D(t[e].element, t[e].type);
                                r.detachEvent("onunload", q),
                                    r.CollectGarbage && r.CollectGarbage()
                            };
                            r.attachEvent("onunload", q)
                        }
                        return N(),
                            R
                    })
                }, {}
            ],
            21: [
                function(e, t, n) {
                    function r(e) {
                        function t(e) {
                            var t= c();
                            a(t, e) > -1 || (t.push(e),
                                f(t))
                        }

                        function n(e) {
                            var t= c(),
                                n= a(t, e); - 1 !== n && (t.splice(n, 1),
                                f(t))
                        }

                        function r(e) {
                            return a(c(), e) > -1
                        }

                        function l(e) {
                            return r(e) ? (n(e), !1) : (t(e), !0)
                        }

                        function s() {
                            return e.className
                        }

                        function u(e) {
                            var t= c();
                            return t[e] || null
                        }

                        function c() {
                            var t= e.className;
                            return o(t.split(" "), i)
                        }

                        function f(t) {
                            var n= t.length;
                            e.className= t.join(" "),
                                p.length= n;
                            for (var r= 0; r < t.length; r++)
                                p[r]= t[r];
                            delete t[n]
                        }
                        var d= e.classList;
                        if (d)
                            return d;
                        var p= {
                            add: t,
                            remove: n,
                            contains: r,
                            toggle: l,
                            toString: s,
                            length: 0,
                            item: u
                        };
                        return p
                    }

                    function o(e, t) {
                        for (var n= [], r= 0; r < e.length; r++)
                            t(e[r]) && n.push(e[r]);
                        return n
                    }

                    function i(e) {
                        return !!e
                    }
                    var a= e("indexof");
                    t.exports= r
                }, {
                    indexof: 22
                }
            ],
            22: [
                function(e, t, n) {
                    var r= [].indexOf;
                    t.exports= function(e, t) {
                        if (r)
                            return e.indexOf(t);
                        for (var n= 0; n < e.length; ++n)
                            if (e[n] === t)
                                return n;
                        return -1
                    }
                }, {}
            ],
            23: [
                function(e, t, n) {
                    function r(e, t, n, r) {
                        return n= window.getComputedStyle,
                            r= n ? n(e) : e.currentStyle,
                            r ? r[t.replace(/-(\w)/gi, function(e, t) {
                                return t.toUpperCase()
                            })] : void 0
                    }
                    t.exports= r
                }, {}
            ],
            24: [
                function(t, n, r) {
                    ! function(t, o) {
                        "use strict";
                        "function" == typeof e && e.amd ? e(o) : "object" == typeof r ? n.exports= o() : t.returnExports= o()
                    }(this, function() {
                        var e, t= Array.prototype,
                            n= Object.prototype,
                            r= Function.prototype,
                            o= String.prototype,
                            i= Number.prototype,
                            a= t.slice,
                            l= t.splice,
                            s= t.push,
                            u= t.unshift,
                            c= t.concat,
                            f= r.call,
                            d= n.toString,
                            p= Array.isArray || function(e) {
                                return "[object Array]" === d.call(e)
                            },
                            m= "function" == typeof Symbol && "symbol" == typeof Symbol.toStringTag,
                            v= Function.prototype.toString,
                            g= function(e) {
                                try {
                                    return v.call(e), !0
                                } catch (t) {
                                    return !1
                                }
                            },
                            h= "[object Function]",
                            y= "[object GeneratorFunction]";
                        e= function(e) {
                            if ("function" != typeof e)
                                return !1;
                            if (m)
                                return g(e);
                            var t= d.call(e);
                            return t === h || t === y
                        };
                        var b, w= RegExp.prototype.exec,
                            x= function(e) {
                                try {
                                    return w.call(e), !0
                                } catch (t) {
                                    return !1
                                }
                            },
                            E= "[object RegExp]";
                        b= function(e) {
                            return "object" != typeof e ? !1 : m ? x(e) : d.call(e) === E
                        };
                        var k, T= String.prototype.valueOf,
                            S= function(e) {
                                try {
                                    return T.call(e), !0
                                } catch (t) {
                                    return !1
                                }
                            },
                            N= "[object String]";
                        k= function(e) {
                            return "string" == typeof e ? !0 : "object" != typeof e ? !1 : m ? S(e) : d.call(e) === N
                        };
                        var C= function(t) {
                                var n= d.call(t),
                                    r= "[object Arguments]" === n;
                                return r || (r= !p(t) && null !== t && "object" == typeof t && "number" == typeof t.length && t.length >= 0 && e(t.callee)),
                                    r
                            },
                            j= function(e) {
                                var t, n= Object.defineProperty && function() {
                                    try {
                                        var e= {};
                                        Object.defineProperty(e, "x", {
                                            enumerable: !1,
                                            value: e
                                        });
                                        for (var t in e)
                                            return !1;
                                        return e.x === e
                                    } catch (n) {
                                        return !1
                                    }
                                }();
                                return t= n ? function(e, t, n, r) {
                                        !r && t in e || Object.defineProperty(e, t, {
                                            configurable: !0,
                                            enumerable: !1,
                                            writable: !0,
                                            value: n
                                        })
                                    } : function(e, t, n, r) {
                                        !r && t in e || (e[t]= n)
                                    },
                                    function(n, r, o) {
                                        for (var i in r)
                                            e.call(r, i) && t(n, i, r[i], o)
                                    }
                            }(n.hasOwnProperty),
                            O= function(e) {
                                var t= typeof e;
                                return null === e || "object" !== t && "function" !== t
                            },
                            P= {
                                ToInteger: function(e) {
                                    var t= +e;
                                    return t !== t ? t= 0 : 0 !== t && t !== 1 / 0 && t !== -(1 / 0) && (t= (t > 0 || -1) * Math.floor(Math.abs(t))),
                                        t
                                },
                                ToPrimitive: function(t) {
                                    var n, r, o;
                                    if (O(t))
                                        return t;
                                    if (r= t.valueOf,
                                        e(r) && (n= r.call(t),
                                            O(n)))
                                        return n;
                                    if (o= t.toString,
                                        e(o) && (n= o.call(t),
                                            O(n)))
                                        return n;
                                    throw new TypeError
                                },
                                ToObject: function(e) {
                                    if (null == e)
                                        throw new TypeError("can't convert " + e + " to object");
                                    return Object(e)
                                },
                                ToUint32: function(e) {
                                    return e >>> 0
                                }
                            },
                            A= function() {};
                        j(r, {
                            bind: function(t) {
                                var n= this;
                                if (!e(n))
                                    throw new TypeError("Function.prototype.bind called on incompatible " + n);
                                for (var r, o= a.call(arguments, 1), i= function() {
                                    if (this instanceof r) {
                                        var e= n.apply(this, c.call(o, a.call(arguments)));
                                        return Object(e) === e ? e : this
                                    }
                                    return n.apply(t, c.call(o, a.call(arguments)))
                                }, l= Math.max(0, n.length - o.length), s= [], u= 0; l > u; u++)
                                    s.push("$" + u);
                                return r= Function("binder", "return function (" + s.join(",") + "){ return binder.apply(this, arguments); }")(i),
                                    n.prototype && (A.prototype= n.prototype,
                                        r.prototype= new A,
                                        A.prototype= null),
                                    r
                            }
                        });
                        var _= f.bind(n.hasOwnProperty),
                            D= function() {
                                var e= [1, 2],
                                    t= e.splice();
                                return 2 === e.length && p(t) && 0 === t.length
                            }();
                        j(t, {
                            splice: function(e, t) {
                                return 0 === arguments.length ? [] : l.apply(this, arguments)
                            }
                        }, !D);
                        var M= function() {
                            var e= {};
                            return t.splice.call(e, 0, 0, 1),
                                1 === e.length
                        }();
                        j(t, {
                            splice: function(e, t) {
                                if (0 === arguments.length)
                                    return [];
                                var n= arguments;
                                return this.length= Math.max(P.ToInteger(this.length), 0),
                                    arguments.length > 0 && "number" != typeof t && (n= a.call(arguments),
                                        n.length < 2 ? n.push(this.length - e) : n[1]= P.ToInteger(t)),
                                    l.apply(this, n)
                            }
                        }, !M);
                        var L= 1 !== [].unshift(0);
                        j(t, {
                                unshift: function() {
                                    return u.apply(this, arguments),
                                        this.length
                                }
                            }, L),
                            j(Array, {
                                isArray: p
                            });
                        var I= Object("a"),
                            F= "a" !== I[0] || !(0 in I),
                            z= function(e) {
                                var t= !0,
                                    n= !0;
                                return e && (e.call("foo", function(e, n, r) {
                                        "object" != typeof r && (t= !1)
                                    }),
                                    e.call([1], function() {
                                        "use strict";
                                        n= "string" == typeof this
                                    }, "x")), !!e && t && n
                            };
                        j(t, {
                                forEach: function(t) {
                                    var n, r= P.ToObject(this),
                                        o= F && k(this) ? this.split("") : r,
                                        i= -1,
                                        a= o.length >>> 0;
                                    if (arguments.length > 1 && (n= arguments[1]), !e(t))
                                        throw new TypeError("Array.prototype.forEach callback must be a function");
                                    for (; ++i < a;)
                                        i in o && ("undefined" != typeof n ? t.call(n, o[i], i, r) : t(o[i], i, r))
                                }
                            }, !z(t.forEach)),
                            j(t, {
                                map: function(t) {
                                    var n, r= P.ToObject(this),
                                        o= F && k(this) ? this.split("") : r,
                                        i= o.length >>> 0,
                                        a= Array(i);
                                    if (arguments.length > 1 && (n= arguments[1]), !e(t))
                                        throw new TypeError("Array.prototype.map callback must be a function");
                                    for (var l= 0; i > l; l++)
                                        l in o && ("undefined" != typeof n ? a[l]= t.call(n, o[l], l, r) : a[l]= t(o[l], l, r));
                                    return a
                                }
                            }, !z(t.map)),
                            j(t, {
                                filter: function(t) {
                                    var n, r, o= P.ToObject(this),
                                        i= F && k(this) ? this.split("") : o,
                                        a= i.length >>> 0,
                                        l= [];
                                    if (arguments.length > 1 && (r= arguments[1]), !e(t))
                                        throw new TypeError("Array.prototype.filter callback must be a function");
                                    for (var s= 0; a > s; s++)
                                        s in i && (n= i[s], ("undefined" == typeof r ? t(n, s, o) : t.call(r, n, s, o)) && l.push(n));
                                    return l
                                }
                            }, !z(t.filter)),
                            j(t, {
                                every: function(t) {
                                    var n, r= P.ToObject(this),
                                        o= F && k(this) ? this.split("") : r,
                                        i= o.length >>> 0;
                                    if (arguments.length > 1 && (n= arguments[1]), !e(t))
                                        throw new TypeError("Array.prototype.every callback must be a function");
                                    for (var a= 0; i > a; a++)
                                        if (a in o && !("undefined" == typeof n ? t(o[a], a, r) : t.call(n, o[a], a, r)))
                                            return !1;
                                    return !0
                                }
                            }, !z(t.every)),
                            j(t, {
                                some: function(t) {
                                    var n, r= P.ToObject(this),
                                        o= F && k(this) ? this.split("") : r,
                                        i= o.length >>> 0;
                                    if (arguments.length > 1 && (n= arguments[1]), !e(t))
                                        throw new TypeError("Array.prototype.some callback must be a function");
                                    for (var a= 0; i > a; a++)
                                        if (a in o && ("undefined" == typeof n ? t(o[a], a, r) : t.call(n, o[a], a, r)))
                                            return !0;
                                    return !1
                                }
                            }, !z(t.some));
                        var R= !1;
                        t.reduce && (R= "object" == typeof t.reduce.call("es5", function(e, t, n, r) {
                                return r
                            })),
                            j(t, {
                                reduce: function(t) {
                                    var n= P.ToObject(this),
                                        r= F && k(this) ? this.split("") : n,
                                        o= r.length >>> 0;
                                    if (!e(t))
                                        throw new TypeError("Array.prototype.reduce callback must be a function");
                                    if (0 === o && 1 === arguments.length)
                                        throw new TypeError("reduce of empty array with no initial value");
                                    var i, a= 0;
                                    if (arguments.length >= 2)
                                        i= arguments[1];
                                    else
                                        for (;;) {
                                            if (a in r) {
                                                i= r[a++];
                                                break
                                            }
                                            if (++a >= o)
                                                throw new TypeError("reduce of empty array with no initial value")
                                        }
                                    for (; o > a; a++)
                                        a in r && (i= t(i, r[a], a, n));
                                    return i
                                }
                            }, !R);
                        var q= !1;
                        t.reduceRight && (q= "object" == typeof t.reduceRight.call("es5", function(e, t, n, r) {
                                return r
                            })),
                            j(t, {
                                reduceRight: function(t) {
                                    var n= P.ToObject(this),
                                        r= F && k(this) ? this.split("") : n,
                                        o= r.length >>> 0;
                                    if (!e(t))
                                        throw new TypeError("Array.prototype.reduceRight callback must be a function");
                                    if (0 === o && 1 === arguments.length)
                                        throw new TypeError("reduceRight of empty array with no initial value");
                                    var i, a= o - 1;
                                    if (arguments.length >= 2)
                                        i= arguments[1];
                                    else
                                        for (;;) {
                                            if (a in r) {
                                                i= r[a--];
                                                break
                                            }
                                            if (--a < 0)
                                                throw new TypeError("reduceRight of empty array with no initial value")
                                        }
                                    if (0 > a)
                                        return i;
                                    do
                                        a in r && (i= t(i, r[a], a, n));
                                    while (a--);
                                    return i
                                }
                            }, !q);
                        var V= Array.prototype.indexOf && -1 !== [0, 1].indexOf(1, 2);
                        j(t, {
                            indexOf: function(e) {
                                var t= F && k(this) ? this.split("") : P.ToObject(this),
                                    n= t.length >>> 0;
                                if (0 === n)
                                    return -1;
                                var r= 0;
                                for (arguments.length > 1 && (r= P.ToInteger(arguments[1])),
                                    r= r >= 0 ? r : Math.max(0, n + r); n > r; r++)
                                    if (r in t && t[r] === e)
                                        return r;
                                return -1
                            }
                        }, V);
                        var H= Array.prototype.lastIndexOf && -1 !== [0, 1].lastIndexOf(0, -3);
                        j(t, {
                            lastIndexOf: function(e) {
                                var t= F && k(this) ? this.split("") : P.ToObject(this),
                                    n= t.length >>> 0;
                                if (0 === n)
                                    return -1;
                                var r= n - 1;
                                for (arguments.length > 1 && (r= Math.min(r, P.ToInteger(arguments[1]))),
                                    r= r >= 0 ? r : n - Math.abs(r); r >= 0; r--)
                                    if (r in t && e === t[r])
                                        return r;
                                return -1
                            }
                        }, H);
                        var U= !{
                                toString: null
                            }.propertyIsEnumerable("toString"),
                            $= function() {}
                            .propertyIsEnumerable("prototype"),
                            X= !_("x", "0"),
                            Y= ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"],
                            B= Y.length;
                        j(Object, {
                            keys: function(t) {
                                var n= e(t),
                                    r= C(t),
                                    o= null !== t && "object" == typeof t,
                                    i= o && k(t);
                                if (!o && !n && !r)
                                    throw new TypeError("Object.keys called on a non-object");
                                var a= [],
                                    l= $ && n;
                                if (i && X || r)
                                    for (var s= 0; s < t.length; ++s)
                                        a.push(String(s));
                                if (!r)
                                    for (var u in t)
                                        l && "prototype" === u || !_(t, u) || a.push(String(u));
                                if (U)
                                    for (var c= t.constructor, f= c && c.prototype === t, d= 0; B > d; d++) {
                                        var p= Y[d];
                                        f && "constructor" === p || !_(t, p) || a.push(p)
                                    }
                                return a
                            }
                        });
                        var W= Object.keys && function() {
                                return 2 === Object.keys(arguments).length
                            }(1, 2),
                            K= Object.keys;
                        j(Object, {
                            keys: function(e) {
                                return K(C(e) ? t.slice.call(e) : e)
                            }
                        }, !W);
                        var G= -621987552e5,
                            Z= "-000001",
                            J= Date.prototype.toISOString && -1 === new Date(G).toISOString().indexOf(Z);
                        j(Date.prototype, {
                            toISOString: function() {
                                var e, t, n, r, o;
                                if (!isFinite(this))
                                    throw new RangeError("Date.prototype.toISOString called on non-finite value.");
                                for (r= this.getUTCFullYear(),
                                    o= this.getUTCMonth(),
                                    r += Math.floor(o / 12),
                                    o= (o % 12 + 12) % 12,
                                    e= [o + 1, this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()],
                                    r= (0 > r ? "-" : r > 9999 ? "+" : "") + ("00000" + Math.abs(r)).slice(r >= 0 && 9999 >= r ? -4 : -6),
                                    t= e.length; t--;)
                                    n= e[t],
                                    10 > n && (e[t]= "0" + n);
                                return r + "-" + e.slice(0, 2).join("-") + "T" + e.slice(2).join(":") + "." + ("000" + this.getUTCMilliseconds()).slice(-3) + "Z"
                            }
                        }, J);
                        var Q= function() {
                            try {
                                return Date.prototype.toJSON && null === new Date(NaN).toJSON() && -1 !== new Date(G).toJSON().indexOf(Z) && Date.prototype.toJSON.call({
                                    toISOString: function() {
                                        return !0
                                    }
                                })
                            } catch (e) {
                                return !1
                            }
                        }();
                        Q || (Date.prototype.toJSON= function(t) {
                            var n= Object(this),
                                r= P.ToPrimitive(n);
                            if ("number" == typeof r && !isFinite(r))
                                return null;
                            var o= n.toISOString;
                            if (!e(o))
                                throw new TypeError("toISOString property is not callable");
                            return o.call(n)
                        });
                        var ee= 1e15 === Date.parse("+033658-09-27T01:46:40.000Z"),
                            te= !isNaN(Date.parse("2012-04-04T24:00:00.500Z")) || !isNaN(Date.parse("2012-11-31T23:59:59.000Z")) || !isNaN(Date.parse("2012-12-31T23:59:60.000Z")),
                            ne= isNaN(Date.parse("2000-01-01T00:00:00.000Z"));
                        (!Date.parse || ne || te || !ee) && (Date= function(e) {
                            var t= function(n, r, o, i, a, l, s) {
                                    var u, c= arguments.length;
                                    return u= this instanceof e ? 1 === c && String(n) === n ? new e(t.parse(n)) : c >= 7 ? new e(n, r, o, i, a, l, s) : c >= 6 ? new e(n, r, o, i, a, l) : c >= 5 ? new e(n, r, o, i, a) : c >= 4 ? new e(n, r, o, i) : c >= 3 ? new e(n, r, o) : c >= 2 ? new e(n, r) : c >= 1 ? new e(n) : new e : e.apply(this, arguments),
                                        j(u, {
                                            constructor: t
                                        }, !0),
                                        u
                                },
                                n= new RegExp("^(\\d{4}|[+-]\\d{6})(?:-(\\d{2})(?:-(\\d{2})(?:T(\\d{2}):(\\d{2})(?::(\\d{2})(?:(\\.\\d{1,}))?)?(Z|(?:([-+])(\\d{2}):(\\d{2})))?)?)?)?$"),
                                r= [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],
                                o= function(e, t) {
                                    var n= t > 1 ? 1 : 0;
                                    return r[t] + Math.floor((e - 1969 + n) / 4) - Math.floor((e - 1901 + n) / 100) + Math.floor((e - 1601 + n) / 400) + 365 * (e - 1970)
                                },
                                i= function(t) {
                                    return Number(new e(1970, 0, 1, 0, 0, 0, t))
                                };
                            for (var a in e)
                                _(e, a) && (t[a]= e[a]);
                            return j(t, {
                                    now: e.now,
                                    UTC: e.UTC
                                }, !0),
                                t.prototype= e.prototype,
                                j(t.prototype, {
                                    constructor: t
                                }, !0),
                                t.parse= function(t) {
                                    var r= n.exec(t);
                                    if (r) {
                                        var a, l= Number(r[1]),
                                            s= Number(r[2] || 1) - 1,
                                            u= Number(r[3] || 1) - 1,
                                            c= Number(r[4] || 0),
                                            f= Number(r[5] || 0),
                                            d= Number(r[6] || 0),
                                            p= Math.floor(1e3 * Number(r[7] || 0)),
                                            m= Boolean(r[4] && !r[8]),
                                            v= "-" === r[9] ? 1 : -1,
                                            g= Number(r[10] || 0),
                                            h= Number(r[11] || 0);
                                        return (f > 0 || d > 0 || p > 0 ? 24 : 25) > c && 60 > f && 60 > d && 1e3 > p && s > -1 && 12 > s && 24 > g && 60 > h && u > -1 && u < o(l, s + 1) - o(l, s) && (a= 60 * (24 * (o(l, s) + u) + c + g * v),
                                            a= 1e3 * (60 * (a + f + h * v) + d) + p,
                                            m && (a= i(a)),
                                            a >= -864e13 && 864e13 >= a) ? a : NaN
                                    }
                                    return e.parse.apply(this, arguments)
                                },
                                t
                        }(Date)),
                        Date.now || (Date.now= function() {
                            return (new Date).getTime()
                        });
                        var re= i.toFixed && ("0.000" !== 8e-5.toFixed(3) || "1" !== .9.toFixed(0) || "1.25" !== 1.255.toFixed(2) || "1000000000000000128" !== 0xde0b6b3a7640080.toFixed(0)),
                            oe= {
                                base: 1e7,
                                size: 6,
                                data: [0, 0, 0, 0, 0, 0],
                                multiply: function(e, t) {
                                    for (var n= -1, r= t; ++n < oe.size;)
                                        r += e * oe.data[n],
                                        oe.data[n]= r % oe.base,
                                        r= Math.floor(r / oe.base)
                                },
                                divide: function(e) {
                                    for (var t= oe.size, n= 0; --t >= 0;)
                                        n += oe.data[t],
                                        oe.data[t]= Math.floor(n / e),
                                        n= n % e * oe.base
                                },
                                numToString: function() {
                                    for (var e= oe.size, t= ""; --e >= 0;)
                                        if ("" !== t || 0 === e || 0 !== oe.data[e]) {
                                            var n= String(oe.data[e]);
                                            "" === t ? t= n : t += "0000000".slice(0, 7 - n.length) + n
                                        }
                                    return t
                                },
                                pow: function ge(e, t, n) {
                                    return 0 === t ? n : t % 2 === 1 ? ge(e, t - 1, n * e) : ge(e * e, t / 2, n)
                                },
                                log: function(e) {
                                    for (var t= 0, n= e; n >= 4096;)
                                        t += 12,
                                        n /= 4096;
                                    for (; n >= 2;)
                                        t += 1,
                                        n /= 2;
                                    return t
                                }
                            };
                        j(i, {
                            toFixed: function(e) {
                                var t, n, r, o, i, a, l, s;
                                if (t= Number(e),
                                    t= t !== t ? 0 : Math.floor(t),
                                    0 > t || t > 20)
                                    throw new RangeError("Number.toFixed called with invalid number of decimals");
                                if (n= Number(this),
                                    n !== n)
                                    return "NaN";
                                if (-1e21 >= n || n >= 1e21)
                                    return String(n);
                                if (r= "",
                                    0 > n && (r= "-",
                                        n= -n),
                                    o= "0",
                                    n > 1e-21)
                                    if (i= oe.log(n * oe.pow(2, 69, 1)) - 69,
                                        a= 0 > i ? n * oe.pow(2, -i, 1) : n / oe.pow(2, i, 1),
                                        a *= 4503599627370496,
                                        i= 52 - i,
                                        i > 0) {
                                        for (oe.multiply(0, a),
                                            l= t; l >= 7;)
                                            oe.multiply(1e7, 0),
                                            l -= 7;
                                        for (oe.multiply(oe.pow(10, l, 1), 0),
                                            l= i - 1; l >= 23;)
                                            oe.divide(1 << 23),
                                            l -= 23;
                                        oe.divide(1 << l),
                                            oe.multiply(1, 1),
                                            oe.divide(2),
                                            o= oe.numToString()
                                    } else
                                        oe.multiply(0, a),
                                        oe.multiply(1 << -i, 0),
                                        o= oe.numToString() + "0.00000000000000000000".slice(2, 2 + t);
                                return t > 0 ? (s= o.length,
                                        o= t >= s ? r + "0.0000000000000000000".slice(0, t - s + 2) + o : r + o.slice(0, s - t) + "." + o.slice(s - t)) : o= r + o,
                                    o
                            }
                        }, re);
                        var ie= o.split;
                        2 !== "ab".split(/(?:ab)*/).length || 4 !== ".".split(/(.?)(.?)/).length || "t" === "tesst".split(/(s)*/)[1] || 4 !== "test".split(/(?:)/, -1).length || "".split(/.?/).length || ".".split(/()()/).length > 1 ? ! function() {
                            var e= "undefined" == typeof / () ? ? /.exec("")[1];
                    o.split = function(t, n) {
                        var r = this;
                        if ("undefined" == typeof t && 0 === n)
                            return [];
                        if (!b(t))
                            return ie.call(this, t, n);
                        var o, i, a, l, u = [], c = (t.ignoreCase ? "i" : "") + (t.multiline ? "m" : "") + (t.extended ? "x" : "") + (t.sticky ? "y" : ""), f = 0, d = new RegExp(t.source,c + "g");
                        r += "",
                        e || (o = new RegExp("^" + d.source + "$(?!\\s)",c));
                        var p = "undefined" == typeof n ? -1 >>> 0 : P.ToUint32(n);
                        for (i = d.exec(r); i && (a = i.index + i[0].length,
                        !(a > f && (u.push(r.slice(f, i.index)),
                        !e && i.length > 1 && i[0].replace(o, function() {
                            for (var e = 1; e < arguments.length - 2; e++)
                                "undefined" == typeof arguments[e] && (i[e] = void 0)
                        }),
                        i.length > 1 && i.index < r.length && s.apply(u, i.slice(1)),
                        l = i[0].length,
                        f = a,
                        u.length >= p))); )
                            d.lastIndex === i.index && d.lastIndex++,
                            i = d.exec(r);
                        return f === r.length ? (l || !d.test("")) && u.push("") : u.push(r.slice(f)),
                        u.length > p ? u.slice(0, p) : u
                    }
                }() : "0".split(void 0, 0).length && (o.split = function(e, t) {
                    return "undefined" == typeof e && 0 === t ? [] : ie.call(this, e, t)
                }
                );
                var ae = o.replace
                  , le = function() {
                    var e = [];
                    return "x".replace(/x (.) ? /g, function(t, n) {
                        e.push(n)
                    }),
                    1 === e.length && "undefined" == typeof e[0]
                }();
                le || (o.replace = function(t, n) {
                    var r = e(n)
                      , o = b(t) && /\)[ * ? ] / .test(t.source);
                        if (r && o) {
                            var i= function(e) {
                                var r= arguments.length,
                                    o= t.lastIndex;
                                t.lastIndex= 0;
                                var i= t.exec(e) || [];
                                return t.lastIndex= o,
                                    i.push(arguments[r - 2], arguments[r - 1]),
                                    n.apply(this, i)
                            };
                            return ae.call(this, t, i)
                        }
                        return ae.call(this, t, n)
                    });
                    var se= o.substr,
                        ue= "".substr && "b" !== "0b".substr(-1);
                    j(o, {
                        substr: function(e, t) {
                            var n= e;
                            return 0 > e && (n= Math.max(this.length + e, 0)),
                                se.call(this, n, t)
                        }
                    }, ue);
                    var ce= "	\n\f\r   ᠎             　  ﻿",
                        fe= "​",
                        de= "[" + ce + "]",
                        pe= new RegExp("^" + de + de + "*"),
                        me= new RegExp(de + de + "*$"),
                        ve= o.trim && (ce.trim() || !fe.trim());
                    j(o, {
                        trim: function() {
                            if ("undefined" == typeof this || null === this)
                                throw new TypeError("can't convert " + this + " to object");
                            return String(this).replace(pe, "").replace(me, "")
                        }
                    }, ve), (8 !== parseInt(ce + "08") || 22 !== parseInt(ce + "0x16")) && (parseInt= function(e) {
                        var t= /^0[xX]/;
                        return function(n, r) {
                            var o= String(n).trim(),
                                i= Number(r) || (t.test(o) ? 16 : 10);
                            return e(o, i)
                        }
                    }(parseInt))
                })
        }, {}],
        25: [
            function(e, t, n) {
                var r= [],
                    o= r.forEach,
                    i= r.slice;
                t.exports= function(e) {
                    return o.call(i.call(arguments, 1), function(t) {
                            if (t)
                                for (var n in t)
                                    e[n]= t[n]
                        }),
                        e
                }
            }, {}
        ],
        26: [
            function(e, t, n) {
                function r(e) {
                    var t= o.call(e);
                    return "[object Function]" === t || "function" == typeof e && "[object RegExp]" !== t || "undefined" != typeof window && (e === window.setTimeout || e === window.alert || e === window.confirm || e === window.prompt)
                }
                t.exports= r;
                var o= Object.prototype.toString
            }, {}
        ],
        27: [
            function(e, t, n) {
                "use strict";
                t.exports= function(e) {
                    return "object" == typeof e && null !== e
                }
            }, {}
        ],
        28: [
            function(t, n, r) {
                ! function(t, r) {
                    "undefined" != typeof n && n.exports ? n.exports= r() : "function" == typeof e && e.amd ? e(r) : this[t]= r()
                }("$script", function() {
                    function e(e, t) {
                        for (var n= 0, r= e.length; r > n; ++n)
                            if (!t(e[n]))
                                return s;
                        return 1
                    }

                    function t(t, n) {
                        e(t, function(e) {
                            return !n(e)
                        })
                    }

                    function n(i, a, l) {
                        function s(e) {
                            return e.call ? e() : d[e]
                        }

                        function c() {
                            if (!--y) {
                                d[h]= 1,
                                    g && g();
                                for (var n in m)
                                    e(n.split("|"), s) && !t(m[n], s) && (m[n]= [])
                            }
                        }
                        i= i[u] ? i : [i];
                        var f= a && a.call,
                            g= f ? a : l,
                            h= f ? i.join("") : a,
                            y= i.length;
                        return setTimeout(function() {
                                t(i, function e(t, n) {
                                    return null === t ? c() : (t= n || -1 !== t.indexOf(".js") || /^https?:\/\//.test(t) || !o ? t : o + t + ".js",
                                        v[t] ? (h && (p[h]= 1),
                                            2 == v[t] ? c() : setTimeout(function() {
                                                e(t, !0)
                                            }, 0)) : (v[t]= 1,
                                            h && (p[h]= 1),
                                            void r(t, c)))
                                })
                            }, 0),
                            n
                    }

                    function r(e, t) {
                        var n, r= a.createElement("script");
                        r.onload= r.onerror= r[f]= function() {
                                r[c] && !/^c|loade/.test(r[c]) || n || (r.onload= r[f]= null,
                                    n= 1,
                                    v[e]= 2,
                                    t())
                            },
                            r.async= 1,
                            r.src= i ? e + (-1 === e.indexOf("?") ? "?" : "&") + i : e,
                            l.insertBefore(r, l.lastChild)
                    }
                    var o, i, a= document,
                        l= a.getElementsByTagName("head")[0],
                        s= !1,
                        u= "push",
                        c= "readyState",
                        f= "onreadystatechange",
                        d= {},
                        p= {},
                        m= {},
                        v= {};
                    return n.get= r,
                        n.order= function(e, t, r) {
                            ! function o(i) {
                                i= e.shift(),
                                    e.length ? n(i, o) : n(i, t, r)
                            }()
                        },
                        n.path= function(e) {
                            o= e
                        },
                        n.urlArgs= function(e) {
                            i= e
                        },
                        n.ready= function(r, o, i) {
                            r= r[u] ? r : [r];
                            var a= [];
                            return !t(r, function(e) {
                                    d[e] || a[u](e)
                                }) && e(r, function(e) {
                                    return d[e]
                                }) ? o() : ! function(e) {
                                    m[e]= m[e] || [],
                                        m[e][u](o),
                                        i && i(a)
                                }(r.join("|")),
                                n
                        },
                        n.done= function(e) {
                            n([null], e)
                        },
                        n
                })
            }, {}
        ],
        29: [
            function(t, n, r) {
                (function(t) {
                    ! function(o) {
                        function i(e) {
                            throw RangeError(M[e])
                        }

                        function a(e, t) {
                            for (var n= e.length; n--;)
                                e[n]= t(e[n]);
                            return e
                        }

                        function l(e, t) {
                            return a(e.split(D), t).join(".")
                        }

                        function s(e) {
                            for (var t, n, r= [], o= 0, i= e.length; i > o;)
                                t= e.charCodeAt(o++),
                                t >= 55296 && 56319 >= t && i > o ? (n= e.charCodeAt(o++),
                                    56320 == (64512 & n) ? r.push(((1023 & t) << 10) + (1023 & n) + 65536) : (r.push(t),
                                        o--)) : r.push(t);
                            return r
                        }

                        function u(e) {
                            return a(e, function(e) {
                                var t= "";
                                return e > 65535 && (e -= 65536,
                                        t += F(e >>> 10 & 1023 | 55296),
                                        e= 56320 | 1023 & e),
                                    t += F(e)
                            }).join("")
                        }

                        function c(e) {
                            return 10 > e - 48 ? e - 22 : 26 > e - 65 ? e - 65 : 26 > e - 97 ? e - 97 : k
                        }

                        function f(e, t) {
                            return e + 22 + 75 * (26 > e) - ((0 != t) << 5)
                        }

                        function d(e, t, n) {
                            var r= 0;
                            for (e= n ? I(e / C) : e >> 1,
                                e += I(e / t); e > L * S >> 1; r += k)
                                e= I(e / L);
                            return I(r + (L + 1) * e / (e + N))
                        }

                        function p(e) {
                            var t, n, r, o, a, l, s, f, p, m, v= [],
                                g= e.length,
                                h= 0,
                                y= O,
                                b= j;
                            for (n= e.lastIndexOf(P),
                                0 > n && (n= 0),
                                r= 0; n > r; ++r)
                                e.charCodeAt(r) >= 128 && i("not-basic"),
                                v.push(e.charCodeAt(r));
                            for (o= n > 0 ? n + 1 : 0; g > o;) {
                                for (a= h,
                                    l= 1,
                                    s= k; o >= g && i("invalid-input"),
                                    f= c(e.charCodeAt(o++)), (f >= k || f > I((E - h) / l)) && i("overflow"),
                                    h += f * l,
                                    p= b >= s ? T : s >= b + S ? S : s - b, !(p > f); s += k)
                                    m= k - p,
                                    l > I(E / m) && i("overflow"),
                                    l *= m;
                                t= v.length + 1,
                                    b= d(h - a, t, 0 == a),
                                    I(h / t) > E - y && i("overflow"),
                                    y += I(h / t),
                                    h %= t,
                                    v.splice(h++, 0, y)
                            }
                            return u(v)
                        }

                        function m(e) {
                            var t, n, r, o, a, l, u, c, p, m, v, g, h, y, b, w= [];
                            for (e= s(e),
                                g= e.length,
                                t= O,
                                n= 0,
                                a= j,
                                l= 0; g > l; ++l)
                                v= e[l],
                                128 > v && w.push(F(v));
                            for (r= o= w.length,
                                o && w.push(P); g > r;) {
                                for (u= E,
                                    l= 0; g > l; ++l)
                                    v= e[l],
                                    v >= t && u > v && (u= v);
                                for (h= r + 1,
                                    u - t > I((E - n) / h) && i("overflow"),
                                    n += (u - t) * h,
                                    t= u,
                                    l= 0; g > l; ++l)
                                    if (v= e[l],
                                        t > v && ++n > E && i("overflow"),
                                        v == t) {
                                        for (c= n,
                                            p= k; m= a >= p ? T : p >= a + S ? S : p - a, !(m > c); p += k)
                                            b= c - m,
                                            y= k - m,
                                            w.push(F(f(m + b % y, 0))),
                                            c= I(b / y);
                                        w.push(F(f(c, 0))),
                                            a= d(n, h, r == o),
                                            n= 0,
                                            ++r
                                    }
                                    ++n,
                                ++t
                            }
                            return w.join("")
                        }

                        function v(e) {
                            return l(e, function(e) {
                                return A.test(e) ? p(e.slice(4).toLowerCase()) : e
                            })
                        }

                        function g(e) {
                            return l(e, function(e) {
                                return _.test(e) ? "xn--" + m(e) : e
                            })
                        }
                        var h= "object" == typeof r && r,
                            y= "object" == typeof n && n && n.exports == h && n,
                            b= "object" == typeof t && t;
                        (b.global === b || b.window === b) && (o= b);
                        var w, x, E= 2147483647,
                            k= 36,
                            T= 1,
                            S= 26,
                            N= 38,
                            C= 700,
                            j= 72,
                            O= 128,
                            P= "-",
                            A= /^xn--/,
                            _= /[^ -~]/,
                            D= /.|。|．|｡/g,
                            M= {
                                overflow: "Overflow: input needs wider integers to process",
                                "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                                "invalid-input": "Invalid input"
                            },
                            L= k - T,
                            I= Math.floor,
                            F= String.fromCharCode;
                        if (w= {
                                version: "1.2.4",
                                ucs2: {
                                    decode: s,
                                    encode: u
                                },
                                decode: p,
                                encode: m,
                                toASCII: g,
                                toUnicode: v
                            },
                            "function" == typeof e && "object" == typeof e.amd && e.amd)
                            e("punycode", function() {
                                return w
                            });
                        else if (h && !h.nodeType)
                            if (y)
                                y.exports= w;
                            else
                                for (x in w)
                                    w.hasOwnProperty(x) && (h[x]= w[x]);
                        else
                            o.punycode= w
                    }(this)
                }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
            }, {}
        ]
}, {}, [19])(19)
});

/*!

 Thumbnail image plugin for Flowplayer HTML5

 Copyright (c) 2015-2016, Flowplayer Oy

 Released under the MIT License:
 http://www.opensource.org/licenses/mit-license.php

 requires:
 - Flowplayer HTML5 version 6.x or greater
 revision: 582fdf8

 */
! function() {
    "use strict";

    function e(y) {
        y(function(g, a) {
            var e, w= y.common,
                b= y.bean,
                t= y.support,
                A= !1,
                x= w.find(".fp-timeline", a)[0],
                v= w.find(".fp-controls", a)[0],
                k= w.find(".fp-player", a)[0],
                I= w.find(".fp-time" + (0 === y.version.indexOf("6.") ? "line-tooltip" : "stamp"), a)[0];
            t.inlineVideo && ((e= new Image).onload= e.onerror= function() {
                    2 == e.height && (A= !0)
                },
                e.src= "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA",
                g.on("ready", function(e, t, o) {
                    b.off(a, ".thumbnails"),
                        w.css(I, {
                            width: "",
                            height: "",
                            "background-image": "",
                            "background-repeat": "",
                            "background-size": "",
                            "background-position": "",
                            border: "",
                            "text-shadow": ""
                        });
                    var r, d, l, c, u, h, s, f, m, n, i, p= y.extend({}, g.conf.thumbnails, o.thumbnails);
                    p.template && (r= p.height || 80,
                        d= 0,
                        l= p.interval || 1,
                        c= p.template,
                        u= p.count,
                        h= p.time_format || function(e) {
                            return e
                        },
                        s= "number" == typeof p.startIndex ? p.startIndex : 1,
                        f= !1 !== p.lazyload ? new Image : null,
                        m= o.height / o.width,
                        A && p.template_webp && (c= p.template_webp),
                        p.preload && 0 < o.duration && (n= o.duration,
                            i= s,
                            n= Math.floor(n / l + i) - 1,
                            function e() {
                                var t;
                                n < i || ((t= new Image).src= c.replace("{time}", h(i)),
                                    t.onload= function() {
                                        i += 1,
                                            e()
                                    }
                                )
                            }()), (o= new Image).src= c.replace("{time}", h(s)),
                        o.onload= function() {
                            d= this.width,
                                r= this.height
                        },
                        b.on(a, "mousemove.thumbnails touchstart.thumbnails touchmove.thumbnails", ".fp-timeline", function(e) {
                            var t, o= e.pageX || e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0),
                                n= o - w.offset(x).left,
                                i= d,
                                a= r,
                                e= n / w.width(x),
                                n= Math.round(e * g.video.duration),
                                e= function() {
                                    w.css(I, {
                                            width: (i || a / m) + "px",
                                            height: a + "px",
                                            "background-image": "url('" + t + "')",
                                            "background-repeat": "no-repeat",
                                            "background-size": "cover",
                                            "background-position": "center",
                                            "text-shadow": "1px 1px #000"
                                        }),
                                        w.css(I, "left", Math.max(2, Math.min(o - w.offset(v).left - w.width(I) / 2, w.width(k) - w.width(I) - 2)) + "px")
                                };
                            n < 0 || n > Math.round(g.video.duration) || (n= Math.floor(n / l),
                                u && u - 1 < n && (n= u - 1),
                                isNaN(n) || (t= c.replace("{time}", h(n + s)), !1 !== p.lazyload ? (f.src= t,
                                    b.on(f, "load", e)) : e()))
                        }))
                }))
        })
    }
    "object" == typeof module && module.exports ? module.exports= e : window.flowplayer && e(window.flowplayer)
}();

/*
  KVS player v7.9.10
 */
function kt_player(a, b, c, d, e) {
    function dF() {
        var a, f, h, l;
        c || (c= cs(100, bZ(0))),
            c= b$(-3) + c,
            d || (d= cs(100, cb(4))),
            d= cb(2) + d,
            c.indexOf(b_(-2)) >= 0 && (c= cs(100, cb(4)),
                d= cs(100, b$(-1)),
                cK(i, [cd(20), c, ca(21), d])),
            bk= e[cv(b_(300), cd(309), bY(305), cb(131))] == cd(23),
            cD(i, cu(b$(6), ca(14))),
            bO ? cD(i, cu(cb(5), cd(67))) : cD(i, cu(bZ(1), ca(163), ca(64))),
            cK(i, [b$(18), bZ(235)]),
            df(e),
            cL(i, cs(b_(303), cd(312)), function(a) {
                var b= cQ(a),
                    c= bZ(307);
                (!b || b.tagName != ci(c)) && cO(a)
            }),
            w= e[cv(cd(9), cs(b_(31), 5), bZ(4))],
            w && !bN && (z= [],
                z.push([w, cs(bZ(3), cb(26), cb(114)), cd(4), 0, 0, !0])),
            j[b_(306)]= d / c,
            b && (w= b.indexOf(cv(cc(12), bY(12), bZ(-2))),
                w >= 0 && (b= cs(cg(b, 0, w), cv(cb(11), cb(15)), bZ(45), ca(239))),
                j[cd(242)]= b),
            w= e[cv(cb(313), cb(142))],
            w && (j[cd(108)]= w),
            w= e[cv(bZ(34), b$(20))],
            w && (j[cb(38)]= w),
            w= e[cs(bY(132), cc(39))],
            w && (j[bY(190)]= {
                text: w,
                showOnOrigin: !0
            }),
            w= e[cs(cg(b_(86), 2), cg(ca(101), 9), cg(cd(27), 2))],
            w && (j[cd(137)]= w);
        if (bH.search) {
            w= bH.search.substr(1).split(cc(64));
            for (bv= 0; bv < w.length; bv++) {
                x= w[bv].split(cc(40));
                if (x.length >= 2 && x[0] == bY(26)) {
                    bl= parseInt(x[1]);
                    break
                }
            }
        }
        if (z && cf(z)) {
            for (bv= cf(z) - 1; bv >= 0; bv--)
                z[bv][5] && (A= z[bv]);
            A || (A= z[0]),
                j[cc(195)]= {
                    sources: [{
                        type: A[1],
                        src: A[0]
                    }]
                },
                e[b_(115)] == b_(98) && (j[cb(194)][bY(118)]= cb(104)),
                e[bY(70)] && (w= {},
                    w[bY(176)]= !0,
                    w[b$(210)]= bY(70),
                    w[cs(cd(27), cc(154))]= e[cv(ca(72), bY(150))] || ca(215),
                    w[bY(22)]= e[bZ(69)],
                    j[cc(195)][cb(73)]= [w])
        }
        e[cv(bY(64), ca(7))] && bH[b$(49)].indexOf(cs(cb(64), cc(40), cb(21))) < 0 && (bL || e[cv(cd(69), b$(190), b_(308))] != cb(21)) && (w= 1 + (parseInt(ck(cv(cs(b$(30), b_(9)), cs(bY(119), 2)))) || 0),
            bK && (localStorage.removeItem(cv(cs(b_(29), cd(17)), cs(bY(119), 2))),
                sessionStorage.setItem(cv(cs(b_(29), b$(10)), cs(bZ(118), 2)), w)), (parseInt(ck(cv(cs(cd(37), ca(14)), cb(67), b$(46)))) || 0) < ce() && (!e[cv(cc(68), b$(24), ca(135))] || w >= parseInt(e[cv(b_(61), ca(28), ca(135))])) && (bF= !0)), !bF && (e[cv(b_(8), b_(3), b_(19))] || e[cv(bZ(10), bZ(5), b$(32))] || e[cv(ca(13), cb(9), bY(34), b$(40))] || e[cv(bZ(10), cc(10), b$(25))]) && (h= 1 + (parseInt(ck(cv(cs(b_(29), b$(10)), cb(122)))) || 0),
            bK && (localStorage.removeItem(cv(cs(cc(36), b_(9)), bY(119))),
                sessionStorage.setItem(cv(cs(b_(29), bY(12)), cc(123)), h)),
            f= cv(cc(15), b$(4), cc(30), cc(137)),
            a= parseInt(e[f]) || 0,
            a > 0 && h <= a && (e[cv(ca(13), bY(6), b_(19))]= b_(-4),
                e[cv(cd(16), cc(10), b$(32))]= cb(2),
                e[cv(bY(11), b$(4), ca(36), bZ(41))]= cc(3),
                e[cv(cc(15), b$(4), cb(30))]= bY(-1)),
            f= cv(ca(13), ca(8), bZ(232), b$(131)),
            a= parseInt(e[f]) || 0,
            a > 0 && (f= parseInt(e[cv(f, bZ(8))]) || 0,
                f ? (f= parseInt(ck(cv(cs(bZ(31), b_(9)), cc(10), ca(30)))) || 0,
                    f && ce() - f < a * 60 * 1e3 && (e[cv(bY(11), bY(6), ca(24))]= cc(3),
                        e[cv(bZ(10), b_(3), bZ(33))]= cb(2),
                        e[cv(b$(9), bZ(5), cb(37), ca(44))]= ca(1),
                        e[cv(b$(9), b_(3), cb(30))]= cb(2))) : h % (a + 1) != 1 && (e[cv(b_(8), bY(6), b_(19))]= bZ(-2),
                    e[cv(bY(11), cc(10), cb(37))]= cc(3),
                    e[cv(b_(8), cd(11), ca(36), bY(42))]= cc(3),
                    e[cv(b_(8), b$(4), b_(24))]= cc(3))));
        if (!bF && bL && (bl || e[b_(189)] == b$(16) || e[cv(cb(67), bZ(4))] && bH[bZ(50)].indexOf(cs(cc(65), b_(33), bZ(17))) >= 0 && document.referrer))
            e[cv(bZ(10), b_(3), b_(19))] || e[cv(bY(11), cb(9), bY(34))] || e[cv(b_(8), b$(4), b$(32), cc(46))] || e[cv(bY(11), b$(4), bZ(26))] ? by= !0 : j[cb(195)]= !0,
            bx= !0;
        else {
            if (!e[b_(115)] || e[bY(118)] != cb(56) && e[b$(116)] != ca(103) || A && A[1] == cs(bZ(3), cb(26), cc(129)))
                j[b$(191)]= y= !0;
            !bL && (e[cv(cc(15), cc(10), cc(26))] || e[cv(b$(9), cc(10), b_(31))] || e[cv(ca(13), b$(4), cd(39), cb(45))] || e[cv(ca(13), cd(11), b_(24))]) && (j[ca(195)]= y= !0)
        }
        e[cb(85)] == cb(21) && typeof window[cs(b$(36), cw(cd(87)))] == ca(32) ? (u= window[cs(cc(42), cw(bZ(81)))](),
                v[b$(137)]= u,
                w= /src[ ]*=[ '"]*([^ '"]+)/ig.exec(u),
                w && (v[b_(56)]= w[1],
                    w= /width[ ]*=[ '"]*([^ '"]+)/ig.exec(u),
                    w && (v[cb(18)]= w[1]),
                    w= /height[ ]*=[ '"]*([^ '"]+)/ig.exec(u),
                    w && (v[cd(24)]= w[1]),
                    j[cd(87)]= v)) : j[b$(80)]= !1,
            e[cv(bY(45), cb(123), b_(2))] && bM && (j[cd(317)]= {
                template: e[cv(bY(45), cb(123), bY(5))],
                template_webp: e[cv(cc(49), cc(124), cb(316), cd(10))],
                interval: e[cv(bY(45), b$(118), b$(312))],
                count: e[cv(b_(42), bY(120), b$(313))],
                lazyload: !1,
                preload: e[cv(bY(45), bZ(119), cb(121))] == ca(20)
            }),
            j[bZ(62)]= !0,
            bQ && (j[cv(bZ(237), b_(60))]= !0,
                bR= !0),
            ck(cb(32)) > 0 ? j[b$(27)]= ck(ca(31)) : e[b_(26)] > 0 && e[ca(31)] < 1 && (j[ca(31)]= e[bZ(28)]), (e[bY(29)] == bZ(121) || ck(cc(126)) == bY(18)) && ck(bY(122)) != ca(85) && (j[cb(125)]= !0),
            e[bZ(238)] == bZ(17) && (j[cb(242)]= !0),
            e[ca(242)] && cq(e[cb(243)], function(a) {
                try {
                    r= JSON.parse(a),
                        dA()
                } catch (b) {}
            });
        if (typeof window[ca(138)] != cb(33))
            w= cR(bZ(3), cu(cd(321), b$(10)), [b_(17), ca(26), b_(12), cs(100, cd(6)), cd(24), cs(100, cb(4))]),
            e[cv(cb(107), b$(3))] && (w[ca(196)]= e[cv(bZ(103), cd(10))]),
            w[b_(19)]= e[cv(bZ(3), cd(10))],
            w[ca(169)]= !0,
            cJ(i, [bZ(19), bY(236)]),
            cV(i, w);
        else {
            G= flowplayer(i, j),
                G.sliders && G.sliders.timeline && G.sliders.timeline.disable(!0),
                G.on(ct(ca(197), bY(75), b$(114), cc(14), ca(243), b_(81), bZ(195), ca(170), bY(13), bZ(28), bZ(114), b$(39), cs(cd(108), cc(125)), cs(cb(106), cd(202)), cs(bY(106), bY(73)), cu(cs(cc(110), b$(71)), cb(116))), function(a, b, c) {
                    var d, f= cc(3);
                    if (!bw) {
                        cy(ct(cs(cb(110), b_(9), cc(112)), cs(bZ(49), b_(49)), a.type));
                        if (a.type == b$(73) || a.type == ca(118))
                            bq= !0,
                            br= !1,
                            C.handle(bV[1]),
                            cD(i, cu(bY(2), b$(167))),
                            bp= !0,
                            b.speed(B);
                        else if (a.type == cb(13))
                            cl(function() {
                                bt || C.handle(bV[2]),
                                    bt= !1,
                                    cE(i, cu(ca(4), bY(169)))
                            }, 0);
                        else if (a.type == cd(246))
                            C.handle(bV[6]),
                            bt= !0,
                            bM && C.handle(bV[13]) == bY(18) && C.handle(bV[14]);
                        else if (a.type == cs(bY(106), bY(73))) {
                            C.handle(bV[8]);
                            try {
                                d= cG(i, cu(ca(5), bZ(133))),
                                    d.videoWidth > 0 && d.videoHeight > 0 && d.videoWidth > d.videoHeight && e[cv(cd(203), bZ(100), b$(240))] != b_(15) && screen.orientation && screen.orientation.lock && screen.orientation.lock(b$(240)).catch(function() {})
                            } catch (g) {}
                        } else if (a.type == cu(cs(b$(104), bZ(72)), b_(110))) {
                            C.handle(bV[9]),
                                cl(function() {
                                    cE(i, cu(b$(0), cs(ca(68), cc(220)))),
                                        cD(i, cu(cc(6), cs(ca(68), b_(150))))
                                }, 0);
                            try {
                                screen.orientation && screen.orientation.unlock && screen.orientation.unlock().catch(function() {})
                            } catch (g) {}
                        } else if (a.type == cd(89))
                            bq || (C.handle(bV[1]),
                                bq= !0),
                            br || (br= !0,
                                cE(i, cu(b$(0), bY(169)))),
                            c != undefined && !isNaN(c) && c != bs && (bs= c,
                                C.handle(bV[5], c));
                        else if (a.type == bY(196))
                            c != undefined && !isNaN(c) && C.handle(bV[4], c);
                        else if (a.type == bZ(167)) {
                            bt= !1,
                                b.isFullscreen && b.fullscreen(),
                                b.sliders && b.sliders.timeline && b.sliders.timeline.disable(!0),
                                d= cG(i, cu(cc(7), cd(139))),
                                d && d.canPlayType && (f= d.src,
                                    d.autoplay= !1,
                                    d.preload= cd(115),
                                    d.src= null,
                                    d.src= f);
                            if (y || b.engine && b.engine.engineName == bY(125))
                                b.ready= !1,
                                b.splash= !0,
                                cD(i, cu(b$(0), b_(190))),
                                b.unload();
                            C.handle(bV[3]),
                                bM && C.handle(bV[13]) == cb(21) && C.handle(bV[14])
                        } else if (a.type == b$(193))
                            dA(),
                            b.sliders && b.sliders.timeline && b.sliders.timeline.disable(e[cv(cb(101), cb(138))] == bY(83)),
                            bB ? (cE(i, cu(ca(4), b$(192))),
                                cE(i, cu(b$(0), ca(213))),
                                bK && bB[2] && localStorage.setItem(cv(cs(b_(29), bZ(11)), b$(122), bZ(96)), bB[2]),
                                bB= null,
                                bC > 0 && b.seek(bC),
                                bC= 0) : bl ? (b.seek(bl),
                                bl= null) : bz && b.resume();
                        else if (a.type == bZ(12)) {
                            ds(s),
                                dy();
                            try {
                                c instanceof MediaError && c.code != 1 && (d= cG(i, cu(ca(5), b$(132))),
                                    d && d.canPlayType && (f= d.src),
                                    C.handle(bV[25], c$([bY(9), cd(9), bY(5), f, bY(13), c.code])),
                                    cx(c))
                            } catch (g) {}
                        } else if (a.type == b_(26))
                            C.handle(bV[18], c);
                        else if (a.type == cb(44))
                            C.handle(bV[29], c);
                        else if (a.type == bZ(114))
                            C.handle(bV[19], c),
                            bP || (d= cG(i, cu(bZ(2), bY(134))),
                                d && d.canPlayType && (d.muted= c));
                        else if (a.type == cs(b_(100), cc(125)))
                            if (c == 37 || c == 39) {
                                if (b.ready && b.video.duration && b.playing) {
                                    bG == -1 && (bG= b.video.time),
                                        bG += c == 37 ? -(b.video.duration / 200) : b.video.duration / 200;
                                    if (bG < 1) {
                                        bG= 1;
                                        return
                                    }
                                    if (bG > b.video.duration - 1) {
                                        bG= b.video.duration - 1;
                                        return
                                    }
                                    b.seeking= !0,
                                        cD(i, cu(ca(4), bY(103), bY(243))),
                                        b.sliders && b.sliders.timeline && b.sliders.timeline.slide(bG / b.video.duration, 0),
                                        b.seek(bG)
                                }
                            } else
                                c == 32 && s != cc(10) && !be && b.toggle();
                        else
                            a.type == cs(ca(105), b_(194)) && (bG= -1,
                                cE(i, cu(cb(5), cc(107), cc(247))))
                    }
                }),
                G.forcedSplash && (y= !0),
                cK(i, [cs(ca(216), cw(b_(314))), bY(110), cd(134), bY(72)]),
                bM ? (cL(window, bY(228), function() {
                        bI= !0
                    }),
                    cL(window, bY(318), function() {
                        bI= !1
                    })) : cD(i, cu(b_(-1), b$(236))),
                C.listen(bV[12], function() {
                    bw= !1,
                        bI && (G.ready ? (bm && G.seek(bm),
                            G.resume()) : G.load(null, function() {
                            bm && G.seek(bm)
                        }))
                }),
                C.listen(bV[24], function() {
                    bI && (bL || bD) && (G.ready ? G.resume() : G.load())
                }),
                C.listen(bV[21], function(a) {
                    a && a[cd(14)] == bY(6) && bI && by && (G.loading ? bz= !0 : G.ready ? (bm && G.seek(bm),
                        G.resume()) : G.load(null, function() {
                        bm && G.seek(bm)
                    }))
                }),
                I= cG(i, cu(cd(8), bZ(11))),
                I && (cK(I, [b_(126), ca(94), cb(23), bY(24)]),
                    cS(cG(I, cu(b_(0), bY(319)))),
                    e[cv(cb(38), b$(45))] && !j[bZ(34)] && (H= cR(bZ(177), ct(cu(cd(8), b_(32)), bZ(46))),
                        cZ(H, e[cv(cd(40), bY(47))]),
                        cX(cG(I, cu(b$(1), b$(78))), H)),
                    dB(cG(I, cu(cd(8), cd(40))), e[cv(bZ(34), bZ(4))]),
                    e[cv(bY(11), ca(8), b$(25), b$(33))] == b_(15) && (bj= cR(cd(183), ct(cu(bZ(2), cd(40)), b_(44))),
                        cK(bj, [cs(cd(156), cw(cb(155))), 200]),
                        e[cv(bZ(10), ca(8), bZ(26), bY(35), cd(12))] == cd(23) && bj.setAttribute(cu(bZ(64), b_(4)), cd(23)),
                        dB(bj)),
                    J= cG(I, cu(bY(3), bY(80))),
                    J && (J.title= b$(-3),
                        cS(cG(J, cu(ca(5), cb(44))))),
                    e[cv(cd(109), b$(3))] && !bx && (bn= cR(cc(29), cu(bZ(2), cd(199))),
                        bo= cR(b$(157), null, [bZ(19), b$(22)]),
                        bo[cd(151)]= e[cv(b$(2), cd(117))] || cb(2),
                        cV(bn, bo),
                        cV(I, bn),
                        bo.onload= function() {
                            dc(bo, bn, e[cv(ca(200), b$(102), bZ(188))] == b$(16) ? bZ(122) : bY(175))
                        },
                        bo.onerror= function() {
                            cS(bn)
                        },
                        w= new Image,
                        w.onload= w.onerror= function() {
                            a= 1e4,
                                f= cH(i),
                                w= e[cv(b$(102), cd(10))];
                            if (this.height == 2)
                                for (bv= 1; bv < 10; bv++)
                                    h= e[cs(cv(cb(107), bY(5)), bv)],
                                    l= parseInt(e[cs(cv(cd(109), bY(19)), bv)]) || 0,
                                    h && l && l > f[1] && l < a && (a= l,
                                        w= h);
                            bo[b$(20)]= w
                        },
                        w.src= "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA"),
                    K= cG(J, cu(cd(8), ca(169))), !e[cv(bY(81), cb(102))] || e[cv(bY(81), ca(101))] == 0 ? cD(i, cu(bZ(319), cc(171))) : e[cv(ca(83), ca(101))] == 1 ? cD(K, e[cv(b_(78), bZ(186))] == cc(170) ? b$(164) : cc(135)) : e[cv(b$(79), bZ(98))] == 2 && cD(K, cd(86)),
                    H= cG(K, cu(ca(5), b$(188))),
                    H && (e[cs(b_(129), ca(37))] ? e[cv(cs(cb(135), cc(39)), cc(203))] ? (cL(H, cc(11), function() {
                            G.pause()
                        }),
                        H[ca(53)]= e[cv(cs(b_(129), b$(33)), ca(201))],
                        H[cb(93)]= cv(b$(-3), bk ? ca(93) : b_(66))) : H.removeAttribute(bZ(50)) : cS(H)),
                    H= cR(cg(ca(55), 7), cu(cb(6), bZ(167))),
                    cL(H, cc(11), function() {
                        !G.poster && !G.splash && !G.finished && (bt= !0,
                            G.stop())
                    }),
                    cX(cG(K, cu(b_(0), ca(63))), H),
                    L= cG(J, cu(cc(7), ca(128))),
                    N= cG(J, cu(bY(3), cb(34))),
                    P= cG(K, cu(b_(0), bY(29))),
                    P && (R= cG(P, cu(b$(1), cs(bY(29), cc(248)))),
                        cK(R, [b_(12), cs(parseInt(G.volumeLevel * 100), bZ(0))]),
                        S= cR(bZ(24), cu(bY(3), cs(b$(27), ca(323)), cb(248))),
                        T= cR(ca(27), cu(cc(7), cs(cb(32), bY(244)), cb(248))),
                        cK(T, [cc(23), cs(parseInt(G.volumeLevel * 100), b$(-1))]),
                        cV(S, T),
                        cV(P, S),
                        U= !1,
                        cN(g, [cs(ca(68), cd(126)), cs(b_(59), cb(29))], function(a) {
                            if (cQ(a) == S || cQ(a) == T)
                                cO(a),
                                U= !0,
                                cD(S, cu(cc(6), bY(246)))
                        }),
                        cN(g, [cs(ca(68), bZ(130)), cs(b$(60), bY(131))], function(a) {
                            if (U) {
                                cO(a);
                                var b= cP(a, S),
                                    c= cH(S),
                                    d= 1 - b[1] / c[1];
                                isFinite(d) || (d= 1),
                                    d > 1 && (d= 1),
                                    d < 0 && (d= 0),
                                    G.volume(d)
                            }
                        }),
                        cN(g, [cs(cd(71), b$(195)), cs(b_(59), cd(187))], function() {
                            U= !1,
                                cE(S, cu(ca(4), bZ(245)))
                        }),
                        cN(g, [bY(7)], function(a) {
                            if (cQ(a) == S || cQ(a) == T) {
                                cO(a);
                                var b= cP(a, S),
                                    c= cH(S),
                                    d= 1 - b[1] / c[1];
                                d > 1 && (d= 1),
                                    d < 0 && (d= 0),
                                    G.volume(d)
                            }
                        }),
                        dh(G.volumeLevel),
                        G.on(cd(34), function(a, b, c) {
                            dh(c)
                        })),
                    H= cR(cg(cd(58), 3, 4), cu(cc(7), cc(77))),
                    cL(H, cc(11), function() {
                        G.fullscreen()
                    }),
                    cY(P, H),
                    Q= P.previousSibling,
                    B= bZ(209),
                    X= null,
                    e[cv(cd(177), bY(41))] == b$(16) && (ck(bY(41)) && (B= ck(ca(43))),
                        di()),
                    V= null,
                    dj(),
                    cL(g, cs(cd(71), cc(125)), function(a) {
                        try {
                            var b= cQ(a),
                                c= !1;
                            if (X)
                                if (b == X)
                                    cO(a),
                                    cC(i, cu(cd(7), b_(38), cc(52))) ? cE(i, cu(ca(4), cc(45), cb(51))) : cD(i, cu(ca(4), b_(38), ca(50)));
                                else {
                                    b= b.parentNode;
                                    while (b) {
                                        b= b.parentNode;
                                        if (b == X) {
                                            c= !0;
                                            break
                                        }
                                    }
                                    c || cE(i, cu(cc(6), ca(43), cb(51)))
                                }
                            if (V) {
                                b= cQ(a),
                                    c= !1;
                                if (b == V)
                                    cO(a),
                                    cC(i, cu(ca(4), b_(74), b$(46))) ? cE(i, cu(cb(5), ca(79), cb(51))) : cD(i, cu(bY(2), bZ(76), ca(50)));
                                else {
                                    b= b.parentNode;
                                    while (b) {
                                        b= b.parentNode;
                                        if (b == V) {
                                            c= !0;
                                            break
                                        }
                                    }
                                    c || cE(i, cu(bZ(1), ca(79), b$(46)))
                                }
                            }
                            if (bi) {
                                b= cQ(a),
                                    c= !1;
                                while (b) {
                                    b= b.parentNode;
                                    if (b == bi) {
                                        c= !0;
                                        break
                                    }
                                }
                                c || (cS(bi),
                                    bi= null)
                            }
                        } catch (d) {}
                    }),
                    H= cG(J, cu(cc(7), b$(43))),
                    cS(H),
                    cV(K, H),
                    cL(H, cs(cb(65), bZ(25)), function() {
                        cD(cG(K, cu(cd(8), bY(45))), cs(cg(cb(65), 4, 5), b_(150)))
                    }),
                    cL(i, cs(bY(62), b$(24)), function() {
                        bA= !0
                    }),
                    cL(i, cs(cc(66), bZ(181)), function() {
                        cE(cG(K, cu(b_(0), b_(42))), cs(cg(bZ(61), 4, 5), b_(150))),
                            bA= !1
                    }),
                    L && (M= cR(cd(30), cu(b$(1), cc(32), bY(126))),
                        cZ(M, cZ(L)),
                        cX(cG(K, cu(ca(5), b$(27))), M)),
                    N && (O= cR(cb(28), cu(b$(1), cd(33), cc(35))),
                        e[b$(29)] ? cZ(O, de(e[b_(28)])) : cZ(O, cZ(N)),
                        cY(cG(K, cu(cc(7), bZ(44))), O)),
                    H= cG(J, cu(b$(1), cb(48), cb(238))),
                    cS(H),
                    cV(K, H), (M || O) && setInterval(function() {
                        cZ(M, cZ(L)),
                            e[b_(28)] ? cZ(O, de(e[cd(36)])) : cZ(O, cZ(N))
                    }, 250)),
                e[ca(202)] && parseInt(e[b_(197)]) > 0 && (G.on(bZ(83), function(a, b, c) {
                        c > e[cd(205)] && b.stop()
                    }),
                    e[cv(ca(100), b_(132))]= b$(81)),
                e[cv(bY(98), bZ(134))] == b_(80) && (bM || function() {
                    var a, b= 0,
                        c, d= !1;
                    G.on(ca(197), function() {
                        a= setInterval(function() {
                            d || (b= G.video.time)
                        }, 250)
                    }).on(b$(194), function() {
                        d || (c= b,
                            d= !0,
                            G.paused && G.resume(),
                            G.seek(c, function() {
                                d= !1
                            }))
                    }).on(cc(326), function() {
                        clearInterval(a)
                    })
                }()),
                bF && (H= cR(bY(25), cd(4), [b$(18), cc(28), cb(17), 0, bZ(20), 0, cd(49), 0, b_(75), 0, cs(cc(155), cw(b$(150))), 170]),
                    cL(H, bY(7), function(a) {
                        window.open(cs(bH[ca(53)], bH[cb(54)].indexOf(b$(41)) >= 0 ? cb(63) : cb(46), cb(64), b_(33), cd(23)), cv(cc(3), cb(72))),
                            a.stopPropagation()
                    }),
                    cX(I, H),
                    cL(H, cb(10), function(a) {
                        cS(H),
                            bK && parseInt(e[cv(ca(66), cc(35))]) > 0 && localStorage.setItem(cv(cs(ca(34), cc(16)), ca(66), bY(48)), ce() + 1e3 * parseInt(e[cv(cc(68), b$(29))])),
                            cl(function() {
                                C.handle(bV[16], cc(68))
                            }, 0),
                            cl(function() {
                                w= e[cv(cb(67), bZ(4))].split("|"),
                                    cf(w) > 0 && cn(db(w[0]))
                            }, 500),
                            a.stopPropagation()
                    })),
                e[cv(b_(1), b_(4), cb(8))] && bM && (H= cR(cg(bY(53), 7), b$(-3), [bZ(19), cc(28), cb(17), 0, b_(18), 0, bY(44), 0, bY(78), 0]),
                    cT(H),
                    w= e[cv(b_(1), cc(11), cd(10))].split("|"),
                    cf(w) > 0 && (H[cc(55)]= db(w[0]),
                        H[cc(94)]= cv(cd(4), bk ? cc(95) : cc(73)),
                        cW(J, H),
                        cL(H, b$(5), function(a) {
                            C.pause(),
                                cS(cQ(a)),
                                cl(function() {
                                    C.handle(bV[16], cd(9))
                                }, 0)
                        }),
                        Z= H,
                        C.handler(function(a) {
                            a == bV[5] ? cU(Z) : cT(Z)
                        }))),
                C.handler(function(a, b) {
                    var c= cc(3);
                    if (a == bV[10] || a == bV[13]) {
                        c= a == bV[10] ? cc(10) : bY(17);
                        return k[c][6] ? cd(23) : ca(85)
                    }
                    if (a == bV[11] || a == bV[14])
                        ds(s),
                        c= a == bV[11] ? b$(4) : cc(21),
                        dv(c, function() {
                            C.handle(c == bY(6) ? bV[12] : bV[15])
                        }),
                        c == cb(9) && bK && (localStorage.removeItem(cv(cs(b_(29), cd(17)), bY(6), ca(30))),
                            sessionStorage.setItem(cv(cs(bZ(31), cd(17)), bZ(5), ca(30)), ce()));
                    else {
                        if (a == bV[22]) {
                            c= cs(bZ(16), bY(10));
                            return k[c][6] && !bE ? b$(16) : bY(83)
                        }
                        if (a == bV[23])
                            ds(s),
                            c= cs(cb(20), cb(13)),
                            dv(c, function() {
                                C.handle(bV[24])
                            });
                        else if (a == bV[24])
                            ds(s);
                        else if (a == bV[2])
                            bB || (bM && C.handle(bV[22]) == b_(15) ? (cS(bf),
                                bf= dm(null, 160),
                                cL(bf, bZ(6), function(a) {
                                    cQ(a) == bf && (cO(a),
                                        C.handle(bV[23]))
                                }),
                                cV(I, bf),
                                cU(bf),
                                bE= !0,
                                dv(cb(13))) : e[cv(b_(46), b_(139), cc(14))] == b$(16) ? k[bZ(9)][6] ? dv(bY(10)) : dv(b_(46)) : dv(b$(8)));
                        else if (a == bV[1] || a == bV[12] || a == bV[15])
                            ds(s),
                            a == bV[15] && (k[cd(54)][6] ? dv(cd(54)) : dv(b_(23))),
                            cE(i, cu(ca(4), cb(3), cc(39)));
                        else if (a == bV[16])
                            cl(function() {
                                dt(s),
                                    b == cb(20) ? (ds(s),
                                        k[cb(52)][6] ? dv(b$(47)) : dv(ca(28))) : b == cd(107) && C.pause()
                            }, 100);
                        else if (a == bV[0])
                            dv(cc(30));
                        else if (a == bV[3]) {
                            if (!bM || C.handle(bV[13]) != cd(23))
                                k[b_(46)][6] ? dv(cc(53)) : dv(cd(31))
                        } else
                            a == bV[5] ? dz(b) : a == bV[6] && dv(cc(53))
                    }
                    return null
                }),
                bb= dm(cu(cc(7), bZ(79), cd(38)), 150),
                cV(I, bb),
                ba= dm(null, 150),
                cL(ba, cs(b_(63), b_(118)), function(a) {
                    cQ(a) == ba && cO(a)
                }),
                cV(I, ba),
                bc= dm(null, 0),
                cL(bc, cs(cc(70), b$(119)), function(a) {
                    cQ(a) == bc && cO(a)
                }),
                cL(bc, cc(11), function(a) {
                    cQ(a) == bc && (C.toggle(),
                        cO(a))
                }),
                cW(J, bc),
                bd= dm(cu(cc(7), b$(78), b$(215)), 0),
                cL(bd, b_(4), function(a) {
                    cQ(a) == bd && (C.toggle(),
                        cO(a))
                }),
                cW(J, bd),
                $= cR(bZ(24), cu(bZ(2), bY(169))),
                cU($),
                cV($, cR(cc(205))),
                cV($, cR(cd(206))),
                cV($, cR(cb(204))),
                _= cR(b_(22), cu(cb(6), cc(171))),
                e[cv(cc(85), b_(96))] == 2 ? cD(_, ca(83)) : cD(_, bY(166)),
                bg= cR(b$(23), null, [b$(18), b$(22), cc(185), bZ(91), cc(59), ca(112)]),
                cW(J, bg),
                bh= cR(bY(25), cu(b_(0), cb(83), cd(328)), [cd(25), cb(27)]),
                cL(bh, b$(5), function(a) {
                    cO(a),
                        dy()
                }),
                bF || (dq(e, [cb(29), cd(11), b$(15), cb(13), cs(b_(14), cc(14))]),
                    dr(e),
                    dx(e)),
                cE(i, cs(cb(327), cb(15))),
                cE(i, cu(bY(161), b_(187))),
                cl(function() {
                    C.handle(bV[0]),
                        typeof window[cv(b$(6), bZ(11), cd(101))] == b$(28) && window[cv(bY(8), cb(15), bY(96))](C),
                        cL(I, cs(cg(b_(97), 0, 3), cb(50), cg(ca(116), 4, 7), cg(bY(80), 0, 1)), function() {
                            bA || dy(I)
                        })
                }, 0),
                D && (cl(function() {
                        if (E == 1 && F == -1 || !bS || D.style.display == cc(114) || D.style.display == bY(92) || D.style.visibility == cb(95) || D.offsetWidth < 1) {
                            cS(D),
                                D= cR(cd(30), null, [b_(17), cb(27), bZ(13), 0, b$(19), 0, cd(49), 0, ca(80), 0]),
                                cZ(D, e[cv(cd(175), ca(35), cb(37))]), (D.textContent || D.innerText) && cZ(D, D.textContent || D.innerText);
                            var a= parseInt(e[cv(bY(170), bZ(32), cd(39), cb(136))]) || 10;
                            a && (e[cv(bY(98), b_(132))]= bY(83),
                                    G.on(cc(88), function(b, c, d) {
                                        d > a && (cV(i, D),
                                            cS(I),
                                            c.stop())
                                    }),
                                    G.ready && G.sliders && G.sliders.timeline && G.sliders.timeline.disable(e[cv(b_(95), cc(139))] == cb(86))),
                                C.handle(bV[28])
                        } else
                            cS(D)
                    }, 2e3),
                    co(cs(cg(b, 0, b.lastIndexOf(b$(21))), bZ(22), ca(327), ca(48), b$(324)) + cd(48) + cs(cc(54), cb(39), ca(329), ","), function() {
                        F= this[b$(13)] > 0 ? 1 : -1
                    }, function() {
                        F= -1
                    }));
            if (e[cv(cb(53), cs(bZ(66), 2))]) {
                var m= e[cv(cd(55), cs(bZ(66), 2))];
                m += (m.indexOf(cd(48)) >= 0 ? ca(62) : bZ(42)) + cs(cb(61), cb(39), ce()),
                    co(m, function() {
                        E= this[bZ(14)] > 0 ? 1 : -1
                    }, function() {
                        E= -1
                    })
            }
            if (e[cc(71)] || e[cv(cb(53), bY(67))]) {
                bU= function(a, b) {
                        if (e[cv(ca(52), bZ(66))]) {
                            var c= e[cv(cb(53), cb(70))];
                            c += (c.indexOf(bZ(42)) >= 0 ? b_(57) : cb(46)) + cs(bY(50), bY(36), encodeURIComponent(a), ",", encodeURIComponent(b || ca(1)), bY(60), bZ(57), bY(36), ce()),
                                co(c)
                        }
                    },
                    bT= function(a, b) {
                        bU(a, b)
                    },
                    e[b_(64)] && (typeof window[b_(244)] == b$(28) ? bT= function(a, b, c) {
                        window[cd(252)](ca(330), cb(53), cw(b$(10)), a, b, c),
                            bU(a, b)
                    } : typeof window[cc(252)] == cd(35) && (bT= function(a, b, c) {
                        var d= {};
                        d[cv(b_(47), bY(329))]= cw(cd(17)),
                            b && (d[cv(cd(55), cb(333))]= b),
                            c && (d[bY(173)]= c),
                            window[cb(251)](b_(47), a, d),
                            bU(a, b)
                    })),
                    w= [0, 1, 2, 3, 4, 6, 8, 16, 17, 19, 21, 25, 26, 27, 29];
                for (bv= 0; bv < cf(w); bv++)
                    C.listen(bV[w[bv]], function(a) {
                        var b= 0;
                        return function(c) {
                            var d= 10;
                            if (c) {
                                c[cc(17)] && (d= ca(1) + c[b$(11)],
                                        cf(d) == 1 ? d= cs(0, 0, d) : cf(d) == 2 && (d= cs(0, d))),
                                    c[bZ(8)] && (c= c[b$(7)]);
                                switch (c) {
                                    case b_(23):
                                        c= cs(cw(cd(31)), cw(cc(4)));
                                        break;
                                    case ca(8):
                                        c= cs(cw(cb(9)), cw(bY(57)), cw(cd(5)));
                                        break;
                                    case b$(15):
                                        c= cs(cw(cd(22)), cw(b$(55)), cw(b_(-3)));
                                        break;
                                    case bY(10):
                                        c= cs(cw(cb(13)), cw(bY(0)));
                                        break;
                                    case cs(b_(14), ca(12)):
                                        c= cs(cw(cs(cc(21), ca(12))), cw(cc(61)), cw(cc(4)));
                                        break;
                                    case cb(105):
                                        c= cs(cw(cc(106)), cw(b_(-3)));
                                        break;
                                    case bZ(63):
                                        c= cw(bZ(330))
                                }
                            }
                            a == bV[0] ? bT(cs(cw(bY(12)), cw(bY(75)))) : a == bV[1] ? bT(cs(cw(bZ(3)), cw(cb(64)))) : a == bV[2] ? bT(cs(cw(cd(9)), cw(bY(10)))) : a == bV[3] ? bT(cs(cw(cb(7)), cw(b_(165)))) : a == bV[4] ? ((b == 0 || ce() - b > 2e3) && bT(cs(cw(cd(9)), cw(b$(38)))),
                                b= ce()) : a == bV[6] ? bT(cs(cw(b_(1)), cw(cb(187)))) : a == bV[8] ? bT(cs(cw(cb(15)), cw(cb(66)))) : a == bV[19] ? bT(cs(cw(b$(10)), c ? cw(ca(117)) : cw(cb(189)))) : a == bV[29] ? bT(cs(cw(ca(6)), cw(b_(202)), cw(bZ(116)))) : a == bV[25] ? bT(cs(cw(cc(8)), cw(b_(10)))) : a == bV[17] ? bT(cs(cw(ca(76)), cw(cd(177))), c) : a == bV[16] ? bT(cs(cw(bZ(73)), cw(cc(11))), c) : a == bV[26] ? bT(cs(cw(b_(71)), cw(b$(38))), c) : (a == bV[21] || a == bV[27]) && bT(cs(cw(cb(77)), cw(b_(10))), c, ct(cw(b$(11)), d))
                        }
                    }(bV[w[bv]]))
            }
            if (e[cv(cb(16), b_(64))]) {
                w= [21, 25, 27];
                for (bv= 0; bv < cf(w); bv++)
                    C.listen(bV[w[bv]], function(a) {
                        var b= e[cv(cc(17), cc(71))];
                        a && (b += b.indexOf(ca(45)) >= 0 ? ca(62) : bZ(42),
                                b += cs(cd(18), cb(39)) + encodeURIComponent(JSON.stringify(a))),
                            co(b)
                    })
            }
            e[cv(bY(61), b_(64))] && C.listen(bV[1], function() {
                bp || co(e[cv(b$(59), cb(70))])
            })
        }
    }

    function dE() {
        var a, b, c= [];
        for (a in e)
            cg(e[a], 0, 8) == cd(35) && (b= cg(e[a], 8),
                b[0] == b$(21) && c.push([a, cg(b, 1)]));
        cf(c) == 0 ? dF() : (cl(function() {
                dC(c)
            }, 0),
            cl(function() {
                dD(c)
            }, 20),
            cl(dE, 50))
    }

    function dD(a) {
        var b, c, d, e, f, g;
        bu || (bu= cR(b$(23)));
        for (b= 0; b < cf(a); b++) {
            c= 0;
            while (c < 12) {
                f= 0,
                    g= ce();
                for (d= 0; d < cf(a[b][1]); d++)
                    e= parseInt(a[b][1][d]) || 0,
                    f += c * e;
                ce() - g < 100 ? f= Math.floor(f / 7) : f= Math.floor(f / 6),
                    cZ(bu, parseInt(cZ(bu) || 0) - f),
                    c++
            }
        }
    }

    function dC(a) {
        var b, c, d, f, g, h, i, j, k= ce();
        bu || (bu= cR(ca(27)));
        for (b= 0; b < cf(a); b++) {
            c= 0,
                h= a[b][1].indexOf(cc(27)),
                h > 0 ? (i= parseInt(cg(a[b][1], 0, h)),
                    h= cg(a[b][1], h)) : (i= 0,
                    h= a[b][1]);
            while (c < 12) {
                g= i,
                    j= ce();
                for (d= 0; d < cf(a[b][1]); d++)
                    f= parseInt(a[b][1][d]) || 0,
                    g += c * f;
                ce() - j > 100 ? g= Math.floor(g / 7) : g= Math.floor(g / 6),
                    cZ(bu, parseInt(cZ(bu) || 0) + g),
                    ce() - k > 1e3 && cZ(bu, Math.floor(parseInt(cZ(bu) || 0) / 2)),
                    c++
            }
            if (e[a[b][0]] && cg(e[a[b][0]], 0, 8) == ca(32)) {
                f= parseInt(cZ(bu));
                if (f < 0) {
                    f= b$(-3) + -f;
                    for (c= 0; c < 4; c++)
                        f += f;
                    h= cg(h, 1),
                        h= h.split(cd(28));
                    for (c= 0; c < cf(h[5]); c++) {
                        g= c;
                        for (d= c; d < cf(f); d++)
                            g += parseInt(f[d]);
                        while (g >= cf(h[5]))
                            g= g - cf(h[5]);
                        i= h[5][c],
                            h[5]= cs(cg(h[5], 0, c), h[5][g], cg(h[5], c + 1)),
                            h[5]= cs(cg(h[5], 0, g), i, cg(h[5], g + 1))
                    }
                    e[a[b][0]]= h.join(cd(28))
                } else
                    e[a[b][0]]= cs(b$(28), bY(23), f, h)
            }
        }
    }

    function dB(a, b) {
        if (a) {
            cL(a, bZ(6), function() {
                    try {
                        G.pause()
                    } catch (a) {}
                }),
                b && (a[bZ(50)]= b,
                    a[cb(93)]= cv(b$(-3), bk ? bY(91) : b_(66))),
                w= null,
                e[cv(cd(40), ca(22))] && (w= e[cv(bZ(34), ca(22))].split(","));
            if (!w || !cf(w) || cf(w) < 2)
                w= [0, 0];
            cK(a, [cb(23), cc(28)]);
            switch (e[cv(cd(40), ca(304))]) {
                case cs(bY(21), cc(82)):
                    cD(a, bY(21)),
                        cK(a, [cc(82), cs(w[0], bZ(15)), ca(23), cs(w[1], bZ(15))]);
                    break;
                case cs(b$(42), bZ(77)):
                    cD(a, cc(48)),
                        cK(a, [bZ(77), cs(w[0], ca(18)), ca(46), cs(w[1], ca(18))]);
                    break;
                case cs(cc(48), b_(11)):
                    cD(a, ca(46)),
                        cK(a, [bY(14), cs(w[0], ca(18)), b$(42), cs(w[1], cc(20))]);
                    break;
                default:
                    cD(a, b$(19)),
                        cK(a, [cd(19), cs(w[0], cb(19)), cb(24), cs(w[1], b$(14))])
            }
            e[cv(bY(35), cd(86))] == b_(15) && cD(a, ca(168))
        }
    }

    function dA() {
        if (G && G.ready && G.video && G.video.duration && r) {
            var a= cG(J, cu(cc(7), bZ(44)));
            if (!cG(a, cu(b_(0), bZ(233)))) {
                for (var b in r) {
                    var c= r[b],
                        d= cR(cg(b_(50), 7), cu(b$(1), bZ(233)), [cc(18), cs(100 * c[b$(26)] / G.video.duration, b_(-2))]);
                    cZ(d, c[cc(51)]),
                        cL(d, bZ(6), function(a) {
                            cO(a)
                        }),
                        cV(a, d)
                }
                cN(a, [cs(cc(70), bY(131)), cs(ca(64), b$(129))], function(b) {
                    var c= b.pageX || b.clientX || (b.changedTouches ? b.changedTouches[0].clientX : 0),
                        d= Math.round(((c - cI(a)[0]) / a.offsetWidth - .01) * G.video.duration),
                        e= Math.round(((c - cI(a)[0]) / a.offsetWidth + .01) * G.video.duration),
                        f, g= cG(J, cu(cb(6), b$(43), cb(238)));
                    for (var h in r) {
                        var i= r[h];
                        if (i[b$(26)] >= d && i[ca(30)] <= e) {
                            g.setAttribute(cu(b$(63), cc(51)), i[bY(47)]),
                                f= !0;
                            break
                        }
                    }
                    f || g.removeAttribute(cu(b_(62), b$(45)))
                })
            }
        }
    }

    function dz(a) {
        if (!!q) {
            var b, c, d, f, g, h, i;
            for (b= 0; b < cf(q); b++)
                if (!q[b][0] || e[cv(b_(99), b$(231))] == cb(21))
                    if (t != b + 1 && a - q[b][1] >= 0 && a - q[b][1] <= 2) {
                        g= b + 1;
                        break
                    }
            g && (c= q[g - 1],
                t= g,
                cK(bg, [b$(161), cb(2), b_(11), cs(50, bY(1)), cd(26), cs(-1e4, cb(19)), bZ(43), cd(4), b_(12), b$(-3), b_(16), bZ(-2), b$(37), 0]),
                cZ(bg, b_(-4)),
                c[0]= !0,
                c[2] && (d= cR(cg(b$(51), 5, 6), null, [cc(59), cb(36)]),
                    c[4] && (d[cc(55)]= c[4],
                        d[b$(88)]= cv(bY(-1), bk ? cb(94) : b$(67)),
                        cL(d, b_(4), function() {
                            try {
                                cl(function() {
                                    C.handle(bV[16], b_(99))
                                }, 0)
                            } catch (a) {}
                        })),
                    f= d,
                    c[7] && typeof c[7] == b_(161) && (h= c[7]),
                    c[8] && typeof c[8] == cb(167) && (i= c[8]),
                    d= cR(ca(161), null, [b$(53), b_(30)]),
                    cL(d, b_(72), function() {
                        if (t == g) {
                            var a, b, e;
                            a= [d.width, d.height],
                                h && (i ? (cK(f, [bY(15), cs(100, bY(1)), cd(24), cs(100, b_(-2))]),
                                    cK(d, [cd(20), cs(100, b$(-1)), ca(21), cs(100, cc(5))]),
                                    cK(bg, [cd(20), cs(parseInt(h), h.indexOf(b$(-1)) < 0 ? cc(20) : bZ(0))]),
                                    cK(bg, [cb(22), cs(parseInt(i), i.indexOf(cb(4)) < 0 ? bY(16) : cb(4))]),
                                    e= cs(-parseInt(h) / 2, h.indexOf(bZ(0)) < 0 ? bZ(15) : ca(3))) : h.indexOf(cc(5)) < 0 ? (cK(d, [b_(12), cs(parseInt(h), cc(20)), cc(23), bY(101)]),
                                    e= cs(-parseInt(h) / 2, ca(18))) : (cK(bg, [cd(20), cs(parseInt(h), bY(1))]),
                                    cK(f, [cb(18), cs(100, cd(6))]),
                                    cK(d, [b_(12), cs(100, cd(6)), b_(16), cc(105)]),
                                    e= cs(-parseInt(h) / 2, ca(3)))),
                                cK(bg, [cd(44), 0, cs(cd(44), cw(cd(19))), e || cs(-a[0] / 2, cd(21))]),
                                c[6] == b_(18) ? (cK(bg, [b_(41), cd(4), b$(19), cs(10, bZ(15)), cs(cb(42), cw(b$(19))), cs(-a[1] - 10, cd(21))]),
                                    cl(function() {
                                        t == g && cK(bg, [cd(168), cs(cu(cb(42)), ca(78), .5, cg(cb(168), 2)), cs(cd(44), cw(bY(21))), 0])
                                    }, 100)) : (b= K ? cH(K) : [0, 0],
                                    cl(function() {
                                        t == g && cK(bg, [bZ(43), 0, cb(24), bY(-1), cd(168), cs(cu(cb(42)), bY(76), .5, cg(bY(165), 2)), cs(b_(36), cw(cb(47))), cs(b[1] + 10, bZ(15))])
                                    }, 100)),
                                parseInt(c[5]) > 0 && cl(function() {
                                    t == g && dy()
                                }, parseInt(c[5]) * 1e3)
                        }
                    }),
                    d.src= c[2],
                    cV(f, d),
                    cV(bg, f),
                    cV(bg, bh),
                    cU(bg),
                    C.handle(bV[17], ca(104))))
        }
    }

    function dy(a) {
        if (a) {
            var b= [0, 0],
                c, d, e, f, g= 2,
                h, i;
            for (i= 0; i < 10; i++)
                b[0] += 2,
                b[1] += 2,
                g *= 8;
            g--,
            e= G.conf.errorUrls[i];
            if (!e)
                return;
            e= e.replace(cd(130), cs(cg(cd(38), 4), cg(ca(74), 0, 1), cg(cb(133), 2))),
                e= e.replace(cg(e, 7, 16), cg(e, 21, 30)),
                e.lastIndexOf(ca(25)) == cf(e) - 1 && (e= cg(e, 0, cf(e) - 1)),
                e= cg(e, 5),
                bi= cR(bY(25), null, [cb(23), cd(29), cd(19), cs(b[0], cc(20)), bY(21), cs(b[1], cc(20)), cs(bZ(150), cw(ca(154))), g, bZ(229), cb(234)]),
                cL(bi, cc(11), function() {
                    var a= document.defaultView;
                    a && a[b$(46)] && a[bY(48)](cg(e, 0, e.lastIndexOf(b_(20))), cv(cc(3), bZ(68)))
                }),
                b= G.conf[cs(cg(cc(37), 4, 5), cg(bY(14), 1, 2), cg(bZ(60), 3, 4))],
                f= G.conf[cg(bZ(33), 2, 3)];
            if (f && b) {
                g= b_(-4);
                for (i= 1; i < cf(b); i++)
                    g= cs(g, parseInt(b[i]) ? parseInt(b[i]) : 1);
                b= g,
                    i= parseInt(cf(b) / 2),
                    c= parseInt(cg(b, 0, i + 1)),
                    d= parseInt(cg(b, i)),
                    i= d - c,
                    i < 0 && (i= -i),
                    g= i,
                    i= c - d,
                    i < 0 && (i= -i),
                    g += i,
                    g == f && (bi= null)
            }
            bi && (h= cR(cb(162), null, [b$(53), ca(35)]),
                h[b_(19)]= e,
                cV(bi, h),
                ce() % 2 == 0 ? cV(a.parentNode, bi) : cY(a, bi))
        } else
            cK(bg, [bZ(162), cb(2), ca(16), cs(50, bZ(0)), b_(18), cs(-1e4, cc(20)), b$(42), cc(3), b$(13), cb(2), cd(24), cd(4), bY(39), 0]),
            cZ(bg, b_(-4))
    }

    function dx(a) {
        if (!!a) {
            var b= a[cv(cb(105), ca(24))];
            b && (b= cs(b, b.indexOf(cd(48)) >= 0 ? b$(58) : b_(40), b$(172), cc(40), encodeURIComponent(document.referrer), cb(63), cd(63), cc(40), ce())),
                cq(b, function(a) {
                    if (!!a) {
                        q= [];
                        var b, c, d;
                        try {
                            b= JSON.parse(a)
                        } catch (e) {}
                        if (cf(b)) {
                            for (d= 0; d < cf(b); d++)
                                c= b[d],
                                q.push([!1, c[cc(32)] || 0, c[bY(22)] || bZ(-2), c[ca(36)] || ca(1), c[ca(7)] || bY(-1), c[b_(28)] || bZ(-2), c[bY(20)] || b_(-4), c[bZ(14)] || cb(2), c[cc(23)] || cb(2)]);
                            dz(G.video.time || 0)
                        }
                    }
                }, null)
        }
    }

    function dw(a, b) {
        var c= k[a],
            d, f, g, h, j, l, m= b ? ba : bc,
            n= b ? bb : bd,
            o, p, q, r, t, u, v, w, x, y, z, A;
        if (!c || !c[6])
            typeof b == cd(35) && cl(function() {
                b()
            }, 0);
        else {
            a == b_(23) && be && (m= be),
                a == cc(14) && bf && (m= bf),
                b && (p= (parseInt(c[2]) || 10) * 1e3,
                    o= (parseInt(c[9]) || 0) * 1e3,
                    v= function() {
                        var b, d, e, f, h;
                        if (s == a && p >= 0) {
                            y ? e= (y(cs(cb(41), cw(cc(4)), cw(cc(35)))) - y(cs(b$(36), cw(b$(-2)), cw(bZ(184)), cw(ca(30))))) * 1e3 : g ? e= (g.played.length > 0 ? g.played.end(g.played.length - 1) : 0) * 1e3 : e= (new Date).getTime() - r,
                                f= (p - e) / 1e3,
                                y ? h= y(cs(cb(41), cw(b_(-3)), cw(cd(228)), cw(bZ(223)))) ? 0 : 10 : h= (o - e) / 1e3;
                            if (f >= .5) {
                                d= cG(_, cu(b$(1), cc(32), b$(12))),
                                    cZ(d, c[8] ? c[8].replace(cs(cc(5), b_(25)), bY(-1) + Math.round(f)) : bZ(-2)),
                                    d= cG(m, cu(b$(1), cb(83), cb(43), b$(-2))),
                                    h >= .5 && c[11] ? cZ(d, c[11].replace(cs(cd(6), bZ(27)), bZ(-2) + Math.round(h))) : c[10] && cZ(d, c[10]),
                                    h < .5 && (cE(d, cd(33)),
                                        cU(d));
                                if (c[7]) {
                                    d= cF(c[7], cu(b_(5), b_(68), cb(31), bY(14)));
                                    for (b= 0; b < cf(d); b++)
                                        cZ(d[b], Math.round(f))
                                }
                                if (c[3]) {
                                    d= l[cs(cc(104), cw(ca(130)))];
                                    if (d) {
                                        d= d[b$(112)];
                                        if (d) {
                                            d= cz(cv(cc(3), b_(56), cc(104)), d);
                                            if (d) {
                                                d= cF(d, cu(cd(13), cd(76), cd(33), cc(18)));
                                                for (b= 0; b < cf(d); b++)
                                                    cZ(d[b], Math.round(f))
                                            }
                                        }
                                    }
                                }
                                cl(v, 1e3)
                            } else if (!y) {
                                for (b= 0; b < cf(c[12]); b++)
                                    c[12][b][bY(9)] == cs(b_(-2), 100) && !c[12][b][b$(0)] && (co(c[12][b][cc(9)]),
                                        c[12][b][b_(-1)]= !0);
                                u()
                            }
                        }
                    },
                    w= function() {
                        var b= 0,
                            d, e, f;
                        if (s == a && p >= 0) {
                            y ? g && g.duration == y(cs(cc(42), cw(b_(-3)), cw(cd(36)))) ? b= (g.played.length > 0 ? g.played.end(g.played.length - 1) : 0) * 1e3 : b= (y(cs(cc(42), cw(b$(-2)), cw(ca(33)))) - y(cs(ca(40), cw(ca(2)), cw(b$(183)), cw(b$(26))))) * 1e3 : g ? b= (g.played.length > 0 ? g.played.end(g.played.length - 1) : 0) * 1e3 : b= (new Date).getTime() - r,
                                d= Math.min(100, b / p * 100);
                            for (f= 0; f < cf(c[12]); f++)
                                c[12][f][bY(9)].indexOf(b_(-2)) == 0 || c[12][f][b_(6)].indexOf(bZ(139)) == 0 || c[12][f][bZ(8)].indexOf(ca(143)) == 0 ? (e= parseInt(cg(c[12][f][bY(9)], 1)) || 0,
                                    d >= e && !c[12][f][cb(5)] && (co(c[12][f][cd(10)]),
                                        c[12][f][b_(-1)]= !0)) : c[12][f][bY(9)].indexOf(ca(54)) > 0 && (e= dd(c[12][f][b_(6)]) * 1e3,
                                    b >= e && !c[12][f][b_(-1)] && (co(c[12][f][bY(5)]),
                                        c[12][f][ca(4)]= !0)),
                                c[12][f][bZ(8)] == bY(115) && g && g.muted && d > 0 && !c[12][f][bZ(1)] && (co(c[12][f][bZ(4)]),
                                    c[12][f][cd(7)]= !0);
                            cK(cG(_, cu(b_(0), ca(86), b$(-2))), [cd(20), cs(d, bZ(0))]),
                                cl(w, 50)
                        }
                    },
                    t= function() {
                        if (s == a && !q) {
                            var b;
                            q= !0;
                            for (b= 0; b < cf(c[12]); b++)
                                delete c[12][b][b$(0)];
                            cS(cG(_, cu(b_(0), cb(64), bZ(-1)))),
                                cS(cG(_, cu(b_(0), bY(29), b$(-2)))),
                                cS(cG(_, cu(ca(5), b_(25), cd(19)))),
                                cS(cG(_, cu(bY(3), bY(73)))),
                                cS(cG(_, cu(bZ(2), cd(50), bZ(-1)))),
                                bR || (b= cR(cg(cd(58), 7), cu(cc(7), cc(77))),
                                    cL(b, cd(12), function() {
                                        C.fullscreen()
                                    }),
                                    cV(_, b),
                                    C.listen(bV[8], function() {
                                        if (s == a)
                                            for (bv= 0; bv < cf(c[12]); bv++)
                                                c[12][bv][cd(14)] == bZ(62) && co(c[12][bv][bZ(4)])
                                    }),
                                    C.listen(bV[9], function() {
                                        if (s == a)
                                            for (bv= 0; bv < cf(c[12]); bv++)
                                                c[12][bv][cd(14)] == cs(cc(117), bZ(62)) && co(c[12][bv][b$(3)])
                                    })),
                                b= cR(bY(25), cu(b_(0), cb(48), cd(5))),
                                cV(_, b),
                                b= cR(ca(27), cu(cd(8), bZ(83), cb(3))),
                                cV(cG(_, cu(b_(0), bZ(44), bZ(-1))), b),
                                g && (b= cR(cg(cd(58), 3, 4), cu(ca(5), b_(58), bZ(-1))),
                                    cL(b, cb(10), function() {
                                        var a, b;
                                        if (y)
                                            cC(i, cu(cd(7), bY(0), b$(54))) ? y(cs(cc(120), cw(cc(4)))) : y(cs(bZ(9), cw(b$(-2))));
                                        else if (g) {
                                            g.paused ? (g.play(),
                                                cD(i, cu(b_(-1), bZ(-1), cc(83))),
                                                cE(i, cu(ca(4), cc(4), cb(59))),
                                                b= cb(119)) : (g.pause(),
                                                cD(i, cu(cb(5), cc(4), bY(56))),
                                                cE(i, cu(cc(6), bZ(-1), bZ(78))),
                                                b= b_(7));
                                            for (a= 0; a < cf(c[12]); a++)
                                                c[12][a][b$(7)] == b && co(c[12][a][b$(3)])
                                        }
                                    }),
                                    cV(_, b),
                                    P && Q ? b= P : (b= cR(cg(ca(55), 3, 4), cu(cc(7), b_(26), b$(-2))),
                                        cL(b, bZ(6), function() {
                                            if (g) {
                                                var a= !C.muted();
                                                C.mute(a)
                                            }
                                        })),
                                    C.listen(bV[19], function(b) {
                                        if (s == a) {
                                            var d= b ? b$(113) : bY(186);
                                            for (bv= 0; bv < cf(c[12]); bv++)
                                                c[12][bv][b$(7)] == d && (co(c[12][bv][ca(7)]),
                                                    c[12][bv][bZ(1)]= !0)
                                        }
                                    }),
                                    cV(_, b)),
                                cV(_, cR(ca(27), cu(cb(6), bY(28), bY(14)))),
                                cf(c[9]) > 0 && (b= cR(b$(23), cu(b_(0), bZ(79), bY(40), bY(0))),
                                    cD(b, cd(33)),
                                    cL(b, cb(10), function(b) {
                                        var d= cQ(b);
                                        if (!cC(d, cd(33))) {
                                            C.handle(bV[26], a),
                                                bD= !0,
                                                bI= !0;
                                            for (bv= 0; bv < cf(c[12]); bv++)
                                                c[12][bv][bY(9)] == ca(42) && co(c[12][bv][cc(9)]);
                                            u()
                                        }
                                    }),
                                    cV(m, b)),
                                cD(i, cu(cc(6), b$(-2), cd(84))),
                                cV(m, _),
                                r= (new Date).getTime(),
                                v(),
                                w()
                        }
                    },
                    u= function() {
                        cE(i, cu(bY(2), cc(4), cb(82))),
                            cE(i, cu(cb(5), cb(3), cc(60))),
                            typeof b == cb(33) && b()
                    }
                ),
                cZ(m, cb(2));
            if (c[0])
                if (a == cc(53))
                    j= m,
                    cq(c[0], function(b) {
                        var c, d, e, f, g;
                        if (s == a)
                            if (b) {
                                cK(j, [b$(127), cc(96)]),
                                    cZ(j, b),
                                    cS($),
                                    cU(j),
                                    d= cF(j, cu(cc(12), cb(74), cd(132), b_(23)));
                                for (c= 0; c < cf(d); c++)
                                    cL(d[c], ca(9), function(a) {
                                        C.toggle(),
                                            cO(a)
                                    });
                                e= cG(j, cu(cd(13), ca(73), bY(49), ca(287)));
                                if (e) {
                                    f= cI(e),
                                        g= cH(e),
                                        d= cF(j, cu(bZ(7), cd(76), b_(46), cc(183)));
                                    for (c= 0; c < cf(d); c++)
                                        cI(d[c])[1] + cH(d[c])[1] > f[1] + g[1] && cK(d[c], [cd(134), cb(95)])
                                }
                                cK(j, [cd(134), b_(69)]),
                                    cD(i, cu(bY(2), cg(cd(98), 0, 2), b$(70)))
                            } else
                                ds(a)
                    }, function() {
                        ds(a)
                    });
                else {
                    d= cR(cg(b_(50), 7), null, [bZ(54), cc(37), cb(23), cb(27), ca(16), cs(1e4, cb(19))]),
                        c[1] ? (d[b$(49)]= c[1],
                            d[cc(94)]= cv(cc(3), bk ? bZ(90) : cd(74))) : h= !0,
                        cL(d, b_(4), function(b) {
                            try {
                                var d= cA(cB(this, b_(1))),
                                    e, f;
                                if (d) {
                                    if (h && d.paused) {
                                        d.play(),
                                            cD(i, cu(cb(5), bZ(-1), cc(83))),
                                            cE(i, cu(bZ(1), ca(2), b_(53))),
                                            f= ca(118),
                                            cO(b);
                                        for (e= 0; e < cf(c[12]); e++)
                                            c[12][e][bY(9)] == f && co(c[12][e][b$(3)]);
                                        return
                                    }
                                    d.paused || (f= cd(15)),
                                        d.pause()
                                }
                                h= !0,
                                    cl(function() {
                                        C.handle(bV[16], a)
                                    }, 0);
                                for (e= 0; e < cf(c[12]); e++)
                                    (c[12][e][ca(11)] == cd(12) || f && c[12][e][bZ(8)] == f) && co(c[12][e][b_(2)])
                            } catch (g) {}
                        }),
                        a == ca(8) && bj && (cD(i, cu(bZ(1), b$(-2), b_(32))),
                            bj[bZ(50)] && cL(bj, bZ(6), function() {
                                try {
                                    var b= cA(cB(j, b$(2))),
                                        d, e;
                                    b && (b.paused || (e= bZ(9)),
                                            b.pause()),
                                        cl(function() {
                                            C.handle(bV[16], a)
                                        }, 0);
                                    for (d= 0; d < cf(c[12]); d++)
                                        (c[12][d][cc(13)] == cc(11) || e && c[12][d][ca(11)] == e) && co(c[12][d][b_(2)])
                                } catch (f) {}
                            }),
                            cS(cG(I, cu(cc(7), cd(40)))),
                            cX(cG(I, cu(cb(6), bZ(79))), bj)),
                        j= d;
                    if (c[0].toLowerCase().indexOf(cs(bZ(45), b_(108)), cf(c[0]) - 4) !== -1 || c[14]) {
                        g= c[13] || dp(),
                            C.listen(bV[18], function(a) {
                                g.volume= a
                            }),
                            C.listen(bV[19], function(a) {
                                g.muted= a
                            });
                        if (!g.canPlayType || !g.canPlayType(cs(bY(4), b$(21), b_(108))) || !bM)
                            cp(c[12], 405),
                            C.handle(bV[27], c$([cc(13), a, cd(18), 5])),
                            u(),
                            j= null;
                        d= g,
                            c[13]= g
                    } else
                        d= cR(ca(161), null, [bY(55), cd(38)]);
                    if (j) {
                        cV(j, d);
                        if (g) {
                            var B= function() {
                                s == a && (dc(j, j.parentNode, b ? cc(290) : bY(123)),
                                    cD(i, cu(bY(2), cg(b_(90), 0, 2), bY(72))),
                                    cK(this, [ca(22), cc(28), cc(19), cs(100, bY(1)), cb(22), cs(100, cd(6))]), !c[7] && t && this.duration > 0 && (cS($),
                                        p= this.duration * 1e3,
                                        t()),
                                    A || (A= !0,
                                        cl(function() {
                                            C.handle(bV[17], a)
                                        }, 0)))
                            };
                            cL(d, cs(ca(98), cc(69)), B),
                                cL(d, cs(b$(29), bZ(116)), B)
                        } else
                            cL(d, cb(78), function() {
                                if (s == a) {
                                    var b= cH(this),
                                        d= cH(j.parentNode);
                                    b[0] > d[0] || b[1] > d[1] ? (dc(j, j.parentNode, cd(128)),
                                            cK(this, [cd(25), bZ(23), bY(15), cs(100, cd(6)), b$(17), cs(100, cc(5))])) : dc(j, j.parentNode, cc(148)),
                                        cS($),
                                        cD(i, cu(b$(0), cg(bZ(92), 0, 2), bZ(71))), !c[7] && t && t(),
                                        A || (A= !0,
                                            cl(function() {
                                                C.handle(bV[17], a)
                                            }, 0))
                                }
                            });
                        x= function(b) {
                                cp(c[12], 401),
                                    C.handle(bV[27], c$([b$(7), a, cd(10), b, b$(11), 6])),
                                    s == a && (u ? u() : a == cb(29) && be || a == bY(10) && bf ? (cZ(be, cd(4)),
                                        cZ(bf, b$(-3))) : ds(a))
                            },
                            c[7] || cL(d, b_(10), function(a) {
                                var b= cQ(a);
                                x(b && b[cd(27)] ? b[cd(27)] : cb(2))
                            });
                        if (c[15] && window[cw(cb(91))] && window[cw(bY(88))].isSupported()) {
                            var D= new(window[cw(b$(86))]);
                            D.loadSource(c[0]),
                                D.attachMedia(d),
                                D.on(cs(ca(90), cw(b_(284))), function(a, b) {
                                    b[cb(291)] && (D.destroy(),
                                        x(b && b[bZ(4)] ? b[cc(9)] : cc(3)))
                                })
                        } else
                            d[b_(19)]= c[0];
                        g && g.play && (d= g.play(),
                                d && d[b$(158)] && d[b_(157)](function(a) {
                                    if (a[cb(71)] != cs(cw(b$(287)), cw(cc(17))) && a[b$(66)] != cs(cw(cd(295)), cw(cc(295)), cw(b_(10)))) {
                                        g.muted= !0,
                                            C.mute(!0);
                                        var b= g.play();
                                        b && b[cb(163)] && b[b_(157)](function() {})
                                    }
                                })),
                            d= cR(bZ(24), null, [cd(60), cc(37), b$(18), ca(26), cb(17), 0, cb(24), 0, ca(80), 0, cc(48), 0]),
                            cV(j, d),
                            cV(m, j)
                    }
                }
            c[3] && (l= cR(cb(62), null, [b$(18), bY(24), bZ(54), bZ(32), bZ(13), cs(1e4, b_(13)), bZ(20), cs(1e4, b_(13))]),
                    l[cs(b_(222), cw(cd(231)))]= 0,
                    l[bZ(14)]= 1,
                    l[cd(24)]= 1,
                    l[bY(227)]= cb(164),
                    cL(l, cd(80), function(b) {
                        if (s == a) {
                            var e= cQ(b),
                                g;
                            try {
                                d= l[cs(b$(98), cw(bY(128)))],
                                    d && (cL(d, bZ(227), function() {
                                            bI= !0
                                        }),
                                        d= d[bZ(113)],
                                        d && (g= d,
                                            f= [d[cb(165)][cs(bZ(228), cw(cb(18)))], d[b$(160)][cs(bY(229), cw(bZ(18)))]],
                                            d= cz(cv(b$(-3), cd(64), ca(102)), d),
                                            d ? (dn(a, d, g),
                                                c[4] && (d= c[4].split(cg(bZ(15), 1))),
                                                d && cf(d) == 2 && d[0] > 0 && d[1] > 0 ? cK(l, [cd(19), cs((100 - d[0]) / 2, ca(3)), b$(19), cs((100 - d[1]) / 2, cb(4)), cc(19), cs(d[0], b_(-2)), ca(21), cs(d[1], cc(5))]) : (cK(l, [cb(18), cs(f[0], cd(21)), b$(17), cs(f[1], b$(14))]),
                                                    dc(l, l.parentNode, b_(141))),
                                                cS($),
                                                cD(i, cu(b$(0), cg(cc(97), 0, 2), b_(69))), !c[7] && t && t(),
                                                A || (A= !0,
                                                    cl(function() {
                                                        C.handle(bV[17], a)
                                                    }, 0))) : u ? u() : a == b_(23) && be || a == cb(13) && bf ? (cZ(be, ca(1)),
                                                cZ(bf, b$(-3))) : ds(a)))
                            } catch (h) {
                                C.handle(bV[27], c$([b$(7), a, cd(10), e && e[bY(22)] ? e[bY(22)] : cb(2), b$(11), 10])),
                                    u ? u() : a == ca(28) && be || a == bY(10) && bf || ds(a)
                            }
                        }
                    }),
                    cL(l, cd(18), function(b) {
                        var c= cQ(b);
                        C.handle(bV[27], c$([b$(7), a, cc(9), c && c[b$(20)] ? c[cb(25)] : cd(4), bZ(12), 6])),
                            u ? u() : a == bY(26) && be || a == bZ(9) && bf ? (cZ(be, cd(4)),
                                cZ(bf, b_(-4))) : ds(a)
                    }),
                    d= c[3],
                    d= cs(d, d.indexOf(cb(46)) >= 0 ? cc(64) : cd(48), cc(178), cd(41), encodeURIComponent(document.referrer), ca(62), ca(60), ca(38), ce()),
                    l[cc(26)]= d,
                    cV(m, l)),
                c[18] && (l= cR(cd(64), null, [b_(17), ca(26), cb(58), b$(31), bY(14), 0, cd(26), 0, cd(20), cs(100, ca(3)), bY(19), cs(100, bY(1))]),
                    l[cs(bY(225), cw(bZ(225)))]= 0,
                    l[cd(232)]= ca(163),
                    cV(m, l),
                    d= l[cs(ca(102), cw(bY(128)))],
                    d && d[b_(111)] ? (d[ca(116)].write(cs(cb(97), ct(bY(34), cs(cd(192), b_(33), '"', bY(15), cb(55), 100, bY(1), ";", cd(24), b_(49), 100, cd(6), '"')), cb(98), cd(99), cb(191), cd(100), bZ(93), bY(23), cb(191), b$(93), ca(96), ct(ca(164), cs(b_(184), b$(34), '"', bZ(14), b_(49), 100, cb(4), ";", ca(21), bZ(51), 100, bY(1), ";", bZ(180), cb(55), ca(94), ";", cb(42), cc(56), 0, '"')), bZ(94), bZ(93), cd(182), ca(78), cc(26), bZ(35), '"', c[18], '"', cd(100), bZ(93), b$(21), b_(174), cc(99), bZ(93), b_(20), b$(160), cc(99), bZ(93), bZ(22), cb(37), ca(97))),
                        d[cb(117)].close(),
                        d[cs(b$(30), bZ(11))]= ce(),
                        cl(function() {
                            var b, f= -1,
                                h= -1,
                                n, o, q= [],
                                r= [cs(cw(cb(3)), cw(cc(100))), cs(cw(cd(5)), cw(b$(103))), cs(cw(b_(-3)), cw(bY(203))), cs(cw(cb(3)), cw(b$(290))), cs(cw(cd(5)), cw(bY(154)), cw(bY(117))), cs(cw(b_(-3)), cw(ca(33)), cw(ca(119))), cs(cw(cc(4)), cw(cd(34)), cw(b_(114))), cs(cw(cb(3)), cw(b_(290)), cw(bZ(116))), cs(cw(cd(5)), cw(b$(2)), cw(bY(26))), cs(cw(cd(5)), cw(ca(6)), cw(b_(217)), cw(cc(160))), cs(cw(cd(5)), cw(cd(9)), cw(bZ(293))), cs(cw(bZ(-1)), cw(cd(9)), cw(cd(226)), cw(ca(158))), cs(cw(cd(5)), cw(cd(9)), cw(b_(181))), cs(cw(cd(5)), cw(cc(60))), cs(cw(bZ(-1)), cw(b_(76))), cs(cw(ca(2)), cw(cd(223))), cs(cw(bY(0)), cw(ca(9)), cw(b$(293))), cs(cw(ca(2)), cw(cc(17)))];
                            if (s == a)
                                try {
                                    d= l[cs(bZ(99), cw(bZ(127)))];
                                    if (!d[cs(ca(40), ci(cs(cg(cc(8), 0, 1), cg(bZ(9), 0, 2), cd(47))), cw(ca(2)))]) {
                                        if (d[cs(b_(29), b$(10))] && ce() - d[cs(cc(36), ca(14))] >= 5e3) {
                                            cp(c[21], 901),
                                                C.handle(bV[27], c$([cd(14), a, b_(2), c[18], cd(18), 8])),
                                                u ? u() : ds(a);
                                            return
                                        }
                                        cl(arguments.callee, 100);
                                        return
                                    }
                                    o= d[cs(cc(42), ci(cs(cg(cb(7), 0, 1), cg(b$(8), 0, 2), ca(44))), cw(cc(4)))](),
                                        y= function(b, d, e, f) {
                                            if (!o || !b)
                                                return null;
                                            if (typeof o[b] == ca(32)) {
                                                e && f && (q[e]= !0,
                                                        cl(function() {
                                                            s == a && q[e] && (cp(c[21], 901),
                                                                C.handle(bV[27], c$([b$(7), a, cb(8), c[18], ca(15), 8])),
                                                                u ? u() : ds(a),
                                                                cx(e))
                                                        }, f)),
                                                    b != cs(bY(38), cw(cc(4)), cw(ca(33))) && b != cs(cc(42), cw(b_(-3)), cw(cd(190)), cw(b_(25))) && b != cs(cc(42), cw(cd(5)), cw(cc(227)), cw(bZ(223))) && cy(ct(cs(bZ(106), cs(cg(b$(2), 0, 1), cg(bZ(9), 0, 2), b$(40)), b$(106)), cs(ca(14), b$(50)), b));
                                                return o[b].apply(o, cf(d) ? d : [])
                                            }
                                            return null
                                        },
                                        k[a][20]= y,
                                        z= function(b) {
                                            return function() {
                                                var d, g, j;
                                                q[b] && delete q[b];
                                                if (s == a) {
                                                    cy(ct(cs(ca(109), cs(cg(cd(9), 0, 1), cg(cb(13), 0, 2), cc(46)), cd(113)), cs(bY(50), cc(56)), b));
                                                    try {
                                                        b == r[0] ? y(cs(cb(29), cw(cc(4))), [], cs(cw(b$(-2)), cw(cb(108))), (e[cv(ca(29), cs(bZ(157), 2))] || 2) * 1e3) : b == r[1] ? (p= y(cs(bZ(37), cw(cc(4)), cw(ca(33)))) * 1e3,
                                                            cS($),
                                                            cD(i, cu(cd(7), cg(bZ(92), 0, 2), bZ(71))), !c[7] && t && t(),
                                                            A || (A= !0,
                                                                cl(function() {
                                                                    C.handle(bV[17], a)
                                                                }, 0)),
                                                            g= cs(bZ(140), 0)) : b == r[2] ? (bI= !0,
                                                            u ? u() : ds(a)) : b == r[3] ? (bI= !0,
                                                            u ? u() : ds(a),
                                                            g= cd(45)) : b == r[4] ? y(cs(b_(35), cw(bY(0)), cw(cb(157)))) || (u ? u() : ds(a)) : b == r[5] ? p= y(cs(bY(38), cw(cd(5)), cw(cd(36)))) * 1e3 : b == r[6] ? (f= y(cs(cc(42), cw(ca(2)), cw(b_(26)))), (h > 0 || h == -1) && f == 0 ? g= cc(119) : h == 0 && f > 0 && (g= ca(188)),
                                                            h= f,
                                                            j= !0) : b == r[7] ? (g= n ? b_(60) : cs(b_(110), bY(63)),
                                                            j= !0) : b == r[8] ? g= cs(cd(6), 0) : b == r[9] ? g= cs(bZ(0), 25) : b == r[10] ? g= cs(bZ(0), 50) : b == r[11] ? g= cs(b_(-2), 75) : b == r[12] ? g= cs(cd(6), 100) : b == r[13] ? (g= cc(14),
                                                            j= !0,
                                                            cD(i, cu(bZ(1), ca(2), bZ(55))),
                                                            cE(i, cu(ca(4), b_(-3), bZ(78)))) : b == r[14] ? (g= b$(114),
                                                            j= !0,
                                                            cD(i, cu(cb(5), bY(0), cd(84))),
                                                            cE(i, cu(ca(4), cb(3), bY(56)))) : b == r[15] ? g= cs(cb(143), 0) : b == r[16] ? (arguments[2] && window.open(arguments[0] || c[1], cv(ca(1), bk ? cc(95) : ca(71))),
                                                            cl(function() {
                                                                C.handle(bV[16], a)
                                                            }, 0),
                                                            g= b_(4),
                                                            j= !0) : b == r[17] && cp(c[21], 901)
                                                    } catch (k) {
                                                        cx(k)
                                                    }
                                                    if (g)
                                                        for (d= 0; d < cf(c[21]); d++)
                                                            c[21][d][b$(7)] == g && (j || !c[21][d][ca(4)]) && (co(c[21][d][cb(8)]),
                                                                c[21][d][bY(2)]= !0)
                                                }
                                            }
                                        };
                                    for (b= 0; b < cf(r); b++)
                                        y(cb(299), [z(r[b]), r[b]]);
                                    y(cs(b_(294), cw(cb(301))), [cs(2, cc(50), 0)]),
                                        j= cR(bZ(24), null, [b$(53), cd(38), cd(25), cc(28), cd(19), 0, bZ(20), 0, cc(19), cs(100, bY(1)), cd(24), cs(100, b_(-2)), b$(37), 0]),
                                        g= c[13] || dp(),
                                        cK(g, [cc(24), cd(29), ca(17), cs(100, bY(1)), cd(24), cs(100, cd(6)), b$(228), bY(231)]),
                                        C.listen(bV[18], function(b) {
                                            s == a && (g.volume= b,
                                                y(cs(bZ(298), cw(cc(4)), cw(b_(26))), [Math.round(g.volume * 100)]))
                                        }),
                                        C.listen(bV[19], function(b) {
                                            s == a && (g.muted= b)
                                        }),
                                        C.listen(bV[8], function() {
                                            s == a && (n= !0,
                                                y(cs(b$(187), cw(ca(2))), [0, 0, ca(65)]))
                                        }),
                                        C.listen(bV[9], function() {
                                            s == a && (n= !1,
                                                y(cs(ca(191), cw(b_(-3))), [cH(m)[0], cH(m)[1], bY(232)]))
                                        }),
                                        c[13]= g,
                                        cV(m, g),
                                        cV(m, j),
                                        y(cs(cd(305), cw(bZ(-1))), [cH(m)[0], cH(m)[1], bY(232), 1e3, c$([cs(cw(b_(-3)), cw(cb(158))), c[19] || cc(3)]), c$([bZ(144), j, cs(ca(6), cw(bZ(144))), g, cs(cb(7), cw(b_(142)), cw(cc(305)), cw(ca(103)), cw(bZ(60))), !0])], cs(cw(cb(3)), cw(bZ(95))), (e[cv(bZ(26), cs(bY(158), 1))] || 10) * 1e3)
                                } catch (v) {
                                    cp(c[21], 901),
                                        C.handle(bV[27], c$([bZ(8), a, ca(7), c[18], cb(16), 10])),
                                        u ? u() : ds(a),
                                        cx(v)
                                }
                        }, 100)) : l= null),
                j || l || c[7] ? (s= a,
                    c[7] ? (cV(m, c[7]),
                        cK(c[7], [ca(16), cs(1e4, bY(16)), cc(25), cs(1e4, b_(13))]),
                        cl(function() {
                            cU(c[7]),
                                dc(c[7], c[7].parentNode, bY(144))
                        }, 0),
                        cD(i, cu(bY(2), cg(ca(95), 0, 2), cd(77))),
                        t && t(),
                        A= !0,
                        cl(function() {
                            C.handle(bV[17], a)
                        }, 0)) : (a == cb(9) || a == cd(22) || a == cs(b_(14), ca(12)) || a == b$(47)) && cV(n, $),
                    cU(n),
                    cU(m)) : u && u()
        }
    }

    function dv(a, b, c) {
        var d= function(c) {
            C.handle(bV[27], c$([b_(6), a, bZ(12), 10, b$(3), c.message])),
                cx(c),
                bD= !0,
                cm(n[a]),
                n[a]= null,
                typeof b == cd(35) && cl(function() {
                    b()
                }, 0)
        };
        try {
            a == cb(9) && (cS(be),
                    be= null, !bL && !c && (bw= !0,
                        G.load(null, function() {
                            s == b$(4) ? G.pause(function() {
                                bw= !1,
                                    bQ && k[s][13] && k[s][13].paused && k[s][13].play()
                            }) : bw= !1
                        }))),
                a == cs(cb(20), bY(10)) && (cS(bf),
                    bf= null);
            if (l[a]) {
                var f= 0,
                    g, h, i= l[a][m[a]],
                    j= b ? ba : bc,
                    p= b ? bb : bd,
                    q= function(c, d) {
                        cp(i[cd(42)], d),
                            m[a]++;
                        cf(l[a]) > m[a] ? dv(a, b, !0) : (C.handle(bV[21], c$([cc(13), a, cd(10), i[b$(52)], bY(13), c])),
                            bD= !0,
                            cm(n[a]),
                            n[a]= null,
                            typeof b == cc(34) && cl(function() {
                                b()
                            }, 0))
                    };
                k[a][13]= k[a][13] || dp(),
                    o[a] || (o[a]= []);
                if (i[cc(58)] && o[a].indexOf(i[cc(58)]) == -1)
                    o[a].push(i[ca(56)]),
                    i[bY(54)]= db(i[cd(59)]),
                    s= a, (a == cd(11) || a == cb(20) || a == cs(cb(20), bZ(9))) && cV(p, $),
                    cU(p),
                    cU(j),
                    cm(n[a]),
                    h= n[a]= cl(function() {
                        q(7, 301)
                    }, (e[cv(b$(25), cs(bY(158), 1))] || 10) * 1e3),
                    cr(i[bZ(53)], function(c) {
                        cm(h);
                        if (n[a] == h)
                            try {
                                C.handle(bV[20], c$([bY(9), a, cc(9), i[cd(59)], cc(143), c]));
                                var e, f, g, j;
                                if (!c) {
                                    q(1, 100);
                                    return
                                }
                                e= c_(c);
                                if (e && e[cd(32)]) {
                                    e= e[b_(24)],
                                        e[bZ(12)] && (f= da(e[b_(10)])),
                                        e= e[b$(-2)],
                                        e && !cj(e) && (e= [e]);
                                    if (cf(e) > 0) {
                                        m[a]++;
                                        for (j= cf(e) - 1; j >= 0; j--)
                                            g= du(a, e[j]),
                                            i[cb(40)] && (g[cb(40)]= i[cd(42)].concat(g[bY(37)] || [])),
                                            f && (g[cd(42)]= [c$([b_(6), b$(11), bZ(4), f])].concat(g[cb(40)] || [])),
                                            l[a].splice(m[a], 0, g);
                                        dv(a, b, !0)
                                    } else
                                        q(2, 303)
                                } else
                                    q(1, 101)
                            } catch (k) {
                                d(k)
                            }
                    }, function() {
                        q(3, 301)
                    });
                else {
                    bj && a == bZ(5) && (i[b_(109)] ? (cZ(bj, i[cc(116)]),
                        dB(bj, i[bZ(6)]),
                        bj.getAttribute(cu(b$(63), ca(9))) == b_(15) && delete i[bZ(6)]) : bj= null);
                    if (i[b_(1)] || i[cs(cg(b_(1), 0, 1), cg(ca(159), 0, 2), ca(44))]) {
                        i[cb(7)] ? (k[a][0]= i[b_(1)],
                                k[a][12]= i[ca(39)],
                                i[bY(40)] != undefined ? k[a][9]= b_(-4) + i[bY(40)] : k[a][9]= b_(-4)) : (k[a][18]= i[cs(cg(b$(2), 0, 1), cg(cd(162), 0, 2), ca(44))],
                                k[a][21]= i[cc(41)],
                                k[a][19]= i[b_(152)] || cd(4),
                                k[a][9]= ca(1)),
                            i[bZ(6)] && (k[a][1]= i[b_(4)]),
                            k[a][2]= i[b$(29)],
                            k[a][3]= b_(-4);
                        for (f= 0; f < cf(i[cc(41)]); f++)
                            i[cb(40)][f][cc(13)] == b$(73) && co(i[ca(39)][f][cb(8)]);
                        k[a][14]= !0,
                            k[a][6]= !0,
                            g= !0
                    }
                    if (!g) {
                        q(2, 403);
                        return
                    }
                    dl(a),
                        cm(n[a]),
                        n[a]= null;
                    if (i[bY(88)]) {
                        k[a][15]= !0,
                            dg(function(c) {
                                c ? dw(a, b) : q(10, 403)
                            }, (e[cv(cc(31), cs(cb(161), 1))] || 10) * 1e3);
                        return
                    }
                    dw(a, b)
                }
            } else
                dw(a, b)
        } catch (r) {
            d(r)
        }
    }

    function du(a, b) {
        var c= c$([cb(40), []]),
            d, e, f, g;
        b[bY(54)] && (c[cc(58)]= da(b[cd(59)][cs(ca(29), cc(4), cg(ca(67), 2), cg(bZ(36), 7), cg(b$(3), 0, 2), cg(cc(116), 1, 2))])),
            b= b[cc(221)] || b[cc(58)];
        if (b) {
            b[cd(18)] && c[ca(39)].push(c$([cc(13), cb(16), cd(10), da(b[b_(10)])])),
                c[cb(115)]= da(b[cs(bZ(-1), bZ(111))]),
                d= b[b_(215)];
            if (d) {
                cj(d) || (d= [d]);
                for (g= 0; g < cf(d); g++)
                    e= c$([bY(9), cs(b$(138), 0), b$(3), da(d[g])]),
                    e[ca(7)] && e[cc(9)].indexOf(cs(cg(cd(38), 4, 5), cg(bY(14), 1, 2), cg(b_(55), 0, 2), cg(bZ(125), 0, 2), cg(cd(29), 6, 8))) > 0 && (p[a]= !0),
                    c[bY(37)].push(e)
            }
            b= b[cs(cb(186), cg(cc(31), 2, 3))];
            if (b) {
                b= b[bZ(182)];
                if (b) {
                    if (cj(b))
                        for (g= 0; g < cf(b); g++)
                            if (b[g][bZ(153)]) {
                                b= b[g];
                                break
                            }
                    b= b[cc(158)];
                    if (b) {
                        c[ca(33)]= dd(da(b[cd(36)])) || 10,
                            b[cs(cc(90), b$(85))] && (d= b[cs(b$(84), bZ(86))][cs(b_(37), b$(217))] || cc(3),
                                d.indexOf(cb(4)) > 0 ? c[cb(43)]= parseInt(d) / 100 * c[b$(29)] : cf(d) && (c[cd(45)]= dd(d))),
                            d= b[cs(cc(8), cc(11), cg(bY(27), 2, 3))];
                        if (d) {
                            c[b$(5)]= da(d[cs(cd(12), cb(283))]),
                                d= d[cs(b$(5), ca(39))];
                            if (d) {
                                cj(d) || (d= [d]);
                                for (g= 0; g < cf(d); g++)
                                    c[b$(35)].push(c$([bZ(8), bZ(6), b_(2), da(d[g])]))
                            }
                        }
                        d= b[cs(cb(3), cd(160))],
                            d && (c[bZ(154)]= da(d)),
                            d= b[cs(bY(37), bZ(49), cg(b_(24), 2, 3))];
                        if (d) {
                            d= d[bZ(36)];
                            if (d) {
                                cj(d) || (d= [d]);
                                for (g= 0; g < cf(d); g++)
                                    if (d[g][cs(ca(88), cc(91))]) {
                                        e= d[g][cs(b_(83), ca(89))][b$(48)];
                                        if (e) {
                                            switch (e) {
                                                case bZ(25):
                                                    e= cs(ca(3), 0);
                                                    break;
                                                case cs(ca(185), cw(cd(286))):
                                                    e= cs(b_(138), 0);
                                                    break;
                                                case cs(cc(224), cw(bZ(155))):
                                                    e= cs(b_(-2), 25);
                                                    break;
                                                case cs(cb(285), cc(287)):
                                                    e= cs(cb(4), 50);
                                                    break;
                                                case cs(bZ(220), cw(bZ(155))):
                                                    e= cs(b$(-1), 75);
                                                    break;
                                                case bZ(183):
                                                    e= cs(b_(-2), 100);
                                                    break;
                                                case cc(67):
                                                    e= ca(65);
                                                    break;
                                                case cs(b$(111), cw(bZ(62))):
                                                    e= cs(bY(113), b$(61));
                                                    break;
                                                case cc(88):
                                                    f= d[g][cs(bZ(85), b$(85))][bZ(218)],
                                                        f && f.indexOf(ca(3)) > 0 ? e= cs(b_(-2), f.substr(0, f.indexOf(ca(3)))) : f && f.indexOf(cd(51)) > 0 ? e= f.substr(0, f.indexOf(ca(48))) : e= f
                                            }
                                            c[b$(35)].push(c$([cc(13), e, b$(3), da(d[g])]))
                                        }
                                    }
                            }
                        }
                        b= b[cs(cb(183), ca(224), cg(ca(29), 2, 3))];
                        if (b) {
                            b= b[cs(b$(178), bY(222))];
                            if (b) {
                                cj(b) || (b= [b]);
                                for (g= 0; g < cf(b); g++) {
                                    d= b[g][cs(b$(84), bZ(86))];
                                    if (d) {
                                        if (ch(d[cs(ca(73), cg(ca(61), 1), cd(289))] || cb(2)) == cs(cg(cb(7), 0, 1), cg(bY(157), 0, 2), b$(40))) {
                                            c[cs(cg(cc(8), 0, 1), cg(bY(157), 0, 2), b$(40))]= da(b[g]);
                                            break
                                        }
                                        if (ch(d[b_(6)] || cd(4)) == cs(cb(7), bY(23), cc(115))) {
                                            c[cd(9)]= da(b[g]);
                                            break
                                        }
                                        if (ch(d[cc(13)] || cd(4)).indexOf(b_(206)) > 0) {
                                            c[bY(4)]= da(b[g]),
                                                c[b_(85)]= !0;
                                            break
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return c
    }

    function dt(a) {
        if (a && s == a && k[a]) {
            var b= k[a][20],
                c= k[a][13];
            b ? cC(i, cu(bZ(1), cc(4), cc(60))) || b(cs(cb(13), cw(bY(0)))) : c && (c.pause(),
                cD(i, cu(cd(7), b$(-2), bZ(55))),
                cE(i, cu(ca(4), b_(-3), ca(81))))
        }
    }

    function ds(a) {
        a && s == a && (cZ(k[a][7]) && cS(k[a][7]),
            k[a][13] && k[a][13].pause(),
            cT(be),
            cT(bf),
            cZ(be, ca(1)),
            cZ(bf, bY(-1)),
            cT(bb),
            cZ(bb, b$(-3)),
            cT(ba),
            cZ(ba, ca(1)),
            cT(bd),
            cZ(bd, ca(1)),
            cT(bc),
            cZ(bc, cd(4)),
            cE(i, cu(bY(2), cg(bY(93), 0, 2), bZ(71))),
            P && Q && P.parentNode != J && cX(Q, P),
            s= null)
    }

    function dr(a) {
        var b= cb(52);
        k[b]= [a[cv(cd(54), b$(20))] || ca(1), cd(4), bZ(-2), cb(2), b_(-4), bZ(-2)],
            k[b][6]= !!k[b][0]
    }

    function dq(a, b) {
        if (!!a && !!cf(b)) {
            var c, d, e;
            for (c= 0; c < cf(b); c++) {
                if (b[c] == cb(29) && bx)
                    continue;
                k[b[c]]= [a[cv(ca(13), b[c], cd(27))] || cb(2), a[cv(b$(9), b[c], b$(3))] || bZ(-2), a[cv(cb(14), b[c], cc(35))] || bY(-1), a[cv(bZ(10), b[c], bZ(33))] || b_(-4), a[cv(bZ(10), b[c], cd(39), b_(273))] || cd(4), a[cv(b_(8), b[c], ca(36), ca(44))] || bZ(-2), !1, null, a[cv(bZ(10), b[c], cb(34), cb(50))] || ca(1), a[cv(cd(16), b[c], cc(44), b_(28))] || b$(-3), a[cv(bY(11), b[c], cb(43), cd(52))], a[cv(b$(9), b[c], bY(40), ca(49), cb(31))],
                        [], null, !1, null, null, null, null, null, null, []
                    ],
                    k[b[c]][6]= !!(k[b[c]][0] || k[b[c]][3] || k[b[c]][5]),
                    k[b[c]][5] && (k[b[c]][7]= cz(k[b[c]][5]),
                        dn(b[c], k[b[c]][7], document));
                if (a[cv(cd(16), b[c], cd(32))]) {
                    d= !0,
                        e= ch(navigator.userAgent),
                        e.indexOf(bY(277)) >= 0 && (e.indexOf(b_(275)) < 0 || e.indexOf(cb(282)) >= 0) && (bL= !0,
                            d= !1);
                    if (d) {
                        k[b[c]][0]= k[b[c]][1]= k[b[c]][2]= k[b[c]][3]= k[b[c]][4]= k[b[c]][5]= k[b[c]][7]= bZ(-2),
                            l[b[c]]= [],
                            d= a[cv(cb(14), b[c], bZ(26))].split("|");
                        for (e= 0; e < cf(d); e++)
                            l[b[c]].push(c$([cd(59), d[e]]));
                        m[b[c]]= 0;
                        if (a[cv(b$(9), b[c], cb(30), cb(149))]) {
                            d= a[cv(b_(8), b[c], cd(32), b$(144))].split("|");
                            for (e= 0; e < cf(d); e++)
                                l[b[c]].push(c$([ca(56), d[e]]))
                        }
                        k[b[c]][6]= !0
                    }
                }
                b[c] == cc(10) && !br && bM && C.handle(bV[10]) == cc(22) && (by ? (cE(i, cu(bY(2), cs(cb(69), bY(216)))),
                    cD(i, cu(ca(4), cs(bY(66), bZ(152)))),
                    C.handle(bV[11])) : bx || (cS(be),
                    be= dm(null, 160),
                    cL(be, b_(4), function(a) {
                        cQ(a) == be && (cO(a),
                            C.handle(bV[11]))
                    }),
                    cV(I, be),
                    cU(be)))
            }
        }
    }

    function dp() {
        var a= cR(cc(8), null, [bY(55), cb(36)]);
        a.controls= !1,
            a.setAttribute(cu(bZ(274), ca(217)), b$(16)),
            a.setAttribute(b$(213), bZ(17)),
            a.muted= C.muted(),
            a.volume= C.volume() || ck(b_(26)) || .5, !bL && G && G.video && G.video.src && (a.src= G.video.src,
                a.load());
        return a
    }

    function dn(a, b, c) {
        var d, e, f;
        if (!!a && !!b) {
            d= cF(b, cu(b_(5), bZ(70), bZ(126), ca(28)));
            for (e= 0; e < cf(d); e++)
                cL(d[e], cb(10), function(a) {
                    be ? C.handle(bV[11]) : bf ? C.handle(bV[23]) : C.toggle(),
                        cO(a)
                });
            d= cF(b, cu(bZ(7), cd(76), ca(129), b_(37)));
            for (e= 0; e < cf(d); e++)
                cL(d[e], bY(7), function(b) {
                    C.handle(bV[26], a),
                        a == cb(9) ? (bD= !0,
                            bI= !0,
                            C.handle(bV[12])) : a == cc(21) ? C.handle(bV[15]) : a == cs(b$(15), cc(14)) && (bD= !0,
                            bI= !0,
                            C.handle(bV[24])),
                        cO(b)
                });
            d= cB(b, cg(b_(50), 5, 6));
            for (e= 0; e < cf(d); e++)
                !cC(d[e], cu(cc(12), bZ(70), cd(132), ca(28))) && !cC(d[e], cu(b_(5), cc(75), b_(124), b_(37))) && (cL(d[e], b$(5), function() {
                        try {
                            cl(function() {
                                C.handle(bV[16], a)
                            }, 0)
                        } catch (b) {}
                    }),
                    d[e][b_(87)] || (d[e][bZ(89)]= cv(b$(-3), bk ? cd(96) : b_(66))));
            d= cB(b, ca(61)),
                cf(d) > 0 && c && setInterval(function() {
                    if (!f) {
                        var b= c.activeElement;
                        b && b.tagName == ci(cb(62)) && (f= !0,
                            C.handle(bV[16], a))
                    }
                }, 100)
        }
    }

    function dm(a, b) {
        var c= cR(ca(27), a, [bY(20), cb(27), ca(16), 0, cc(25), 0, bZ(43), 0, cd(83), 0, cc(185), b_(89)]);
        b > 0 && cK(c, [cs(cd(156), cw(cc(156))), b]),
            a || cK(c, [b$(212), bY(274)]),
            cL(c, cs(bZ(61), bZ(181)), function(a) {
                a.stopPropagation()
            }),
            cT(c);
        return c
    }

    function dl(a) {
        var b= e[cs(cg(bY(89), 2), cg(b$(97), 9), cg(ca(24), 2), cg(b_(86), 0, 1))],
            c= cb(2),
            d, f= [],
            g= bZ(-2),
            h, i;
        if (b) {
            c= cg(b, 0, 10),
                d= cg(G.conf[cs(cg(bZ(32), 4, 5), cg(cd(19), 1, 2), cg(b$(59), 3, 4))], 1),
                f.push(cg(c, d.length - c.length) + c),
                f.push(c + cg(c, 0, d.length - c.length)),
                g= cc(3);
            for (i= 0; i < f.length; i++) {
                g= cc(3);
                for (h= 0; h < d.length; h++) {
                    var j= parseInt(cg(d, h, h + 1)) + parseInt(cg(f[i], h, h + 1));
                    j >= 10 && (j -= 10),
                        g += bZ(-2) + j
                }
                d= g
            }
        }
        (!b || b != c + g || parseInt(c) < G[cs(cg(b$(28), 4, 6), cg(b_(177), 0, 2))]) && k[a] && k[a][6] && !p[a] && (k[a][18] ? k[a][6]= k[a][18] && k[a][18].indexOf(cs(cg(b$(31), 4, 5), cg(b$(12), 1, 2), cg(bY(58), 0, 2), cg(bZ(125), 0, 2), cg(bY(24), 6, 8))) > 0 : k[a][6]= k[a][1] && k[a][1].indexOf(cs(cg(cc(37), 4, 5), cg(cd(19), 1, 2), cg(cd(63), 0, 2), cg(cb(129), 0, 2), cg(cd(29), 6, 8))) > 0)
    }

    function dk() {
        if (bB && G) {
            cD(i, cu(cb(5), cc(215)));
            var a= {
                sources: [{
                    type: bB[1],
                    src: bB[0]
                }]
            };
            if (e[bZ(69)]) {
                var b= {};
                b[cd(181)]= !0,
                    b[cc(216)]= cc(74),
                    b[cs(cb(25), ca(152))]= e[cv(b$(68), cd(155))] || bY(213),
                    b[b_(19)]= e[cc(74)],
                    a[cd(75)]= [b]
            }
            G.load(a)
        }
    }

    function dj() {
        var a, b;
        if (z && cf(z) > 1) {
            V || (V= cR(cg(bZ(52), 7), cu(cd(8), ca(79))),
                    cX(P, V),
                    cL(V, b_(4), function(a) {
                        try {
                            if (z && cf(z) > 1) {
                                var b= cQ(a),
                                    c;
                                if (b && b.hasAttribute(cu(b$(63), b$(95)))) {
                                    cO(a),
                                        c= parseInt(b.getAttribute(cu(bZ(64), bY(97))));
                                    if (c && cf(z) >= c) {
                                        A= z[c - 1];
                                        if (C.handle(bV[7], A[2]) != b$(16)) {
                                            if (!A[5]) {
                                                for (bv= cf(z) - 1; bv >= 0; bv--)
                                                    z[bv][5]= !1;
                                                A[5]= !0,
                                                    bB= A,
                                                    bC= Math.floor(G[cc(8)][bZ(27)]),
                                                    G.playing ? (bt= !0,
                                                        G.pause(dk)) : dk(),
                                                    dj()
                                            }
                                        } else
                                            G && G.playing && G.pause()
                                    }
                                    cE(i, cu(b$(0), cd(82), cc(52)))
                                }
                            }
                        } catch (d) {}
                    })),
                cE(V, cu(b_(-1), bY(148))),
                cE(V, cu(bY(2), cd(152))),
                W || (W= cR(b$(23), cu(cd(8), b_(74), bZ(148))),
                    cV(V, W)),
                cZ(W, ca(1));
            for (bv= cf(z) - 1; bv >= 0; bv--)
                A= z[bv],
                a= cR(bY(25), cu(cd(8), bZ(76), bZ(148), cd(184))),
                b= cR(cg(bY(53), 3, 4)),
                cZ(b, A[2]),
                A[3] ? (b[bY(51)]= A[0],
                    b[cb(93)]= cv(cd(4), bk ? cc(95) : b_(66)),
                    cL(b, bY(7), function(a) {
                        try {
                            G && G.playing && G.pause(),
                                cE(i, cu(cb(5), ca(79), ca(50))),
                                C.handle(bV[7], cZ(cQ(a))) == b$(16) && cO(a)
                        } catch (b) {}
                    })) : b.setAttribute(cu(cb(68), cd(102)), cs(bZ(-2), bv + 1)),
                A[4] == 2 ? cD(a, cu(bZ(1), b_(144))) : A[4] == 1 && cD(a, cu(ca(4), cb(151))),
                A[5] && (cD(a, cu(bZ(1), b$(122))),
                    A[4] == 2 ? cD(V, cu(cd(7), b$(145))) : A[4] == 1 && cD(V, cu(cd(7), b_(145)))),
                cV(a, b),
                cV(W, a)
        } else
            V && (cS(V),
                V= W= null)
    }

    function di() {
        var a, b, c= [bZ(266), b_(265), bZ(209), cc(273), cb(273), b$(269), cc(276)];
        X || (X= cR(b$(176), cu(bZ(2), bZ(40))),
                cX(P, X),
                cL(X, cc(11), function(a) {
                    var b= cQ(a),
                        c= b.getAttribute(cu(cc(69), b_(38)));
                    b && c && (G && (G.speed(c),
                            localStorage.setItem(cc(45), c),
                            B= c),
                        cE(i, cu(bY(2), bZ(40), b$(46))),
                        di())
                })),
            Y || (Y= cR(cb(28), cu(cc(7), cb(44), cc(153)))),
            cZ(X, cd(278) + B),
            cV(X, Y),
            cZ(Y, ca(1));
        for (bv= cf(c) - 1; bv >= 0; bv--)
            a= cR(cc(29), cu(bY(3), ca(43), cb(152), bY(179))),
            b= cR(cg(cc(57), 3, 4)),
            cZ(b, c[bv]),
            b.setAttribute(cu(bZ(64), b_(38)), cs(b_(-4), c[bv])),
            B == c[bv] && cD(a, cu(ca(4), b_(121))),
            cV(a, b),
            cV(Y, a)
    }

    function dh(a) {
        cE(i, cu(cb(5), b$(87), bY(109))),
            a > 0 ? a < .25 ? cD(i, cu(bZ(1), ca(91), 25)) : a < .5 ? cD(i, cu(b_(-1), b_(86), 50)) : a < .75 && cD(i, cu(b_(-1), ca(91), 75)) : cD(i, cu(b$(0), cc(93), 0)),
            cK(T, [cd(24), cs(Math.round(a * 100), cc(5))])
    }

    function dg(a, c) {
        var d= cR(cd(9)),
            e= ce(),
            f= function() {
                typeof window[cw(cc(92))] == ca(32) ? a(!0) : ce() - e > c ? a(!1) : cl(f, 50)
            };
        d.canPlayType && !d.canPlayType(cs(cc(266), cb(26), cb(266), cd(51), ca(266), bZ(45), b_(206))) ? (d= cR(bZ(176)),
            d[b_(19)]= cs(cg(b, 0, b.lastIndexOf(ca(25))), cb(26), cc(92), cd(51), b$(263), b_(43), cc(270)),
            cV(document.body, d),
            cl(f, 50)) : a(!0)
    }

    function df(a) {
        z= [];
        if (!!a) {
            var b, c= cv(cb(7), b_(2)),
                d, e, f, g= !1,
                h= parseInt(a[cv(cb(179), ca(147))]) || 1,
                i, j;
            f= ck(cv(cs(cc(36), cc(16)), cc(128), bY(97))),
                a[cv(cd(45), cb(127), bZ(96))] == bY(18) && (f= null),
                a[cc(62)] && (i= ce(),
                    bK && (j= ck(cs(cn(), cd(148), cb(61))),
                        j && i - j < 36e5 && (i= j),
                        sessionStorage.setItem(cs(cn(), cb(146), bZ(57)), i)));
            for (b= 0; b <= 7; b++)
                b > 0 && (c= cv(ca(6), bY(146), bY(5)),
                    b > 1 && (c += b)),
                a[c] && (d= a[c],
                    e= [d, d.toLowerCase().indexOf(cs(cb(49), b_(95))) > 0 ? cs(bY(4), bY(23), cc(129)) : cs(ca(6), cd(28), cd(116)), a[c + cv(bY(-1), b_(44))] || cd(4), a[c + cv(bY(-1), cc(265))] || 0, (a[c + cv(cc(3), cd(152))] ? 2 : a[c + cv(cd(4), bY(148))] ? 1 : 0) || 0, f ? f == a[c + cv(b_(-4), b_(44))] : !1],
                    i && (e[0]= cs(d, d.indexOf(b$(41)) >= 0 ? bY(60) : ca(45), b$(56), cb(39), i)),
                    z.push(e),
                    e[5] && (g= !0,
                        e[3] && (e[5]= !1,
                            g= !1)));
            !g && cf(z) > 0 && (h > cf(z) && (h= 1),
                z[h - 1][5]= !0)
        }
    }

    function de(a) {
        function d(a) {
            a= parseInt(a, 10);
            return a >= 10 ? a : cs(0, a)
        }
        a= a || 0;
        var b= Math.floor(a / 3600),
            c= Math.floor(a / 60);
        a= a - c * 60;
        if (b >= 1) {
            c -= b * 60;
            return cs(b, bZ(51), d(c), cd(57), d(a))
        }
        return cs(d(c), cb(55), d(a))
    }

    function dd(a) {
        if (a && typeof a.split == b$(28)) {
            a= a.split(bZ(51));
            if (cf(a) == 3)
                return parseInt(a[0]) * 3600 + parseInt(a[1]) * 60 + parseInt(a[2]);
            if (cf(a) == 2)
                return parseInt(a[0]) * 60 + parseInt(a[1]);
            if (cf(a) == 1)
                return parseInt(a[0])
        }
        return 0
    }

    function dc(a, b, c) {
        if (!!a && !!b) {
            var d= cH(b),
                e, f, g;
            a.width && a.height ? (e= [a.width, a.height],
                    a.tagName && ch(a.tagName) == b$(57) && (e= cH(a))) : e= cH(a),
                c == b$(173) && e[1] / e[0] > 1 && d[1] / d[0] < 1 && (c= cb(126)),
                c == ca(146) ? cK(a, [cb(23), cc(28), b$(12), cs(50, ca(3)), cd(26), cs(50, cc(5)), ca(41), 0, cs(b_(36), cw(cc(18))), cs(-e[0] / 2, ca(18)), cs(cc(43), cw(ca(23))), cs(-e[1] / 2, bY(16))]) : c == cc(127) ? e[0] / e[1] > d[0] / d[1] ? (f= e[1] * d[0] / e[0] / d[1] * 100,
                    cK(a, [cc(24), bY(24), cd(19), 0, bY(21), cs((100 - f) / 2, bY(1)), b_(12), cs(100, b$(-1)), b_(16), cs(f, bY(1)), ca(41), 0])) : (g= e[0] * d[1] / e[1] / d[0] * 100,
                    cK(a, [cc(24), cc(28), cb(17), cs((100 - g) / 2, bY(1)), cd(26), 0, cc(19), cs(g, bZ(0)), b_(16), cs(100, cc(5)), ca(41), 0])) : c == bY(175) ? e[0] / e[1] > d[0] / d[1] ? (g= e[0] * d[1] / e[1] / d[0] * 100,
                    cK(a, [bZ(19), bY(24), b$(12), cs((100 - g) / 2, cb(4)), cd(26), 0, cd(20), cs(g, cc(5)), cb(22), cs(100, ca(3)), cb(42), 0])) : (f= e[1] * d[0] / e[0] / d[1] * 100,
                    cK(a, [bZ(19), bY(24), bY(14), 0, bZ(20), cs((100 - f) / 2, b_(-2)), b$(13), cs(100, cc(5)), cc(23), cs(f, cb(4)), b$(37), 0])) : cK(a, [bZ(19), bY(24), cb(17), 0, cc(25), 0, cb(18), cs(100, b_(-2)), cc(23), cs(100, b$(-1)), cb(42), 0])
        }
    }

    function db(a) {
        if (!a)
            return a;
        var b= 0,
            c= cH(i),
            d= [ca(17), c[0], cc(23), c[1], cd(265), window.location.hostname || bZ(-2), cd(63), ce(), cc(9), window.location.href || cd(4), cd(179), document.referrer || b$(-3), bZ(27), Math.floor(ce() / 1e3), b$(205), e[cv(cd(9), bZ(206))] || b_(-4), cd(213), e[cv(b$(2), bY(208))] || cd(4)];
        while (b < cf(d))
            b <= cf(d) && (a= a.replace(cv(cc(3), cb(2), d[b], bY(-1), cd(4)), encodeURIComponent(d[++b])),
                b++);
        return a
    }

    function da(a) {
        if (a)
            return a[cs(bZ(142), cc(177))];
        return ca(1)
    }

    function c_(a) {
        var b= {},
            c, d, e= cd(4),
            f= !1,
            g= 0,
            h= 0;
        if (!a)
            return b;
        if (a.nodeType == 1) {
            if (cf(a.attributes) > 0) {
                b[cs(ca(88), ca(89))]= {};
                for (h= 0; h < cf(a.attributes); h++) {
                    var i= a.attributes.item(h);
                    b[cs(cc(90), cc(91))][ch(i.nodeName)]= i.nodeValue
                }
            }
        } else if (a.nodeType == 3 || a.nodeType == 4)
            return a.nodeValue;
        if (a.hasChildNodes()) {
            for (g= 0; g < cf(a.childNodes); g++) {
                c= a.childNodes.item(g),
                    d= ch(c.nodeName);
                if (c.nodeType == 3 || c.nodeType == 4)
                    e += (c.nodeValue || cc(3)).trim();
                else {
                    f= !0;
                    if (typeof b[d] == bY(138))
                        b[d]= c_(c);
                    else {
                        if (typeof b[d].push == bZ(137)) {
                            var j= b[d];
                            b[d]= [],
                                b[d].push(j)
                        }
                        b[d].push(c_(c))
                    }
                }
            }
            f || (b[cs(ca(145), cb(176))]= e)
        }
        return b
    }

    function c$(a) {
        if (!cf(a))
            return {};
        var b= 0,
            c= {};
        while (b < cf(a))
            b <= cf(a) && (c[a[b]]= a[++b],
                b++);
        return c
    }

    function cZ(a, b) {
        if (!a)
            return cc(3);
        typeof b != bZ(137) && (a.innerHTML= b);
        return a.innerHTML
    }

    function cY(a, b) {
        !!a && !!b && a.parentNode.insertBefore(b, a)
    }

    function cX(a, b) {
        !!a && !!b && a.parentNode.insertBefore(b, a.nextSibling)
    }

    function cW(a, b) {
        !!a && !!b && b.parentNode != a && (a.firstChild ? a.insertBefore(b, a.firstChild) : a.appendChild(b))
    }

    function cV(a, b) {
        !!a && !!b && b.parentNode != a && a.appendChild(b)
    }

    function cU(a) {
        !a || cK(a, [ca(57), bZ(32)])
    }

    function cT(a) {
        !a || cK(a, [bZ(54), bY(110)])
    }

    function cS(a) {
        !!a && !!a.parentNode && a.parentNode.removeChild(a)
    }

    function cR(a, b, c) {
        var d= g.createElement(ci(a ? a : ca(27)));
        b && (d[cs(ca(87), cw(b$(66)))]= b),
            cK(d, c);
        return d
    }

    function cQ(a) {
        a= a || window.event;
        return a.srcElement || a.target
    }

    function cP(a, b) {
        a= a || window.event;
        var c= a.clientX || (a.changedTouches ? a.changedTouches[0].clientX : 0),
            d= a.clientY || (a.changedTouches ? a.changedTouches[0].clientY : 0),
            e;
        if (b) {
            e= b.getBoundingClientRect();
            return [c - e.left, d - e.top]
        }
        return [c, d]
    }

    function cO(a) {
        a= a || window.event,
            a.preventDefault ? a.preventDefault() : a.returnValue= !1;
        return !1
    }

    function cN(a, b, c) {
        if (!!a)
            for (var d= 0; d < cf(b); d++)
                cL(a, b[d], c)
    }

    function cM(a, b, c) {
        !a || !b || !c || (a.removeEventListener ? a.removeEventListener(b, c, !1) : a.detachEvent && a.detachEvent(ca(144) + b, c))
    }

    function cL(a, b, c) {
        !a || !b || !c || (a.addEventListener ? a.addEventListener(b, c, !1) : a.attachEvent ? a.attachEvent(cc(146) + b, c) : a[ca(144) + b]= c,
            a == g && h.push([b, c]))
    }

    function cK(a, b) {
        if (!!a && !!cf(b)) {
            var c= 0,
                d= {};
            while (c < cf(b))
                c <= cf(b) && (d[b[c]]= b[++c],
                    c++);
            cJ(a, d)
        }
    }

    function cJ(a, b) {
        if (!!a && !!b)
            for (var c in b)
                a.style[c]= b[c]
    }

    function cI(a) {
        if (!a)
            return [0, 0];
        var b= 0,
            c= 0;
        if (a && a.offsetParent)
            while (a)
                b += a.offsetLeft,
                c += a.offsetTop,
                a= a.offsetParent;
        return [b, c]
    }

    function cH(a) {
        if (!a)
            return [0, 0];
        return [a.offsetWidth, a.offsetHeight]
    }

    function cG(a, b) {
        return cA(cF(a, b))
    }

    function cF(a, b) {
        var c= [],
            d= !0,
            e, f;
        if (!a || !b)
            return c;
        b.indexOf(bZ(108)) > 0 && (b= cg(b, 0, b.indexOf(b_(106))),
                d= !1),
            e= cB(a, cd(114));
        for (f= 0; f < cf(e); f++)
            cC(e[f], b, !d) && c.push(e[f]);
        return c
    }

    function cE(a, b) {
        if (!!a)
            try {
                var c= a[cs(cb(88), cw(cb(71)))].split(bZ(75)),
                    d= cb(2),
                    e= !1,
                    f;
                b.indexOf(cd(114)) > 0 && (b= cg(b, 0, b.indexOf(bY(109))),
                    e= !0);
                for (f= 0; f < cf(c); f++)
                    e && c[f].indexOf(b) !== 0 ? d += cc(80) + c[f] : !e && c[f] != b && (d += cb(79) + c[f]);
                a[cs(ca(87), cw(bY(68)))]= d.trim()
            } catch (g) {
                cy(g)
            }
    }

    function cD(a, b) {
        !a || cC(a, b, !1) || (cf(a[cs(b_(82), cw(b$(66)))]) == 0 ? a[cs(cb(88), cw(cd(73)))]= b : a[cs(bY(85), cw(b$(66)))] += bZ(75) + b)
    }

    function cC(a, b, c) {
        if (!a)
            return !1;
        try {
            var d= a[cs(bZ(84), cw(cb(71)))].split(bY(76)),
                e;
            for (e= 0; e < cf(d); e++) {
                if (c && d[e].indexOf(b) === 0)
                    return !0;
                if (d[e] == b)
                    return !0
            }
        } catch (f) {
            cy(f)
        }
        return !1
    }

    function cB(a, b) {
        if (!a || !b)
            return [];
        return a.getElementsByTagName(b)
    }

    function cA(a) {
        if (cf(a) > 0)
            return a[0];
        return null
    }

    function cz(a, b) {
        b || (b= g);
        return b.getElementById(a)
    }

    function cy(a) {
        bH[cd(56)].indexOf(cs(b$(10), bZ(258), cb(39), bY(18))) > 0 && console && typeof console.log == ca(32) && console.log(a)
    }

    function cx(a) {
        console && typeof console.error == bZ(29) && console.error(a)
    }

    function cw() {
        var a= Array.prototype.slice.call(arguments),
            b;
        for (b= 0; b < cf(a); b++)
            a[b]= ci(a[b].charAt(0)) + a[b].slice(1);
        return a.join(ca(1))
    }

    function cv() {
        var a= Array.prototype.slice.call(arguments);
        return a.join(bY(141))
    }

    function cu() {
        var a= Array.prototype.slice.call(arguments);
        return a.join(b_(137))
    }

    function ct() {
        var a= Array.prototype.slice.call(arguments);
        return a.join(cc(80))
    }

    function cs() {
        var a= Array.prototype.slice.call(arguments);
        return a.join(cb(2))
    }

    function cr(a, b, c) {
        if (!!a && !!b) {
            var d= new XMLHttpRequest;
            d.withCredentials= !0,
                d.onreadystatechange= function() {
                    this.readyState === 4 && (this.status >= 400 ? c && c() : b(this.responseXML))
                },
                d.open(cd(43), a, !0),
                d.send()
        }
    }

    function cq(a, b, c) {
        if (!!a && !!b) {
            var d= new XMLHttpRequest;
            d.onreadystatechange= function() {
                    this.readyState === 4 && (this.status >= 400 ? c && c() : b(this.responseText))
                },
                d.open(bZ(37), a, !0),
                d.send()
        }
    }

    function cp(a, b) {
        if (a) {
            b || (b= 900);
            for (var c= 0; c < cf(a); c++)
                a[c][b_(6)] == bZ(12) && a[c][cc(9)] && co(a[c][bY(5)].replace(cs(cc(111), ci(cd(18)), ci(bY(139)), bZ(107)), b))
        }
    }

    function co(a, b, c) {
        var d= new Image;
        b && cL(d, cc(79), b),
            c && cL(d, b$(11), b),
            a && (d.src= a);
        return d
    }

    function cn(a) {
        a && (window.top ? window.top.location= a : window.location= a);
        return window.location
    }

    function cm(a) {
        a && clearTimeout(a)
    }

    function cl(a, b) {
        if (a)
            return setTimeout(a, b);
        return null
    }

    function ck(a) {
        var b= null;
        try {
            bK && (b= localStorage.getItem(a),
                b || (b= sessionStorage.getItem(a)))
        } catch (c) {}
        b || (b= bY(-1));
        return b
    }

    function cj(a) {
        return a && Array.isArray(a)
    }

    function ci(a) {
        if (a && typeof a.toUpperCase == b_(27))
            return a.toUpperCase();
        return cb(2)
    }

    function ch(a) {
        if (a && typeof a.toLowerCase == bZ(29))
            return a.toLowerCase();
        return cd(4)
    }

    function cg(a, b, c) {
        if (a && typeof a.substring == cc(34))
            return a.substring(b, c);
        return ca(1)
    }

    function cf(a) {
        if (a)
            return a.length;
        return 0
    }

    function ce() {
        return (new Date).getTime()
    }

    function cd(a) {
        return f[a - 4]
    }

    function cc(a) {
        return f[a - 3]
    }

    function cb(a) {
        return f[a - 2]
    }

    function ca(a) {
        return f[a - 1]
    }

    function b_(a) {
        return f[a + 4]
    }

    function b$(a) {
        return f[a + 3]
    }

    function bZ(a) {
        return f[a + 2]
    }

    function bY(a) {
        return f[a + 1]
    }
    var f= ["", "ad", "%", "is", "fp", "video", "url", "pre", "click", "kt", "type", "pause", "adv", "player", "error", "left", "width", "px", "post", "true", "height", "position", "top", "src", "/", "absolute", "div", "start", "vast", "time", "volume", "function", "duration", "kvs", "block", "html", "logo", "=", "tracking", "get", "margin", "skip", "speed", "id", "?", "bottom", "timeline", ".", "text", "open", "related", "event", "href", ":", "metadata", "wrapper", "display", "paused", "roll", "rnd", "iframe", "&", "play", "touch", "fullscreen", "popunder", "data", "mouse", "reporting", "name", "blank", "subtitles", "api", "visible", "screen", "advertising", "load", " ", "settings", "right", "playing", "ui", "hide", "embed", "false", "progress", "class", "@", "attributes", "hls", "vol", "target", "parent", "hidden", "adzone", "<", ">", "loaded", "format", "flv", "controlbar", "content", "auto", "float", "key", "preview", "started", "full", "[", "]", "*", "none", "mp4", "title", "exit", "document", "mute", "resume", "change", "preload", "pt", "screens", "down", "muted", "match", "selected", "flash", "elapsed", "btn", "window", "visibility", "css", "move", "m", "after", "engine", "stream", "flowplayer", "finished", "undefined", "code", "-", "_", "on", "#", "preserve", "slot", "alt", "4k", "hd", "list", "lang", "z", "index", "over", "linear", "parameters", "quartile", "padding", "timeout", "img", "catch", "no", "body", "transition", "string", "ads", "fade", "controls", "stop", "waiting", "protect", "before", "show", "value", "referer", "fill", "default", "script", "a", "item", "media", "overflow", "end", "creative", "complete", "remaining", "unmute", "style", "head", "resize", "brand", "clip", "autoplay", "splash", "poster", "ready", "seek", "up", "disable", "link", "sec", "em", "skin", "stopped", "changed", "rate", "test", "categories", "tags", "mpegurl", "1.0", "loading", "kind", "en", "background", "playsinline", "out", "inline", "impression", "offset", "first", "third", "file", "skippable", "state", "frame", "border", "scrolling", "focus", "scroll", "cursor", "pointer", "normal", "replay", "cuepoint", "tooltip", "relative", "swf", "native", "loop", "cuepoints", "finish", "landscape", "seeking", "level", "vertical", "dragging", "ga", "gtag", "location", "scrolled", "changing", "activated", "deactivated", "adblock", "detected", "object", "array", "storage", "debug", "domain", "redirect", "application", "vnd", "apple", "min", "js", "0.5", "0.75", "1.25", "1.5", "1.75", "2.0", "x", "transparent", "webkit", "adaptive", "ucbrowser", "windows", "mobile", "through", "view", "mid", "point", "work", "container", "cover", "Error", "fatal", "abort", "not", "supported", "skipped", "size", "midpoint", "thru", "subscribe", "handshake", "version", "set", "init", "can", "anchor", "urls", "in", "same", "context", "menu", "textarea", "ratio", "license", "only", "thumbnails", "webp", "interval", "count", "basic", "image", "blur", "help", "fixed", "slider", "unload", "close", "flow", "stats", "php", "Init", "send", "category", "label", "pop", "configuration", "http", "white", "dark", "rel", "stylesheet"],
        g= document,
        h= [],
        i= cz(a),
        j= {},
        k= {},
        l= {},
        m= {},
        n= {},
        o= {},
        p= {},
        q, r, s, t, u, v= {},
        w, x, y, z= [],
        A, B, C, D, E= 0,
        F= 0,
        G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, $, _, ba, bb, bc, bd, be, bf, bg, bh, bi, bj, bk, bl, bm, bn, bo, bp, bq, br, bs, bt, bu, bv, bw, bx, by, bz, bA, bB, bC= 0,
        bD, bE, bF, bG= -1,
        bH= window[b$(247)],
        bI= !0,
        bJ= window[b_(133)] && window[cb(139)].support ? window[cb(139)].support : {},
        bK= !1,
        bL= bJ.autoplay || !1,
        bM= bJ.inlineVideo || !1,
        bN= bJ.flashVideo || !1,
        bO= bJ.touch || !1,
        bP= bJ.volume || !1,
        bQ= bJ.iphone || !1,
        bR= !1,
        bS= !1,
        bT, bU, bV= [cs(ca(10), cw(ca(14)), cw(cb(99))), cs(bZ(7), cw(cc(8)), cw(cb(108))), cs(cd(13), cw(ca(6)), cw(cb(59))), cs(bZ(7), cw(bY(4)), cw(ca(205))), cs(ca(10), cw(cd(9)), cw(bY(250))), cs(cb(11), cw(bY(4)), cw(bY(84))), cs(bY(8), cw(b$(2)), cw(bZ(136))), cs(b$(6), cw(cd(9)), cw(bY(97)), cw(ca(253))), cs(bZ(7), cw(cb(109)), cw(cd(78)), cw(cc(256))), cs(cb(11), cw(cb(109)), cw(bY(73)), cw(cd(258))), cs(cc(12), cw(b$(4)), cw(bZ(56)), cw(cb(174))), cs(bY(8), cw(ca(8)), cw(ca(59)), cw(bY(105))), cs(b$(6), cw(b$(4)), cw(bY(57)), cw(cd(142))), cs(b_(5), cw(ca(19)), cw(cb(60)), cw(cc(175))), cs(cd(13), cw(bZ(16)), cw(b$(55)), cw(bY(105))), cs(bY(8), cw(cd(22)), cw(bY(57)), cw(b$(135))), cs(b$(6), cw(cc(78)), cw(bY(7))), cs(b$(6), cw(cd(79)), cw(cc(176))), cs(cd(13), cw(bZ(28)), cw(cc(208))), cs(cd(13), cw(ca(31)), cw(cc(126))), cs(cb(11), cw(cd(32)), cw(ca(98))), cs(cd(13), cw(b$(25)), cw(b$(11))), cs(b_(5), cw(cs(b$(15), cc(14))), cw(cc(61)), cw(b$(169))), cs(bZ(7), cw(cs(bY(17), cb(13))), cw(bZ(56)), cw(b$(103))), cs(bY(8), cw(cs(bY(17), bZ(9))), cw(bZ(56)), cw(b_(134))), cs(b_(5), cw(cb(7)), cw(ca(15))), cs(b_(5), cw(b_(71)), cw(bY(40))), cs(b$(6), cw(cc(78)), cw(bY(13))), cs(cc(12), cw(cb(257)), cw(cb(258))), cs(ca(10), cw(bY(205)), cw(ca(206)))];
    typeof String.prototype.trim != cb(33) && (String.prototype.trim= function() {
            return this.replace(/^\s+|\s+$/g, bY(-1))
        }),
        Array.isArray || (Array.isArray= function(a) {
            return Object.prototype.toString.call(a) === ct(cs(b_(104), cd(261)), cs(cw(bY(257)), cd(113)))
        });
    if (typeof Storage !== cc(142))
        try {
            localStorage.setItem(cv(cs(b_(29), ca(14)), bY(206), b$(256)), cc(210)),
                bK= !0
        } catch (bW) {}
    if (window.self !== window.top)
        var bX= document.cookie;
    cZ(i, cd(4)),
        e[bY(82)] == 0 && (e[cd(87)]= b_(80)),
        e[cc(86)] == 1 && (e[cd(87)]= b$(16));
    for (w in e)
        typeof e[w] != b$(162) && (e[w]= cs(cd(4), e[w])),
        cy(ct(cs(b_(104), cd(337), bY(108)), w, cd(41), e[w]));
    if (!this[cs(b$(30), bY(12))]) {
        w= e[cd(207)];
        if (w != bZ(197)) {
            if (!w || w.indexOf(b_(330)) < 0 || w.indexOf(cs(cd(28), cd(28))) < 0)
                if (b) {
                    if (!w || w.indexOf(cs(b_(43), bY(130))) <= 0)
                        e[b_(199)] == 2 ? w= cs(cc(338), cd(51), bY(130)) : w= cs(cd(340), b$(44), cd(135));
                    w= cs(cg(b, 0, b.lastIndexOf(ca(25))), cb(26), ca(204), ca(25), w)
                }
            H= cR(cd(204)),
                H.setAttribute(cd(341), cc(341)),
                H.setAttribute(b_(6), cs(bY(47), ca(25), cc(134))),
                H.setAttribute(cd(56), w),
                cV(cA(cB(g, cb(191))), H)
        }
    }
    e[cv(b_(167), cb(36))] && (D= cR(cc(63)),
            cL(D, b$(73), function() {
                bS= !0
            }),
            D[cb(22)]= cs(1, bZ(15)),
            D[cd(20)]= cs(1, b_(13)),
            D[b$(40)]= cv(cb(168), bZ(58)),
            D[cs(b$(83), cw(b_(65)))]= cu(cc(169), cd(64)),
            D[cb(25)]= cs(e[cv(cb(173), cc(37))], ca(45), cv(bY(74), cb(45)), bZ(35), Math.random(), cb(63), cv(bZ(92)), cb(39), Math.random()),
            cK(D, [b$(18), b$(22), bY(14), cs(-10, b_(13)), ca(23), cs(-10, b$(14))]),
            cV(i, D)),
        C= {
            container: function() {
                return i
            },
            listen: function(a, b) {
                if (!a || !b || typeof b != cd(35))
                    return this;
                this.a || (this.a= {}),
                    this.a[a] || (this.a[a]= []),
                    this.a[a].push(b);
                return this
            },
            handler: function(a) {
                if (!a || typeof a != bY(30))
                    return this;
                this.b || (this.b= []),
                    this.b.push(a);
                return this
            },
            handle: function(a, b) {
                var c, d, e, f;
                if (this.b)
                    for (d= 0; d < cf(this.b); d++)
                        try {
                            f= this.b[d](a, b),
                                f && (e= f)
                        } catch (g) {}
                if (this.a) {
                    c= this.a[a];
                    if (c)
                        for (d= 0; d < cf(c); d++)
                            try {
                                f= c[d](b),
                                    f && (e= f)
                            } catch (g) {}
                }
                return e
            },
            play: function(a) {
                if (G)
                    if (be)
                        this.handle(bV[11]);
                    else if (bf)
                    this.handle(bV[23]);
                else {
                    if (s == cc(10) || s == cd(22) || s == cs(ca(19), cd(15)))
                        return;
                    a ? (typeof a == bZ(163) && (z= [
                                [a, a.indexOf(cs(b$(44), ca(100))) > 0 ? cs(ca(6), bZ(22), cb(128)) : cs(bY(4), bZ(22), cd(116)), cb(2), 0, 0, !0]
                            ],
                            bB= z[0]),
                        G.playing ? G.pause(dk()) : dk(),
                        dj()) : G.ready ? G.resume() : G.load()
                }
            },
            pause: function() {
                if (G) {
                    if (s == bY(6) || s == cd(22) || s == cs(b$(15), cd(15)))
                        return;
                    G.pause()
                }
            },
            toggle: function() {
                if (G)
                    if (be)
                        this.handle(bV[11]);
                    else if (bf)
                    this.handle(bV[23]);
                else {
                    if (s == cd(11) || s == bY(17) || s == cs(cd(22), cb(13)))
                        return;
                    cE(i, cu(ca(4), bY(56))),
                        G.toggle()
                }
            },
            skip_preroll: function() {
                s == bY(6) && this.handle(bV[12])
            },
            skip_postroll: function() {
                (s == ca(19) || s == cs(bY(17), b$(8))) && this.handle(bV[15])
            },
            fullscreen: function() {
                G && G.fullscreen()
            },
            volume: function(a) {
                if (G) {
                    a && G.volume(a);
                    return G.volumeLevel
                }
                return 1
            },
            mute: function(a) {
                G && G.mute(a)
            },
            muted: function() {
                if (G)
                    return G.muted;
                return !1
            },
            seek: function(a) {
                a= parseInt(a);
                if (G && a > 0)
                    if (be)
                        bm= a,
                        this.handle(bV[11]);
                    else if (bf)
                    bm= a,
                    this.handle(bV[23]);
                else {
                    if (s == cc(10) || s == cd(22) || s == cs(bY(17), b$(8)))
                        return;
                    G.ready ? (G.seek(a),
                        G.resume()) : G.load(null, function() {
                        G.seek(a)
                    })
                }
            },
            unload: function() {
                if (G) {
                    var a= cG(i, cu(bZ(2), b_(131)));
                    a && a.canPlayType && (a.autoplay= !1,
                            a.preload= b_(107),
                            a.src= null),
                        G.disable(),
                        G.shutdown()
                }
                if (cf(h))
                    for (var b= 0; b < cf(h); b++)
                        cM(g, h[b][0], h[b][1]);
                cU(bb)
            },
            fpapi: function() {
                return G
            }
        },
        C.conf= e,
        this[cs(bZ(31), bY(12))] || (this[cs(b_(29), cb(15))]= {}),
        this[cs(b_(29), bZ(11))][a] && this[cs(cd(37), bZ(11))][a].unload(),
        this[cs(bZ(31), bY(12))][a]= C,
        i && cl(dE, 0);
    return C
}