"""병 사진 배경 제거 + 품질 측정 (scripts/fetch-hq-images.mjs 가 한 번 띄워 놓고 줄 단위로 부른다).

입력(표준 입력, 한 줄에 하나): {"src": "원본.jpg", "out": "결과.webp"}
출력(표준 출력, 한 줄에 하나): {"ok": true, "w": 273, "h": 1000, "objects": 1, "glare": 0.1, ...}
모델: rembg isnet-general-use (처음 한 번 내려받아 ~/.u2net 등에 저장)
측정값의 뜻과 기준은 scripts/lib/hq.mjs 의 hqQuality 참고.
"""
import contextlib
import json
import sys

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

HEIGHT = 1000  # 저장 높이(px)

session = new_session("isnet-general-use")


def cut(src: str, out: str) -> dict:
    im = Image.open(src).convert("RGB")
    rgba = remove(
        im,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=15,
        alpha_matting_erode_size=8,
    )
    a = np.array(rgba.getchannel("A"))
    solid = (a > 128).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    if n <= 1:
        return {"ok": False, "error": "병을 찾지 못함"}
    areas = stats[1:, cv2.CC_STAT_AREA]
    main = 1 + int(np.argmax(areas))
    objects = int((areas > areas.max() * 0.05).sum())
    # 가장 큰 덩어리(병)만 남기고 주변 부스러기는 지운다
    keep = cv2.dilate((lab == main).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    a = np.where(keep, a, 0).astype(np.uint8)

    x, y, bw, bh = (int(v) for v in stats[main, :4])
    H, W = a.shape
    edge = x <= 2 or y <= 2 or x + bw >= W - 2 or y + bh >= H - 2
    body = a > 200
    gray = cv2.cvtColor(np.array(rgba.convert("RGB")), cv2.COLOR_RGB2GRAY)
    glare = float((gray[body] >= 250).mean()) * 100 if body.any() else 100.0
    # 반사광: 하얗게 날아간 픽셀(glare)뿐 아니라 밝고 색이 빠진 넓은 얼룩(창문·햇빛 반사)도 잰다
    hsv = cv2.cvtColor(np.array(rgba.convert("RGB")), cv2.COLOR_RGB2HSV)
    shine = (hsv[..., 2] >= 225) & (hsv[..., 1] <= 40) & body
    sheen = float(shine.sum() / body.sum()) * 100 if body.any() else 100.0
    area = int(stats[main, cv2.CC_STAT_AREA])

    rgba.putalpha(Image.fromarray(a))
    bbox = Image.fromarray(a).point(lambda v: 255 if v > 20 else 0).getbbox()
    rgba = rgba.crop(bbox)
    if rgba.height > HEIGHT:
        rgba = rgba.resize((round(rgba.width * HEIGHT / rgba.height), HEIGHT), Image.LANCZOS)
    rgba.save(out, "WEBP", quality=88, method=6)
    return {
        "ok": True,
        "w": rgba.width,
        "h": rgba.height,
        "objects": objects,
        "glare": round(glare, 2),
        "sheen": round(sheen, 2),
        "srcH": bh,
        "ratio": round(bw / bh, 3),
        "edge": bool(edge),
        "fill": round(area / (bw * bh), 3),
        "coverage": round(area / (W * H), 3),
    }


out = sys.stdout
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        job = json.loads(line)
        with contextlib.redirect_stdout(sys.stderr):  # 라이브러리 경고가 결과 줄을 깨지 않게
            res = cut(job["src"], job["out"])
    except Exception as e:  # 한 장 실패가 전체를 멈추지 않게
        res = {"ok": False, "error": str(e)[:200]}
    print(json.dumps(res), file=out, flush=True)
