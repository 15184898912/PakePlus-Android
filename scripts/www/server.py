#!/usr/bin/env python3
"""
正商诸葛AI·爆款云剪智能体 - 本地服务器
功能：
1. 提供静态文件服务（HTML/CSS/JS/MP3等）
2. 提供 /api/tts 端点 - 使用 edge-tts（微软Edge神经网络语音）合成高质量中文配音
3. 提供 /api/tts_baidu 端点 - 代理百度TTS作为备用

使用方法：
  python server.py
  然后在浏览器打开 http://localhost:8099

依赖安装：
  pip install edge-tts
"""

import http.server
import socketserver
import urllib.parse
import urllib.request
import asyncio
import edge_tts
import io
import os
import json
import threading
import sys

PORT = 8099
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# ===== 语音映射表：应用内音色ID -> edge-tts 语音名称 =====
# edge-tts 提供高质量的微软神经网络中文语音
VOICE_MAP = {
    1:  "zh-CN-XiaoxiaoNeural",    # 抖音小姐姐 -> 晓晓（女声，温暖亲切）
    2:  "zh-CN-YunxiNeural",       # 魔云熙 -> 云希（男声，温暖）
    3:  "zh-CN-XiaoyiNeural",      # 魔少芬 -> 晓伊（女声，活泼）
    4:  "zh-CN-YunyangNeural",     # 魔曼波Pro -> 云扬（男声，专业沉稳）
    5:  "zh-CN-YunjianNeural",     # 魔大壮 -> 云健（男声，浑厚有力）
    6:  "zh-CN-XiaoshuangNeural",  # 魔小雅 -> 晓双（女声，童声）
    7:  "zh-CN-XiaomoNeural",      # 魔甜心 -> 晓墨（女声，成熟甜美）
    8:  "zh-CN-YunyeNeural",       # 魔老炮 -> 云野（男声，沧桑成熟）
    9:  "zh-CN-XiaoruiNeural",     # 魔婉儿 -> 晓瑞（女声，优雅沉稳）
    10: "zh-CN-YunyangNeural",     # 魔掌柜 -> 云扬（男声，专业商务）
}


async def generate_tts_edge(text, voice_id, rate_pct, pitch_val):
    """
    使用 edge-tts 生成中文语音
    :param text: 要合成的文本
    :param voice_id: 应用内音色ID (1-10)
    :param rate_pct: 语速百分比 (0-100, 100=正常)
    :param pitch_val: 音高值 (0.4-1.5, 1.0=正常)
    :return: MP3音频字节数据
    """
    voice_name = VOICE_MAP.get(voice_id, "zh-CN-XiaoxiaoNeural")

    # 语速转换：0-100 -> edge-tts格式
    # 0=最慢(-80%), 100=正常(0%), 映射为 -60% ~ +20%
    rate_percent = int((rate_pct / 100.0 - 1.0) * 80)
    rate_percent = max(-80, min(80, rate_percent))
    rate_str = f"{rate_percent:+d}%"

    # 音高转换：0.4-1.5 -> edge-tts格式
    # 1.0=正常(0Hz), 映射为 -30Hz ~ +25Hz
    pitch_hz = int((pitch_val - 1.0) * 50)
    pitch_hz = max(-50, min(50, pitch_hz))
    pitch_str = f"{pitch_hz:+d}Hz"

    # 分段处理长文本（edge-tts 单次建议不超过5000字符）
    max_chunk = 800
    chunks = []
    if len(text) <= max_chunk:
        chunks = [text]
    else:
        # 按句子分割
        import re
        sentences = re.split(r'([。！？!?；;\n]+)', text)
        current = ""
        for s in sentences:
            if len(current) + len(s) > max_chunk and current:
                chunks.append(current)
                current = s
            else:
                current += s
        if current:
            chunks.append(current)

    # 合成每段语音并拼接
    all_audio = io.BytesIO()
    for chunk_text in chunks:
        if not chunk_text.strip():
            continue
        communicate = edge_tts.Communicate(
            chunk_text, voice_name, rate=rate_str, pitch=pitch_str
        )
        async for chunk in communicate.stream():
            # edge-tts 7.x: chunk["type"] is a string ("audio" or "SentenceBoundary")
            if chunk.get("type") == "audio":
                all_audio.write(chunk["data"])

    return all_audio.getvalue()


def proxy_baidu_tts(text, per, spd, pit):
    """
    代理百度TTS请求（服务端无CORS限制）
    :param text: 文本
    :param per: 发音人ID (0=度小美, 1=度小宇, 3=度逍遥, 4=度丫丫, 5=度小娇)
    :param spd: 语速 (1-9, 5=正常)
    :param pit: 音调 (1-9, 5=正常)
    :return: (音频字节数据, content_type) 或 (None, None)
    """
    encoded_text = urllib.parse.quote(text)
    urls = [
        f"https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd={spd}&pit={pit}&per={per}&ctp=1&text={encoded_text}",
        f"https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd={spd}&pit={pit}&per={per}&text={encoded_text}",
        f"https://fanyi.baidu.com/gettts?lan=zh&text={encoded_text}&spd={spd}&source=web",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://fanyi.baidu.com/",
            })
            resp = urllib.request.urlopen(req, timeout=8)
            content_type = resp.headers.get("Content-Type", "")
            data = resp.read()
            if len(data) > 100 and ("audio" in content_type or "octet" in content_type):
                return data, content_type
            print(f"  [Baidu TTS] URL returned non-audio: {content_type}, size={len(data)}")
        except Exception as e:
            print(f"  [Baidu TTS] Request failed: {e}")
    return None, None


class TTSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义请求处理器：支持TTS API和静态文件服务"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def _set_cors_headers(self):
        """设置CORS头（允许任何来源访问，方便本地调试）"""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def end_headers(self):
        self._set_cors_headers()
        super().end_headers()

    def do_OPTIONS(self):
        """处理CORS预检请求"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """处理GET请求"""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # ===== TTS API 端点 =====
        if path == "/api/tts":
            self._handle_tts_edge(params)
            return

        if path == "/api/tts_baidu":
            self._handle_tts_baidu(params)
            return

        if path == "/api/voices":
            self._handle_voices()
            return

        if path == "/api/health":
            self._handle_health()
            return

        # ===== 静态文件服务 =====
        super().do_GET()

    def _handle_tts_edge(self, params):
        """使用 edge-tts 生成语音"""
        text = params.get("text", [""])[0]
        voice_id = int(params.get("voice", ["1"])[0])
        rate_pct = int(params.get("rate", ["100"])[0])
        pitch_val = float(params.get("pitch", ["1.0"])[0])

        if not text or len(text) < 1:
            self.send_error(400, "Missing text parameter")
            return

        print(f"[TTS] edge-tts request: voice={voice_id}, rate={rate_pct}, pitch={pitch_val}, text={text[:50]}...")

        try:
            # 使用 asyncio.run 自动管理事件循环生命周期（含清理）
            audio_data = asyncio.run(
                generate_tts_edge(text, voice_id, rate_pct, pitch_val)
            )

            if audio_data and len(audio_data) > 100:
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(len(audio_data)))
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                self.wfile.write(audio_data)
                print(f"  [TTS] edge-tts success: {len(audio_data)} bytes")
            else:
                print("  [TTS] edge-tts returned empty data, trying Baidu fallback")
                self._tts_baidu_fallback(text, voice_id, rate_pct, pitch_val)

        except Exception as e:
            print(f"  [TTS] edge-tts error: {e}, trying Baidu fallback")
            self._tts_baidu_fallback(text, voice_id, rate_pct, pitch_val)

    def _tts_baidu_fallback(self, text, voice_id, rate_pct, pitch_val):
        """百度TTS备用方案"""
        # 映射到百度TTS的per参数
        baidu_per_map = {1: 0, 2: 1, 3: 5, 4: 3, 5: 3, 6: 4, 7: 4, 8: 3, 9: 0, 10: 1}
        per = baidu_per_map.get(voice_id, 0)

        # 语速和音调映射
        speed_mul = (rate_pct / 100.0) * 0.6 + 0.7
        spd = max(1, min(9, round(3 + speed_mul * 3)))
        pit = max(1, min(9, round(3 + pitch_val * 3)))

        audio_data, content_type = proxy_baidu_tts(text, per, spd, pit)

        if audio_data:
            self.send_response(200)
            self.send_header("Content-Type", content_type or "audio/mpeg")
            self.send_header("Content-Length", str(len(audio_data)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(audio_data)
            print(f"  [TTS] Baidu fallback success: {len(audio_data)} bytes")
        else:
            self.send_error(503, "All TTS services failed")

    def _handle_tts_baidu(self, params):
        """直接百度TTS代理端点"""
        text = params.get("text", [""])[0]
        per = int(params.get("per", ["0"])[0])
        spd = int(params.get("spd", ["5"])[0])
        pit = int(params.get("pit", ["5"])[0])

        if not text:
            self.send_error(400, "Missing text parameter")
            return

        audio_data, content_type = proxy_baidu_tts(text, per, spd, pit)

        if audio_data:
            self.send_response(200)
            self.send_header("Content-Type", content_type or "audio/mpeg")
            self.send_header("Content-Length", str(len(audio_data)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(audio_data)
        else:
            self.send_error(503, "Baidu TTS failed")

    def _handle_voices(self):
        """返回可用的语音列表"""
        voices_info = {}
        for vid, vname in VOICE_MAP.items():
            voices_info[vid] = {
                "edge_tts_voice": vname,
                "description": {
                    1: "晓晓（女声·温暖亲切）",
                    2: "云希（男声·温暖自然）",
                    3: "晓伊（女声·活泼明亮）",
                    4: "云扬（男声·专业沉稳）",
                    5: "云健（男声·浑厚有力）",
                    6: "晓双（女声·童声活泼）",
                    7: "晓墨（女声·成熟甜美）",
                    8: "云野（男声·沧桑成熟）",
                    9: "晓瑞（女声·优雅沉稳）",
                    10: "云扬（男声·商务专业）",
                }.get(vid, vname)
            }
        data = json.dumps(voices_info, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _handle_health(self):
        """健康检查端点"""
        data = json.dumps({
            "status": "ok",
            "service": "正商诸葛AI TTS Server",
            "tts_engine": "edge-tts + baidu-fallback",
            "port": PORT,
        }, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        """自定义日志格式"""
        msg = format % args
        # 只显示API请求和非200静态文件请求
        if "/api/" in msg or " 4" in msg or " 5" in msg:
            print(f"[{self.log_date_time_string()}] {msg}")


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """多线程HTTP服务器，支持并发请求"""
    daemon_threads = True
    allow_reuse_address = True


def main():
    print("=" * 60)
    print("  正商诸葛AI·爆款云剪智能体 - 本地服务器")
    print("=" * 60)
    print(f"  服务目录: {DIRECTORY}")
    print(f"  监听端口: {PORT}")
    print(f"  TTS引擎: edge-tts (微软神经网络语音) + 百度TTS备用")
    print(f"  访问地址: http://localhost:{PORT}")
    print("=" * 60)
    print()
    print("  可用端点:")
    print("    /api/tts        - edge-tts语音合成(推荐)")
    print("    /api/tts_baidu  - 百度TTS代理(备用)")
    print("    /api/voices     - 查看语音列表")
    print("    /api/health     - 健康检查")
    print()
    print("  按 Ctrl+C 停止服务器")
    print()

    with ThreadedHTTPServer(("0.0.0.0", PORT), TTSRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            sys.exit(0)


if __name__ == "__main__":
    main()
