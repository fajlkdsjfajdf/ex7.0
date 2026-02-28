import re


pixed = "16px"
def my_parse_int(n, r=None):
    t = re.compile(r'^0[xX]')
    ce = "\t\n\f\r   ᠎             　\u2028\u2029\ufeff"
    de = "[" + ce + "]"
    pe = re.compile("^" + de + de + "*")
    me = re.compile(de + de + "*$")
    o = pe.sub('', str(n)).replace(me, '')
    i = int(r) if str(r).isdigit() else (16 if t.match(o) else 10)
    return int(o, i)


def get_license_code(license_code):
    f = ""
    for g in range(1, len(license_code)):
        f += str(my_parse_int(license_code[g])) if my_parse_int(license_code[g]) else '1'
    return f


def get_code1(license_code):
    license_code2 = get_license_code(license_code)
    j = int(len(license_code2) / 2)
    k = my_parse_int(license_code2[:j + 1])
    l = my_parse_int(license_code2[j:])
    g = abs(l - k)
    f = g
    g = abs(k - l)
    f += g
    f *= 2
    f = str(f)
    i = my_parse_int(pixed) // 2 + 2
    m = ""
    for g in range(j + 1):
        for h in range(1, 5):
            n = my_parse_int(license_code[g + h]) + my_parse_int(f[g])
            if n >= i:
                n -= i
            m += str(n)
    return m


def get_code2(code, code1):
    h = code[:2 * my_parse_int(pixed)]
    i = code1
    for k in range(len(h) - 1, -1, -1):
        l = k
        for m in range(k, len(i)):
            l += my_parse_int(i[m])
        while l >= len(h):
            l -= len(h)
        n = "".join(h[o] if o == k else h[l] if o == l else h[o] for o in range(len(h)))
        h = n
    return code.replace(h, code1)


def get_tk_video_url(url):
    license_code = "$432515114269431"
    index = url.find("https:")
    if index >= 0:
        new_url = url[index:]
        code = new_url.split("/")[5]
        code1 = get_code1(license_code)
        code2 = get_code2(code, code1)
        return new_url.replace(code, code2)
    return ""





if __name__ == '__main__':
    print(get_tk_video_url("function/0/https://tktube.com/get_file/30/63b27721cde069842bdd251c4b3f4b2e9a863561b5/145000/145745/145745_480p.mp4/"))