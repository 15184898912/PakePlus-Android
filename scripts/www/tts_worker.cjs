/**
 * TTS 子进程工作脚本
 * 从 server.cjs 通过 spawn 调用，在独立进程中执行 WebSocket TTS 合成
 *
 * 用法: node tts_worker.cjs <text|textFile> <voice> <rate> <pitch> <outputFile> [--from-file]
 *   --from-file: 第一个参数是文本文件路径而非文本本身
 * 输出: 音频写入 outputFile，成功时 stdout 输出 "OK:<size>"，失败时 "ERROR:<message>"
 */

const crypto = require("crypto");
const fs = require("fs");
const { WebSocket } = require("ws");

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600;

// 解析参数
const useFile = process.argv.includes("--from-file");
const arg1 = process.argv[2] || "";
const voice = process.argv[3] || "zh-CN-XiaoxiaoNeural";
const rate = process.argv[4] || "+0%";
const pitch = process.argv[5] || "+0Hz";
const outputFile = process.argv[6] || "";

let text = "";
if (useFile && arg1) {
  try {
    // ★ 读取 base64 编码的文本并解码为 UTF-8，避免编码问题
    const raw = fs.readFileSync(arg1, "ascii");
    text = Buffer.from(raw, "base64").toString("utf-8");
    console.error(`[Worker] 从文件读取文本: ${text.length} 字`);
  } catch (e) {
    console.log(`ERROR:读取文本文件失败: ${e.message}`);
    process.exit(1);
  }
} else {
  text = arg1;
}

if (!text) {
  console.log("ERROR:No text provided");
  process.exit(1);
}

console.error(`[Worker] 文本: "${text.substring(0, 30)}..." (${text.length} 字)`);
console.error(`[Worker] 音色: ${voice}, 语速: ${rate}, 音调: ${pitch}`);

function generateSecMsGec() {
  let ticks = Math.floor(Date.now() / 1000);
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= 10000000;
  const strToHash = `${ticks}${TRUSTED_TOKEN}`;
  return crypto.createHash("sha256").update(strToHash, "ascii").digest("hex").toUpperCase();
}

function generateMuid() {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

const requestId = crypto.randomUUID().replace(/-/g, "").toUpperCase();
const connectionId = crypto.randomUUID().replace(/-/g, "").toUpperCase();
const secMsGec = generateSecMsGec();
const muid = generateMuid();

console.error(`[Worker] Sec-MS-GEC: ${secMsGec.substring(0, 16)}...`);

const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
  `?TrustedClientToken=${TRUSTED_TOKEN}` +
  `&ConnectionId=${connectionId}` +
  `&Sec-MS-GEC=${secMsGec}` +
  `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

const escapedText = text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'><voice name='${voice}'><prosody rate='${rate}' pitch='${pitch}'>${escapedText}</prosody></voice></speak>`;

console.error(`[Worker] SSML 长度: ${ssml.length}`);

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
let msgCount = 0;

const timeout = setTimeout(() => {
  if (!resolved) {
    resolved = true;
    try { ws.close(); } catch {}
    console.error(`[Worker] 超时 (15s), 收到 ${msgCount} 条消息, ${audioChunks.length} 个音频块`);
    console.log("ERROR:TTS timeout (15s)");
    process.exit(1);
  }
}, 15000);

ws.on("open", () => {
  console.error("[Worker] WebSocket 已连接");

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

  const ssmlMsg =
    `X-RequestId:${requestId}\r\n` +
    `Content-Type:application/ssml+xml\r\n` +
    `Path:ssml\r\n\r\n` +
    ssml;
  ws.send(ssmlMsg);
  console.error("[Worker] 已发送 config 和 SSML");
});

ws.on("message", (data, isBinary) => {
  msgCount++;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (!isBinary) {
    const text = buf.toString("utf-8");
    const pathMatch = text.match(/Path:([^\r\n]+)/);
    console.error(`[Worker] MSG#${msgCount} TEXT: ${pathMatch ? pathMatch[1].trim() : '?'}`);

    if (text.includes("Path:turn.end")) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        ws.close();

        if (audioChunks.length > 0) {
          const audioBuffer = Buffer.concat(audioChunks);
          if (outputFile) {
            try {
              fs.writeFileSync(outputFile, audioBuffer);
              console.log(`OK:${audioBuffer.length}`);
            } catch (e) {
              console.log(`ERROR:Write file failed: ${e.message}`);
            }
          } else {
            process.stdout.write(audioBuffer);
            console.error(`OK:${audioBuffer.length}`);
          }
          console.error(`[Worker] 成功: ${audioChunks.length} 块, ${audioBuffer.length} 字节`);
          process.exit(0);
        } else {
          console.error(`[Worker] 失败: 收到 ${msgCount} 条消息但无音频`);
          console.log("ERROR:No audio data received");
          process.exit(1);
        }
      }
    }
  } else {
    if (buf.length > 2) {
      const headerLen = buf.readUInt16BE(0);
      const audioStart = 2 + headerLen;
      const audioBytes = buf.length - audioStart;
      console.error(`[Worker] MSG#${msgCount} BINARY: len=${buf.length}, header=${headerLen}, audio=${audioBytes}`);
      if (audioStart < buf.length) {
        audioChunks.push(buf.slice(audioStart));
      }
    }
  }
});

ws.on("error", (err) => {
  if (!resolved) {
    resolved = true;
    clearTimeout(timeout);
    console.error(`[Worker] WebSocket 错误: ${err.message}`);
    console.log(`ERROR:WebSocket error: ${err.message}`);
    process.exit(1);
  }
});

ws.on("unexpected-response", (req, res) => {
  if (!resolved) {
    resolved = true;
    clearTimeout(timeout);
    let body = "";
    res.on("data", (chunk) => body += chunk.toString());
    res.on("end", () => {
      console.error(`[Worker] HTTP ${res.statusCode}: ${body.substring(0, 200)}`);
      console.log(`ERROR:HTTP ${res.statusCode}`);
      process.exit(1);
    });
  }
});

ws.on("close", () => {
  console.error(`[Worker] 连接关闭 (收到 ${msgCount} 条消息, ${audioChunks.length} 个音频块)`);
  if (!resolved) {
    resolved = true;
    clearTimeout(timeout);
    if (audioChunks.length > 0) {
      const audioBuffer = Buffer.concat(audioChunks);
      if (outputFile) {
        try {
          fs.writeFileSync(outputFile, audioBuffer);
          console.log(`OK:${audioBuffer.length}`);
        } catch (e) {
          console.log(`ERROR:Write file failed: ${e.message}`);
        }
      } else {
        process.stdout.write(audioBuffer);
        console.error(`OK:${audioBuffer.length}`);
      }
      process.exit(0);
    } else {
      console.log("ERROR:Connection closed with no audio");
      process.exit(1);
    }
  }
});
