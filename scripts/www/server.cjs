/**
 * 正商诸葛AI · 静态服务器（带 TTS 代理和 LLM 代理）
 *
 * 功能：
 * 1. 静态文件服务（dist 目录）
 * 2. /tts-proxy — TTS 语音合成代理（通过 WebSocket 连接微软 edge-tts 服务）
 * 3. /llm-proxy — LLM API 代理（通过 fetch 转发到任意 OpenAI 兼容 API）
 *
 * 用法：node server.cjs [端口号]
 * 默认端口：8080
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { WebSocket } = require("ws");

const PORT = parseInt(process.argv[2]) || 8080;
const DIST_DIR = path.join(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html;charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
};

// ========== TTS 代理：通过 WebSocket 连接微软 edge-tts 服务 ==========

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const TTS_WS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

/**
 * 通过 WebSocket 合成 TTS 音频
 * 服务端发起 WebSocket 连接，不受浏览器 Origin 限制
 */
function synthesizeViaWebSocket(text, voice, rate, pitch) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID().replace(/-/g, "").toUpperCase();

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>
      <voice name='${voice}'>
        <prosody rate='${rate}' pitch='${pitch}'>${text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c))}</prosody>
      </voice>
    </speak>`;

    const ws = new WebSocket(TTS_WS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      },
    });

    const audioChunks = [];
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        try { ws.close(); } catch {}
        reject(new Error("TTS WebSocket 超时（15s）"));
      }
    }, 15000);

    ws.on("open", () => {
      console.log("[TTS Proxy] WebSocket 已连接");

      // 1. 发送音频配置
      const configMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "false",
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });
      ws.send(configMsg);

      // 2. 发送 SSML 合成请求
      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    });

    ws.on("message", (data, isBinary) => {
      if (!isBinary) {
        // 文本消息
        const text = data.toString();
        if (text.includes("Path:turn.end")) {
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          if (audioChunks.length > 0) {
            const audioBuffer = Buffer.concat(audioChunks);
            console.log(`[TTS Proxy] 合成成功，${audioChunks.length} 个音频块，共 ${(audioBuffer.length / 1024).toFixed(1)}KB`);
            resolve(audioBuffer);
          } else {
            reject(new Error("TTS 未返回音频数据"));
          }
        }
      } else {
        // 二进制消息：音频数据（跳过前 2 字节 header）
        if (data.length > 2) {
          audioChunks.push(data.slice(2));
        }
      }
    });

    ws.on("error", (err) => {
      if (!resolved) {
        clearTimeout(timeout);
        console.error("[TTS Proxy] WebSocket 错误:", err.message);
        reject(new Error(`TTS WebSocket 连接失败: ${err.message}`));
      }
    });

    ws.on("close", () => {
      if (!resolved) {
        clearTimeout(timeout);
        if (audioChunks.length > 0) {
          resolved = true;
          const audioBuffer = Buffer.concat(audioChunks);
          console.log(`[TTS Proxy] 连接关闭，返回已收到的 ${audioChunks.length} 个音频块`);
          resolve(audioBuffer);
        } else {
          reject(new Error("TTS 连接关闭且未收到音频数据"));
        }
      }
    });
  });
}

/**
 * 通过 Python edge-tts CLI 合成音频
 * 使用 `python -m edge_tts` 命令行工具，文本通过 --text 参数传递
 * Node.js spawn 正确处理 Unicode 命令行参数，已验证中文文本可用
 */
function synthesizeViaPython(text, voice, rate, pitch) {
  return new Promise((resolve, reject) => {
    const tmpAudioFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

    const args = [
      "-m", "edge_tts",
      "--voice", voice,
      "--rate", rate || "+0%",
      "--pitch", pitch || "+0Hz",
      "--text", text,
      "--write-media", tmpAudioFile,
    ];

    console.log(`[TTS Proxy] 启动 edge-tts CLI: voice=${voice}, text长度=${text.length}`);

    const proc = spawn("python", args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      cwd: __dirname,
    });

    let stderrData = "";
    proc.stderr.on("data", (chunk) => stderrData += chunk.toString("utf-8"));

    const cleanup = () => {
      try { fs.unlink(tmpAudioFile, () => {}); } catch {}
    };

    const timeout = setTimeout(() => {
      proc.kill();
      cleanup();
      reject(new Error("Python TTS 超时（5s）"));
    }, 5000);

    proc.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        cleanup();
        reject(new Error(`Python TTS 错误 (exit ${code}): ${stderrData.trim()}`));
        return;
      }

      fs.readFile(tmpAudioFile, (err, data) => {
        cleanup();

        if (err) {
          reject(new Error(`读取 TTS 音频文件失败: ${err.message}`));
          return;
        }

        if (data.length === 0) {
          reject(new Error("Python TTS 未输出音频数据"));
          return;
        }

        console.log(`[TTS Proxy] CLI 合成成功，${(data.length / 1024).toFixed(1)}KB`);
        resolve(data);
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error(`Python 启动失败: ${err.message}`));
    });
  });
}

/**
 * TTS 代理处理函数
 * ★ 优先使用 Node.js WebSocket 直连（始终可用，无需 Python），失败后回退到 Python edge-tts CLI
 * 之前的顺序（Python优先）导致：Python不存在时等待30s超时 → 回退WebSocket → 总延迟30s+
 * 现在WebSocket优先：15s内完成，Python不存在时不会浪费时间
 */
async function handleTtsProxy(req, res) {
  // CORS 预检
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // 收集请求体
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);

  let params;
  try {
    params = JSON.parse(body.toString());
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  const { text, voice, rate, pitch } = params;
  if (!text || !voice) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing 'text' or 'voice' parameter" }));
    return;
  }

  console.log(`[TTS Proxy] 开始合成: voice=${voice}, rate=${rate || "+0%"}, pitch=${pitch || "+0Hz"}, text长度=${text.length}`);

  // ★ 方案 1：优先使用 Node.js WebSocket 直连（最可靠，始终可用）
  try {
    const audioData = await synthesizeViaWebSocket(text, voice, rate || "+0%", pitch || "+0Hz");
    res.writeHead(200, {
      "Content-Type": "audio/mp3",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": audioData.length,
    });
    res.end(audioData);
    return;
  } catch (wsErr) {
    console.warn(`[TTS Proxy] WebSocket 失败: ${wsErr.message}，回退到 Python`);
  }

  // 方案 2：回退到 Python edge-tts CLI（需要安装 Python + edge_tts 包）
  try {
    const audioData = await synthesizeViaPython(text, voice, rate || "+0%", pitch || "+0Hz");
    res.writeHead(200, {
      "Content-Type": "audio/mp3",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": audioData.length,
    });
    res.end(audioData);
  } catch (pyErr) {
    console.error("[TTS Proxy] Python 也失败:", pyErr.message);
    res.writeHead(502, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify({ error: `TTS 合成失败: ${pyErr.message}` }));
  }
}

// ========== LLM 代理 ==========

async function handleLlmProxy(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-target-url",
    });
    res.end();
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);

  const targetUrl = req.headers["x-target-url"];
  if (!targetUrl) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing x-target-url header" }));
    return;
  }

  try {
    const url = new URL(targetUrl);
    const proxyRes = await fetch(targetUrl, {
      method: req.method || "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers["authorization"] || "",
        Host: url.host,
      },
      body: body.length > 0 ? body : undefined,
    });

    const respBody = await proxyRes.text();
    res.writeHead(proxyRes.status, {
      "Content-Type": proxyRes.headers.get("content-type") || "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(respBody);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
  }
}

// ========== 静态文件服务 ==========

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // TTS 代理
  if (pathname === "/tts-proxy") {
    return handleTtsProxy(req, res);
  }

  // LLM 代理
  if (pathname.startsWith("/llm-proxy")) {
    return handleLlmProxy(req, res);
  }

  // 静态文件
  let filePath = path.join(DIST_DIR, pathname.split("?")[0]);
  if (filePath === path.join(DIST_DIR, "") || filePath === path.join(DIST_DIR, path.sep)) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  // SPA 路由回退：如果文件不存在，尝试 index.html
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 尝试 SPA 回退
      const indexPath = path.join(DIST_DIR, "index.html");
      fs.readFile(indexPath, (err2, indexData) => {
        if (err2) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
          return;
        }
        res.writeHead(200, {
          "Content-Type": "text/html;charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n============================================`);
  console.log(`  正商诸葛AI · 静态服务器已启动`);
  console.log(`============================================`);
  console.log(`  本机访问:   http://localhost:${PORT}`);
  console.log(`  局域网访问: http://<本机IP>:${PORT}`);
  console.log(`  TTS 代理:   http://localhost:${PORT}/tts-proxy`);
  console.log(`  LLM 代理:   http://localhost:${PORT}/llm-proxy`);
  console.log(`============================================\n`);
});
