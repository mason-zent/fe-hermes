#!/usr/bin/env python3
"""백그라운드 서브에이전트의 JSONL 로그를 실시간으로 압축해 보여준다 (herdr pane 용).
사용: scripts/agent-monitor.py <jsonl...>        지정 파일들을 tail
      scripts/agent-monitor.py --recent [분]      최근 N분(기본 120) 안에 수정된 로그 자동 선택 — 10초마다 새 로그도 찾는다
        · 백그라운드 서브에이전트(subagents/agent-*.jsonl)
        · pane 세션(delegate.sh·/call) — 워크트리(.worktrees/)에서 연 세션 로그. 헤르메스 폴더에서 연 세션은 넣지 않는다
      scripts/agent-monitor.py --stay --recent [분] 로그가 없어도 기다리고, 분 넘게 조용한 세션은 빼고, 10분(MONITOR_IDLE_ALERT_SEC) 조용하면 알림
한 줄 = [라벨] 도구 · 요약. 라벨은 서브에이전트면 첫 user 프롬프트의 대상 레포/앱, pane 세션이면 워크트리의 레포·브랜치.
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

PANE_BACKLOG=5   # pane 세션은 기록이 길어서 처음엔 마지막 몇 줄만 보여 주고 이어서 따라간다

def pane_label(path):
    """pane 세션 로그의 cwd·gitBranch 로 '레포·브랜치' 라벨을 만든다"""
    try:
        with open(path,"r",encoding="utf-8") as f:
            for line in f:
                try: d=json.loads(line)
                except Exception: continue
                cwd=d.get("cwd") or ""
                if not cwd: continue
                m=re.search(r"/\.worktrees/([^/]+)/", cwd)
                repo=m.group(1) if m else os.path.basename(cwd)
                branch=d.get("gitBranch") or os.path.basename(cwd)
                return f"{repo}·{branch}"
    except Exception: pass
    return "pane"

class Tail:
    def __init__(self, path, idx, pane=False):
        self.path=path; self.f=open(path,"r",encoding="utf-8"); self.color=COLORS[idx%len(COLORS)]
        self.pane=pane; self.label=pane_label(path) if pane else None
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
    # pane 세션 — 사용자가 pane 에 입력한 지시(시스템·명령 메시지는 '<' 로 시작하므로 뺀다)
    if t.pane and d.get("type")=="user" and isinstance(content,str) and not d.get("isMeta") and not d.get("isCompactSummary"):
        txt=content.strip()
        if txt and not txt.startswith("<"): out.append(f"{t.color}{BOLD}[{t.label}]{RESET} 👤 {clip(txt, cols()-22)}")
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

def find_recent(mins):
    """최근 mins 분 안에 바뀐 (경로, pane 세션 여부) 목록"""
    root=os.path.expanduser("~/.claude/projects")
    subagents=[(p,False) for p in glob.glob(f"{root}/*/*/subagents/agent-*.jsonl")]
    panes=[(p,True) for p in glob.glob(f"{root}/*--worktrees-*/*.jsonl")]
    now=time.time()
    found=[(p,pane) for p,pane in subagents+panes if now-os.path.getmtime(p) < mins*60]
    found.sort(key=lambda item: os.path.getmtime(item[0]))
    return found

def open_tail(path, pane, idx):
    t=Tail(path, idx, pane)
    rows=[row for line in t.read_new() for row in render(t, line)]
    if pane: rows=rows[-PANE_BACKLOG:]
    for row in rows: print(row)
    return t

IDLE_ALERT_SEC=int(os.environ.get("MONITOR_IDLE_ALERT_SEC","600"))   # --stay: 이만큼 아무 로그도 안 바뀌면 알림, 계속 조용하면 같은 간격으로 다시(0 이면 끔)

def notify(text):
    """macOS 알림 — 실패해도 모니터는 계속 돈다"""
    try:
        import subprocess
        subprocess.run(["osascript","-e",f'display notification "{text}" with title "🛰 에이전트 모니터"'], timeout=5, capture_output=True)
    except Exception: pass

def main():
    args=sys.argv[1:]
    # --stay: 로그가 없어도 끝내지 않고 기다리며, 끝난 세션은 빼고, 조용하면 알린다(monitor-pane.sh 가 붙인다)
    stay="--stay" in args; args=[a for a in args if a!="--stay"]
    recent = not args or args[0]=="--recent"
    if recent:
        mins=int(args[1]) if len(args)>1 else 120
        files=find_recent(mins)
    else:
        files=[(p,False) for p in args]
    if not files and not stay: print("모니터할 로그가 없습니다."); return 3   # 3 = 모니터할 것 없음
    alert=f" · {IDLE_ALERT_SEC//60}분 조용하면 알림" if stay and IDLE_ALERT_SEC else ""
    print(f"{BOLD}🛰  에이전트 모니터{RESET} {DIM}— {len(files)}개 로그(pane 세션 {sum(1 for _,pane in files if pane)}){alert} · Ctrl+C 로 종료{RESET}\n")
    if not files: print(f"{DIM}{time.strftime('%H:%M')} 돌고 있는 에이전트 없음 — 뜨면 붙습니다{RESET}")
    tails=[open_tail(p,pane,i) for i,(p,pane) in enumerate(files)]
    last_scan=time.time()
    last_activity=max([os.path.getmtime(t.path) for t in tails] or [time.time()])
    last_alert=0.0
    try:
        while True:
            any_new=False
            for t in tails:
                for line in t.read_new():
                    for row in render(t, line): print(row); any_new=True
            # 새로 뜬 에이전트도 잡는다
            if recent and time.time()-last_scan > 10:
                last_scan=time.time(); known={t.path for t in tails}
                for p,pane in find_recent(mins):
                    if p not in known:
                        tails.append(open_tail(p,pane,len(tails))); any_new=True
                if stay:
                    # mins 분 넘게 조용한 세션은 뺀다
                    for t in [t for t in tails if time.time()-os.path.getmtime(t.path) > mins*60]:
                        t.f.close(); tails.remove(t); print(f"{DIM}{time.strftime('%H:%M')} [{t.label}] {mins}분 조용해서 뺐습니다{RESET}")
            if any_new: last_activity=time.time(); last_alert=0.0
            if stay:
                # 조용하면 알린다 — 마지막 로그 뒤 IDLE_ALERT_SEC 마다
                idle=time.time()-last_activity
                if IDLE_ALERT_SEC and idle >= IDLE_ALERT_SEC and time.time()-max(last_alert,last_activity) >= IDLE_ALERT_SEC:
                    last_alert=time.time()
                    text=f"{int(idle//60)}분째 돌고 있는 에이전트가 없습니다" + (f" (붙어 있는 세션 {len(tails)}개 — 입력을 기다리는지 확인)" if tails else "")
                    print(f"{BOLD}🔔 {time.strftime('%H:%M')} {text}{RESET}"); notify(text)
            # 서브에이전트만 있고 모두 끝나면 끝낸다(--stay 면 계속 기다린다). pane 세션은 사용자가 계속 지시하므로 끝나지 않는다
            elif tails and all(t.done for t in tails) and not any(t.pane for t in tails):
                print(f"\n{BOLD}✅ 모두 완료{RESET} " + " · ".join(f"{t.color}{t.label}{RESET}({t.tools}개 도구)" for t in tails)); break
            if not any_new: time.sleep(0.7)
    except KeyboardInterrupt:
        print(f"\n{DIM}종료. 진행 요약: " + " · ".join(f"{t.label}={t.tools}" for t in tails) + RESET)

if __name__=="__main__": sys.exit(main() or 0)
