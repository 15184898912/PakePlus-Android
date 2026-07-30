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
// ★ 智能检测：如果 __dirname 下已有 index.html，说明 server.cjs 已在 dist 目录中
// 否则使用 __dirname/dist（从项目根目录运行时）
const DIST_DIR = fs.existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : path.join(__dirname, "dist");

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
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600;

/**
 * ★ 生成 Sec-MS-GEC 认证令牌（2025年微软更新后的必需认证）
 * 算法来源: edge-tts Python 库 drm.py
 * 1. 获取当前 Unix 时间戳
 * 2. 加上 Windows epoch 偏移量 (11644473600)
 * 3. 向下取整到最近的 5 分钟 (300 秒)
 * 4. 转换为 100 纳秒间隔 (乘以 10000000)
 * 5. 拼接 TrustedClientToken 后计算 SHA256
 * 6. 返回大写十六进制字符串
 */
function generateSecMsGec() {
  let ticks = Math.floor(Date.now() / 1000); // Unix 时间戳（秒）
  ticks += WIN_EPOCH;                         // 转为 Windows epoch
  ticks -= ticks % 300;                        // 向下取整到 5 分钟
  ticks *= 10000000;                           // 转为 100 纳秒间隔
  const strToHash = `${ticks}${TRUSTED_TOKEN}`;
  return crypto.createHash("sha256").update(strToHash, "ascii").digest("hex").toUpperCase();
}

/**
 * 生成随机 MUID（32 位大写十六进制）
 */
function generateMuid() {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

/**
 * 通过 WebSocket 合成 TTS 音频
 * ★ 2025年更新：必须包含 Sec-MS-GEC 认证令牌，否则返回 403
 */
function synthesizeViaWebSocket(text, voice, rate, pitch) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID().replace(/-/g, "").toUpperCase();
    const connectionId = crypto.randomUUID().replace(/-/g, "").toUpperCase();
    const secMsGec = generateSecMsGec();
    const muid = generateMuid();

    // ★ 构建包含 Sec-MS-GEC 认证的 WebSocket URL
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
      `?TrustedClientToken=${TRUSTED_TOKEN}` +
      `&ConnectionId=${connectionId}` +
      `&Sec-MS-GEC=${secMsGec}` +
      `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

    // ★ SSML 必须为单行格式（多行/缩进会导致 TTS 服务不返回音频）
    const escapedText = text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'><voice name='${voice}'><prosody rate='${rate}' pitch='${pitch}'>${escapedText}</prosody></voice></speak>`;

    const ws = new WebSocket(wsUrl, {
      headers: {
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "Sec-WebSocket-Version": "13",
        "Cookie": `muid=${muid};`,
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
      // ★ 确保 data 是 Buffer（ws 不同版本可能返回 ArrayBuffer 或 Buffer[]）
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

      if (!isBinary) {
        // 文本消息
        const text = buf.toString("utf-8");
        // ★ 记录所有文本消息的 Path，用于诊断
        const pathMatch = text.match(/Path:([^\r\n]+)/);
        console.log(`[TTS Proxy] 文本消息: Path=${pathMatch ? pathMatch[1].trim() : '(unknown)'}`);
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
        // ★ 二进制消息格式：[2字节大端头部长度][文本头部][音频数据]
        // 之前只 slice(2) 导致文本头部混入音频，必须用头部长度正确剥离
        if (buf.length > 2) {
          const headerLen = buf.readUInt16BE(0);
          const audioStart = 2 + headerLen;
          if (audioStart < buf.length) {
            const audioData = buf.slice(audioStart);
            audioChunks.push(audioData);
            console.log(`[TTS Proxy] 收到音频块 #${audioChunks.length}: ${audioData.length} bytes (headerLen=${headerLen})`);
          } else {
            // 仅含头部无音频数据的消息（如 metadata），跳过
            console.log(`[TTS Proxy] 跳过无音频的二进制消息 (len=${buf.length}, headerLen=${headerLen})`);
          }
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

    // ★ 捕获 HTTP 层面的拒绝（如 403），ws 库可能不触发 error 事件
    ws.on("unexpected-response", (req, res) => {
      if (!resolved) {
        clearTimeout(timeout);
        let body = "";
        res.on("data", (chunk) => body += chunk.toString());
        res.on("end", () => {
          console.error(`[TTS Proxy] HTTP ${res.statusCode}: ${body.substring(0, 200)}`);
          reject(new Error(`TTS HTTP ${res.statusCode}: ${res.statusMessage || body.substring(0, 100)}`));
        });
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
 * ★ 通过子进程调用 tts_worker.cjs 进行 TTS 合成
 * 解决：服务器进程内 WebSocket 只收到元数据不收到音频的问题
 * 子进程方式与独立测试脚本环境一致，可靠收到完整音频
 */
function synthesizeViaWorker(text, voice, rate, pitch) {
  return new Promise((resolve, reject) => {
    const tmpAudioFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
    const tmpTextFile = path.join(os.tmpdir(), `tts_text_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`);
    const workerScript = path.join(__dirname, "tts_worker.cjs");

    // ★ 将文本写入临时文件，使用 base64 编码避免编码问题
    try {
      fs.writeFileSync(tmpTextFile, Buffer.from(text, "utf-8").toString("base64"));
    } catch (e) {
      reject(new Error(`写入文本文件失败: ${e.message}`));
      return;
    }

    const args = [
      workerScript,
      tmpTextFile,
      voice,
      rate || "+0%",
      pitch || "+0Hz",
      tmpAudioFile,
      "--from-file",
    ];

    console.log(`[TTS Proxy] 启动 tts_worker 子进程: voice=${voice}, text长度=${text.length}`);

    const proc = spawn("node", args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      cwd: __dirname,
    });

    let stdoutData = "";
    let stderrData = "";
    proc.stdout.on("data", (chunk) => stdoutData += chunk.toString("utf-8"));
    proc.stderr.on("data", (chunk) => {
      stderrData += chunk.toString("utf-8");
      // ★ 实时输出 worker 的 stderr 日志
      process.stderr.write(chunk);
    });

    const cleanup = () => {
      try { fs.unlink(tmpAudioFile, () => {}); } catch {}
    };

    const timeout = setTimeout(() => {
      proc.kill();
      cleanup();
      reject(new Error("tts_worker 超时（20s）"));
    }, 20000);

    proc.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        cleanup();
        const errMsg = stdoutData.trim() || stderrData.trim() || `exit code ${code}`;
        reject(new Error(`tts_worker 失败: ${errMsg}`));
        return;
      }

      // 检查 stdout 中的 OK 消息
      const okMatch = stdoutData.match(/OK:(\d+)/);
      if (!okMatch) {
        cleanup();
        reject(new Error(`tts_worker 未返回成功: ${stdoutData.trim()}`));
        return;
      }

      fs.readFile(tmpAudioFile, (err, data) => {
        cleanup();

        if (err) {
          reject(new Error(`读取 tts_worker 音频文件失败: ${err.message}`));
          return;
        }

        if (data.length === 0) {
          reject(new Error("tts_worker 未输出音频数据"));
          return;
        }

        console.log(`[TTS Proxy] tts_worker 合成成功，${(data.length / 1024).toFixed(1)}KB`);
        resolve(data);
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error(`tts_worker 启动失败: ${err.message}`));
    });
  });
}

/**
 * TTS 代理处理函数
 * ★ 优先使用 tts_worker 子进程（最可靠，解决进程内 WebSocket 不收音频的问题）
 * 失败后回退到 Python edge-tts CLI
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

  // ★ 统一 rate 格式为字符串（如 "+8%"），兼容数字格式（如 8）
  let rateStr = rate || "+0%";
  if (typeof rateStr === "number") {
    rateStr = (rateStr >= 0 ? "+" : "") + rateStr + "%";
  }
  const pitchStr = pitch || "+0Hz";

  console.log(`[TTS Proxy] 开始合成: voice=${voice}, rate=${rateStr}, pitch=${pitchStr}, text长度=${text.length}`);

  // ★ 方案 1：优先使用 tts_worker 子进程（最可靠，独立进程 WebSocket 连接稳定）
  try {
    const audioData = await synthesizeViaWorker(text, voice, rateStr, pitchStr);
    res.writeHead(200, {
      "Content-Type": "audio/mp3",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": audioData.length,
    });
    res.end(audioData);
    return;
  } catch (workerErr) {
    console.warn(`[TTS Proxy] tts_worker 失败: ${workerErr.message}，回退到进程内 WebSocket`);
  }

  // ★ 方案 2：进程内 WebSocket 直连（tts_worker 失败时的可靠回退）
  try {
    const audioData = await synthesizeViaWebSocket(text, voice, rateStr, pitchStr);
    res.writeHead(200, {
      "Content-Type": "audio/mp3",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": audioData.length,
    });
    res.end(audioData);
    return;
  } catch (wsErr) {
    console.warn(`[TTS Proxy] 进程内 WebSocket 失败: ${wsErr.message}，回退到 Python`);
  }

  // 方案 3：最后回退到 Python edge-tts CLI（需要安装 Python + edge_tts 包）
  try {
    const audioData = await synthesizeViaPython(text, voice, rateStr, pitchStr);
    res.writeHead(200, {
      "Content-Type": "audio/mp3",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": audioData.length,
    });
    res.end(audioData);
  } catch (pyErr) {
    console.error("[TTS Proxy] 所有方案均失败:", pyErr.message);
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

  // ★ TTS 健康检查（轻量级，用于客户端预检服务是否可用）
  if (pathname === "/tts-health" || pathname === "/api/tts-health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });
    res.end(JSON.stringify({
      status: "ok",
      service: "tts-proxy",
      timestamp: Date.now(),
      methods: ["worker", "websocket", "python"],
    }));
    return;
  }

  // TTS 代理（同时支持 /tts-proxy 和 /api/tts 两个路径）
  if (pathname === "/tts-proxy" || pathname === "/api/tts") {
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
  console.log(`  健康检查:   http://localhost:${PORT}/tts-health`);
  console.log(`  LLM 代理:   http://localhost:${PORT}/llm-proxy`);
  console.log(`============================================\n`);
});

// ========== 防崩溃处理：确保服务长期运行 ==========

// 捕获未处理的 Promise rejection（防止 TTS/LLM 异步操作崩溃服务器）
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] 未处理的 Promise Rejection:", reason);
  // 不退出进程，仅记录错误
});

// 捕获未处理的同步异常
process.on("uncaughtException", (err) => {
  console.error("[Server] 未处理的异常:", err.message);
  console.error(err.stack);
  // 记录错误但不退出，让服务继续运行
  // 如果是严重错误（如端口占用），keep_alive.cjs 守护进程会自动重启
});

// 捕获 HTTP 请求中的异常（防止客户端异常断开导致崩溃）
server.on("clientError", (err, socket) => {
  console.warn("[Server] 客户端错误:", err.message);
  try {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  } catch {
    // socket 已关闭，忽略
  }
});

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n[Server] 收到退出信号，正在关闭...");
  server.close(() => {
    console.log("[Server] 已关闭");
    process.exit(0);
  });
  // 5 秒后强制退出
  setTimeout(() => process.exit(0), 5000);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000);
});
