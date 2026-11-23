# 公開の前に実行する（python release.py → git commit → git push）。
# 1. JS の構文を確かめ、だめなら止める
# 2. app.js・version.json・index.html の部品の ?v= に、同じ版の番号（日時）を書きこむ
#    → 開いたままのホーム画面アプリも、版の違いに気づいて新しくなる
import datetime, json, re, subprocess, sys

for f in ["app.js", "demo.js", "sw.js"]:
    r = subprocess.run(["node", "--check", f], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print("SYNTAX ERROR:", f)
        print(r.stderr)
        sys.exit(1)
    print("syntax ok:", f)

v = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
tag = v.replace(" ", "_").replace(":", "")

s = open("app.js", encoding="utf-8").read()
s, n = re.subn(r'var VERSION = "[^"]*";', 'var VERSION = "%s";' % v, s)
assert n == 1, "app.js に VERSION が見つかりません"
open("app.js", "w", encoding="utf-8", newline="\n").write(s)

h = open("index.html", encoding="utf-8").read()
h, n = re.subn(r'((?:src|href)="(?:styles\.css|app\.js|demo\.js))\?v=[^"]*"', lambda m: m.group(1) + "?v=" + tag + '"', h)
assert n >= 2, "index.html の ?v= が見つかりません"
h, n2 = re.subn(r"(demo\.js)\?v=[^'\"<]*", lambda m: m.group(1) + "?v=" + tag, h)
open("index.html", "w", encoding="utf-8", newline="\n").write(h)

open("version.json", "w", encoding="utf-8", newline="\n").write(json.dumps({"version": v}) + "\n")
print("version", v)
