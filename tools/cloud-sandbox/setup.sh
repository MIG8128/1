#!/usr/bin/env bash
# Test Obsidian for cloud sessions (Linux): the user's Obsidian version, in a
# virtual display, with a vault of placeholder notes and this repo's build.
# Everything lives in /tmp/gsbx (outside the repo). DevTools port 9231.
#   bash tools/cloud-sandbox/setup.sh          # download (once), build the vault, copy the build
#   bash tools/cloud-sandbox/setup.sh launch   # start Obsidian (and trust the vault's plugins)
#   bash tools/cloud-sandbox/setup.sh copy     # copy the build again (then reload the plugin)
#   bash tools/cloud-sandbox/setup.sh close    # stop it
set -euo pipefail
VERSION=1.14.5   # the user's Obsidian (CLAUDE.md); update with it
SS_VERSION=1.0.9 # Style Settings
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
S=/tmp/gsbx
V="$S/vault"
APP="$S/app/squashfs-root/obsidian"
here="$(dirname "$0")"

copy_build() {
    cp "$REPO/theme.css" "$REPO/manifest.json" "$V/.obsidian/themes/Goguryeo/"
    cp "$REPO/companion/main.js" "$REPO/companion/manifest.json" "$V/.obsidian/plugins/goguryeo-companion/"
    echo "build copied"
}

case "${1:-setup}" in
copy) copy_build; exit 0 ;;
close)
    pkill -f "user-data-dir=$S/app-data" || true
    echo "closed"; exit 0 ;;
launch)
    (xvfb-run -a -s "-screen 0 1400x900x24" "$APP" --no-sandbox --disable-gpu \
        --user-data-dir="$S/app-data" --remote-debugging-port=9231 > "$S/obsidian.log" 2>&1 &)
    for _ in $(seq 1 40); do sleep 1; curl -s http://127.0.0.1:9231/json/list > /dev/null && break; done
    sleep 3
    # first start: "Trust author and enable plugins"
    node "$here/cdp.mjs" eval '[...document.querySelectorAll(".modal button")].find((b) => /trust/i.test(b.textContent))?.click(); "started"'
    exit 0 ;;
esac

mkdir -p "$S/dl" "$S/app" "$S/app-data"
if [ ! -x "$APP" ]; then
    curl -sSL -o "$S/dl/Obsidian.AppImage" "https://github.com/obsidianmd/obsidian-releases/releases/download/v$VERSION/Obsidian-$VERSION.AppImage"
    chmod +x "$S/dl/Obsidian.AppImage"
    (cd "$S/app" && "$S/dl/Obsidian.AppImage" --appimage-extract > /dev/null)
fi
mkdir -p "$V/.obsidian/themes/Goguryeo" "$V/.obsidian/plugins/goguryeo-companion" \
    "$V/.obsidian/plugins/obsidian-style-settings" "$V/테스트 소설"
for f in main.js manifest.json styles.css; do
    [ -f "$V/.obsidian/plugins/obsidian-style-settings/$f" ] || curl -sSL -o "$V/.obsidian/plugins/obsidian-style-settings/$f" \
        "https://github.com/mgmeyers/obsidian-style-settings/releases/download/$SS_VERSION/$f"
done
cd "$V/.obsidian"
echo '["goguryeo-companion","obsidian-style-settings"]' > community-plugins.json
echo '{"file-explorer":true,"global-search":true,"switcher":true,"command-palette":true,"backlink":true,"outgoing-link":true,"outline":true,"page-preview":true,"bases":true,"editor-status":true,"webviewer":true}' > core-plugins.json
echo '{"cssTheme":"Goguryeo","theme":"obsidian"}' > appearance.json
# Background: Image (wall.png); change or delete for the other cases
echo '{"goguryeo@@goguryeo-bg":"goguryeo-bg-image","goguryeo@@g-bg-image":"wall.png"}' > plugins/obsidian-style-settings/data.json
cd "$V"
# Placeholder notes only (CLAUDE.md)
printf -- "# 테스트 소설\n\n테스트 문장입니다.\n" > "테스트 소설/테스트 소설.md"
printf "# 1장\n\n테스트 문장입니다. 인물 A가 등장합니다.\n" > "테스트 소설/1장.md"
printf "# 2장\n\n테스트 문장입니다.\n" > "테스트 소설/2장.md"
printf "# 작업 목록\n\n- [ ] 할 일 하나\n- [x] 끝낸 일\n- [/] 하는 중\n" > "작업 목록.md"
printf "# 서식 견본\n\n## 제목 2\n\n[[작업 목록]] 링크, #태그\n\n> [!note] 콜아웃\n> 테스트 문장입니다.\n\n| 가 | 나 |\n|---|---|\n| 1 | 2 |\n\n\`\`\`js\nconsole.log(1)\n\`\`\`\n" > "서식 견본.md"
python3 - "$V" "$S" <<'PY'
import json, random, sys
v, s = sys.argv[1], sys.argv[2]
lines = ["# 긴 문서", ""] + [f"{i}. 테스트 문장입니다. 테스트 문장입니다. 테스트 문장입니다." for i in range(1, 81)]
open(f"{v}/긴 문서.md", "w").write("\n\n".join(lines) + "\n")
try:
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (1920, 1200), (40, 70, 110)); d = ImageDraw.Draw(im); random.seed(3)
    for _ in range(40):
        x, y, r = random.randint(0, 1920), random.randint(0, 1200), random.randint(60, 260)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(random.randint(60, 230), random.randint(60, 200), random.randint(80, 230)))
    im.save(f"{v}/wall.png")
except ImportError:
    pass
json.dump({"vaults": {"sandbox0000000001": {"path": v, "ts": 1, "open": True}}}, open(f"{s}/app-data/obsidian.json", "w"))
PY
copy_build
echo "ready: bash $0 launch"
