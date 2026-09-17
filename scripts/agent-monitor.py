#!/usr/bin/env python3
"""백그라운드 서브에이전트의 JSONL 로그를 실시간으로 압축해 보여준다 (herdr pane 용).
사용: scripts/agent-monitor.py <jsonl...>        지정 파일들을 tail
      scripts/agent-monitor.py --recent [분]      최근 N분(기본 120) 안에 수정된 subagents/*.jsonl 자동 선택
한 줄 = [라벨] 도구 · 요약. 라벨은 첫 user 프롬프트의 대상 레포/앱에서 뽑는다.
"""
import sys, os, json, time, glob, re, unicodedata, shutil

RESET="\x1b[0m"; DIM="\x1b[2m"; BOLD="\x1b[1m"
COLORS=["\x1b[38;5;80m","\x1b[38;5;222m","\x1b[38;5;150m","\x1b[38;5;213m","\x1b[38;5;208m","\x1b[38;5;117m","\x1b[38;5;180m","\x1b[38;5;120m"]
TOOL_ICON={"Bash":"⚙","Read":"📖","Grep":"🔍","Glob":"📁","Edit":"✏️","Write":"📝","Agent":"🤖","WebFetch":"🌐","SubagentHandback":"📨"}

def width(s): return sum(2 if unicodedata.east_asian_width(c) in ("W","F") else 1 for c in s)
def clip(s, n):
    s=" ".join(str(s).split())
    out=""; w=0
    for ch in s:
        cw=2 if unicodedata.east_asian_width(ch) in ("W","F") else 1
        if w+cw>n-1: return out+"…"
        out+=ch; w+=cw
    return out

def label_from_prompt(text):
    m=re.search(r"(apps/[a-z-]+web|apps/brand-web, apps/sena-web, apps/plus-web|packages/\*|frontend/|client-brics-[a-z]+|web-op|bznav-web|zent-packages)", text)
    if not m: return "agent"
    lab=m.group(1)
    if lab.startswith("apps/brand"): return "bznav 3앱"
    if lab.startswith("apps/"): return "bznav "+lab[5:]
    if lab=="packages/*": return "bznav packages"
    if lab=="frontend/": return "zent-packages"
    return lab.replace("client-brics-","")

def cols():
    try: return max(40, shutil.get_terminal_size().columns)
    except Exception: return 100
def summarize_tool(name, inp):
    n = cols() - 26  # 라벨·아이콘·도구명 자리 제외
    if name=="Bash": return clip(inp.get("description") or inp.get("command",""), n)
    if name in ("Read",): return clip(inp.get("file_path",""), n)
    if name=="Grep": return clip(f"{inp.get('pattern','')}  in {inp.get('path','')}", n)
    if name=="Glob": return clip(f"{inp.get('pattern','')}  in {inp.get('path','')}", n)
    if name in ("Edit","Write"): return clip(inp.get("file_path",""), n)
    if name=="SubagentHandback": return "최종 보고 전송"
    return clip(json.dumps(inp, ensure_ascii=False), n)

class Tail:
    def __init__(self, path, idx):
        self.path=path; self.f=open(path,"r",encoding="utf-8"); self.label=None; self.color=COLORS[idx%len(COLORS)]
        self.done=False; self.tools=0
    def read_new(self):
        lines=[]
        while True:
            line=self.f.readline()
            if not line: break
            if not line.endswith("\n"):  # 부분 줄 — 되감기
                self.f.seek(self.f.tell()-len(line.encode("utf-8"))); break
            lines.append(line)
        return lines

def render(tails, line):
    try: d=json.loads(line)
    except Exception: return []
    out=[]
    msg=d.get("message") or {}
    content=msg.get("content")
    t=tails
    if d.get("type")=="user" and t.label is None and isinstance(content,str):
        t.label=label_from_prompt(content); out.append(f"{t.color}{BOLD}[{t.label}]{RESET} {DIM}시작{RESET}")
        return out
    if not isinstance(content,list): return out
    for block in content:
        bt=block.get("type")
        if bt=="tool_use":
            t.tools+=1; name=block.get("name",""); icon=TOOL_ICON.get(name,"•")
            out.append(f"{t.color}[{t.label or 'agent'}]{RESET} {icon} {name:<6} {DIM}{summarize_tool(name, block.get('input') or {})}{RESET}")
            if name=="SubagentHandback": t.done=True
        elif bt=="text" and d.get("type")=="assistant":
            txt=block.get("text","").strip()
            if txt and len(txt)>3: out.append(f"{t.color}[{t.label or 'agent'}]{RESET} 💬 {clip(txt, cols()-22)}")
    return out

def main():
    args=sys.argv[1:]
    if not args or args[0]=="--recent":
        mins=int(args[1]) if len(args)>1 else 120
        base=glob.glob(os.path.expanduser("~/.claude/projects/*/*/subagents/agent-*.jsonl"))
        now=time.time(); files=[p for p in base if now-os.path.getmtime(p) < mins*60]
        files.sort(key=os.path.getmtime)
    else:
        files=args
    if not files: print("모니터할 로그가 없습니다."); return 3   # 3 = 모니터할 것 없음
    tails=[Tail(p,i) for i,p in enumerate(files)]
    print(f"{BOLD}🛰  서브에이전트 모니터{RESET} {DIM}— {len(tails)}개 로그 · q 는 없음, Ctrl+C 로 종료{RESET}\n")
    try:
        while True:
            any_new=False
            for t in tails:
                for line in t.read_new():
                    for row in render(t, line): print(row); any_new=True
            if all(t.done for t in tails):
                print(f"\n{BOLD}✅ 모두 완료{RESET} " + " · ".join(f"{t.color}{t.label}{RESET}({t.tools}개 도구)" for t in tails)); break
            if not any_new: time.sleep(0.7)
    except KeyboardInterrupt:
        print(f"\n{DIM}종료. 진행 요약: " + " · ".join(f"{t.label}={t.tools}" for t in tails) + RESET)

if __name__=="__main__": sys.exit(main() or 0)
