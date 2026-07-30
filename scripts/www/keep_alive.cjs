/**
 * 正商诸葛AI · TTS 服务守护进程
 *
 * 功能：
 * 1. 自动启动 server.cjs 并持续监控
 * 2. 子进程崩溃时自动重启（3 秒延迟）
 * 3. 最多连续重启 10 次，超过后停止并报错
 * 4. 支持 Ctrl+C 优雅退出（终止子进程后退出）
 *
 * 用法：node keep_alive.cjs [端口号]
 * 默认端口：8080
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = parseInt(process.argv[2]) || 8080;
const MAX_RESTARTS = 10;
const RESTART_DELAY = 3000; // 3 秒

let restartCount = 0;
let childProcess = null;
let isShuttingDown = false;

/**
 * 启动 server.cjs 子进程
 */
function startServer() {
  if (isShuttingDown) return;

  const serverScript = path.join(__dirname, "server.cjs");
  if (!fs.existsSync(serverScript)) {
    console.error(`[KeepAlive] 错误：找不到 ${serverScript}`);
    process.exit(1);
  }

  console.log(`\n[KeepAlive] 启动服务器 (第 ${restartCount + 1} 次)...`);

  childProcess = spawn("node", [serverScript, PORT.toString()], {
    cwd: __dirname,
    stdio: "inherit", // 共享标准输入输出，直接显示服务器日志
    windowsHide: false,
  });

  // 子进程退出时的处理
  childProcess.on("exit", (code, signal) => {
    childProcess = null;

    if (isShuttingDown) {
      console.log("[KeepAlive] 服务器已关闭，守护进程退出");
      process.exit(0);
    }

    if (code === 0) {
      console.log(`[KeepAlive] 服务器正常退出 (code=${code})`);
      process.exit(0);
    }

    // 异常退出，准备重启
    restartCount++;
    console.error(`[KeepAlive] 服务器异常退出 (code=${code}, signal=${signal})`);

    if (restartCount >= MAX_RESTARTS) {
      console.error(`[KeepAlive] 已达到最大重启次数 (${MAX_RESTARTS})，停止重启`);
      console.error("[KeepAlive] 请检查 server.cjs 是否有错误，修复后重新运行");
      process.exit(1);
    }

    console.log(`[KeepAlive] ${RESTART_DELAY / 1000} 秒后自动重启 (剩余 ${MAX_RESTARTS - restartCount} 次)...`);
    setTimeout(startServer, RESTART_DELAY);
  });

  childProcess.on("error", (err) => {
    console.error(`[KeepAlive] 启动失败: ${err.message}`);
    if (!isShuttingDown) {
      restartCount++;
      if (restartCount < MAX_RESTARTS) {
        console.log(`[KeepAlive] ${RESTART_DELAY / 1000} 秒后重试...`);
        setTimeout(startServer, RESTART_DELAY);
      } else {
        process.exit(1);
      }
    }
  });
}

// 优雅退出：Ctrl+C 时先终止子进程
process.on("SIGINT", () => {
  console.log("\n[KeepAlive] 收到退出信号，正在关闭服务器...");
  isShuttingDown = true;
  if (childProcess) {
    childProcess.kill("SIGTERM");
    // 5 秒后强制终止
    setTimeout(() => {
      if (childProcess) {
        childProcess.kill("SIGKILL");
      }
      process.exit(0);
    }, 5000);
  } else {
    process.exit(0);
  }
});

process.on("SIGTERM", () => {
  isShuttingDown = true;
  if (childProcess) {
    childProcess.kill("SIGTERM");
  } else {
    process.exit(0);
  }
});

// 启动
console.log("============================================");
console.log("  正商诸葛AI · TTS 服务守护进程");
console.log("============================================");
console.log(`  端口: ${PORT}`);
console.log(`  最大重启次数: ${MAX_RESTARTS}`);
console.log(`  重启延迟: ${RESTART_DELAY / 1000}s`);
console.log("  按 Ctrl+C 停止服务");
console.log("============================================");

startServer();
