#!/usr/bin/env python3
"""마크다운을 터미널 ANSI 서식으로 렌더한다. 외부 의존 없음.
사용: scripts/mdview.py <파일.md> [--width N]   (보통 `| less -R` 로 연결)
지원: 제목(#~####), 굵게/기울임/인라인 코드, 링크, 목록(-, *, 1.), 체크박스, 인용, 코드 펜스, 표(정렬·한글 폭), 구분선
"""
import re, sys, os, unicodedata

RESET = "\x1b[0m"; BOLD = "\x1b[1m"; DIM = "\x1b[2m"; ITALIC = "\x1b[3m"; UNDER = "\x1b[4m"
H1 = "\x1b[1m\x1b[38;5;222m"; H2 = "\x1b[1m\x1b[38;5;80m"; H3 = "\x1b[1m\x1b[38;5;150m"; H4 = "\x1b[1m\x1b[38;5;250m"
CODE = "\x1b[38;5;215m\x1b[48;5;236m"; FENCE_BG = "\x1b[48;5;235m\x1b[38;5;252m"
LINK = "\x1b[38;5;75m"; QUOTE = "\x1b[38;5;245m"; BULLET = "\x1b[38;5;80m"; RULE = "\x1b[38;5;240m"; THEAD = "\x1b[1m\x1b[38;5;223m"

def width(text):  # 표시 폭 (한글·이모지 2칸)
    plain = re.sub(r"\x1b\[[0-9;]*m", "", text)
    return sum(2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1 for ch in plain)

def pad(text, target):
    return text + " " * max(0, target - width(text))

def inline(text):
    # 코드 스팬은 먼저 보호
    parts = re.split(r"(`[^`]+`)", text)
    out = []
    for part in parts:
        if part.startswith("`") and part.endswith("`") and len(part) > 1:
            out.append(f"{CODE} {part[1:-1]} {RESET}")
            continue
        part = re.sub(r"\*\*(.+?)\*\*", lambda m: f"{BOLD}{m.group(1)}{RESET}", part)
        part = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", lambda m: f"{ITALIC}{m.group(1)}{RESET}", part)
        part = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: f"{LINK}{UNDER}{m.group(1)}{RESET} {DIM}({m.group(2)}){RESET}", part)
        part = re.sub(r"(?<![\w/])(https?://[^\s)]+)", lambda m: f"{LINK}{UNDER}{m.group(1)}{RESET}", part)
        out.append(part)
    return "".join(out)

def wrap_plain(text, w):  # 표시 폭 w 안에서 공백 기준으로 줄바꿈 (긴 토큰은 강제 분할)
    words, lines, cur, cur_w = text.split(" "), [], "", 0
    for word in words:
        ww = width(word)
        while ww > w:  # 한 단어가 열보다 길면 잘라서 넣는다
            if cur: lines.append(cur); cur, cur_w = "", 0
            piece, pw = "", 0
            for ch in word:
                cw = 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1
                if pw + cw > w: break
                piece += ch; pw += cw
            lines.append(piece); word = word[len(piece):]; ww = width(word)
        if cur and cur_w + 1 + ww > w:
            lines.append(cur); cur, cur_w = word, ww
        else:
            cur = word if not cur else f"{cur} {word}"; cur_w = ww if cur_w == 0 else cur_w + 1 + ww
    if cur or not lines: lines.append(cur)
    return lines

def render_table(rows, cols):
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    if len(cells) >= 2 and all(re.fullmatch(r":?-{2,}:?", c) for c in cells[1] if c):
        header, body = cells[0], cells[2:]
    else:
        header, body = None, cells
    ncol = max(len(r) for r in cells)
    plain_rows = [r + [""] * (ncol - len(r)) for r in ([header] if header else []) + body]
    widths = [max(width(inline(r[i])) for r in plain_rows) for i in range(ncol)]
    avail = cols - 4 - 3 * (ncol - 1)
    if sum(widths) > avail:  # 넘치면 넓은 열부터 줄이고, 셀 내용은 열 안에서 줄바꿈
        min_w = 8
        while sum(widths) > avail:
            i = max(range(ncol), key=lambda k: widths[k])
            if widths[i] <= min_w: break
            widths[i] -= 1
    lines = []
    def emit(r, style=""):
        wrapped = [wrap_plain(c, widths[i]) for i, c in enumerate(r)]
        height = max(len(w) for w in wrapped)
        for k in range(height):
            parts = []
            for i in range(ncol):
                chunk = wrapped[i][k] if k < len(wrapped[i]) else ""
                parts.append(f"{style}{pad(inline(chunk), widths[i])}{RESET}")
            lines.append("  " + f" {RULE}│{RESET} ".join(parts))
    if header:
        emit(plain_rows[0], THEAD)
        lines.append("  " + f"{RULE}" + "─┼─".join("─" * w for w in widths) + RESET)
        for r in plain_rows[1:]: emit(r)
    else:
        for r in plain_rows: emit(r)
    return lines

def render(md, cols):
    out, table, fence, fence_lang = [], [], None, ""
    for raw in md.splitlines():
        line = raw.rstrip("\n")
        if fence is not None:
            if line.strip().startswith("```"):
                out.append(f"{DIM}  └{'─' * (cols - 6)}{RESET}"); out.append(""); fence = None; continue
            out.append(f"{FENCE_BG}  {pad(line, cols - 4)}{RESET}")
            continue
        if line.strip().startswith("|") and line.strip().endswith("|"):
            table.append(line); continue
        if table:
            out.extend(render_table(table, cols)); out.append(""); table = []
        if line.strip().startswith("```"):
            fence = True; fence_lang = line.strip()[3:].strip()
            label = f" {fence_lang}" if fence_lang else ""
            out.append(f"{DIM}  ┌{'─' * (cols - 6)}{RESET}" if not label else f"{DIM}  ┌ {label} {'─' * max(0, cols - 9 - len(label))}{RESET}")
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            level, text = len(m.group(1)), inline(m.group(2))
            style = {1: H1, 2: H2, 3: H3}.get(level, H4)
            out.append("")
            out.append(f"{style}{'█ ' if level == 1 else '▌ ' if level == 2 else '· ' if level == 3 else ''}{text}{RESET}")
            if level <= 2: out.append(f"{RULE}{'─' * min(cols - 2, max(20, width(text) + 4))}{RESET}")
            continue
        if re.match(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$", line):
            out.append(f"{RULE}{'─' * (cols - 2)}{RESET}"); continue
        m = re.match(r"^(\s*)>\s?(.*)$", line)
        if m:
            out.append(f"{m.group(1)}{QUOTE}▎ {inline(m.group(2))}{RESET}"); continue
        m = re.match(r"^(\s*)[-*+]\s+\[( |x|X)\]\s+(.*)$", line)
        if m:
            box = "☑" if m.group(2).lower() == "x" else "☐"
            out.append(f"{m.group(1)}  {BULLET}{box}{RESET} {inline(m.group(3))}"); continue
        m = re.match(r"^(\s*)[-*+]\s+(.*)$", line)
        if m:
            depth = len(m.group(1)) // 2
            mark = "•" if depth == 0 else "◦" if depth == 1 else "▪"
            out.append(f"{m.group(1)}  {BULLET}{mark}{RESET} {inline(m.group(2))}"); continue
        m = re.match(r"^(\s*)(\d+)[.)]\s+(.*)$", line)
        if m:
            out.append(f"{m.group(1)}  {BULLET}{m.group(2)}.{RESET} {inline(m.group(3))}"); continue
        out.append(inline(line))
    if table: out.extend(render_table(table, cols))
    return "\n".join(out) + "\n"

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    cols = 100
    if "--width" in sys.argv:
        cols = int(sys.argv[sys.argv.index("--width") + 1])
    else:
        try: cols = os.get_terminal_size().columns
        except OSError:
            try: cols = int(os.environ.get("COLUMNS", "100"))
            except ValueError: pass
    text = open(args[0], encoding="utf-8").read() if args else sys.stdin.read()
    if args:
        title = os.path.relpath(args[0])
        sys.stdout.write(f"{DIM}📄 {title}{RESET}\n")
    sys.stdout.write(render(text, cols))

if __name__ == "__main__":
    main()
