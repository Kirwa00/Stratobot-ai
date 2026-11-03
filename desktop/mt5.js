// Finds MetaTrader 5 terminals on this PC, copies an EA into their Experts
// folder and compiles it with that terminal's MetaEditor.
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const TERMINAL_ID = /^[0-9A-F]{32}$/i;

/** origin.txt (install folder of a terminal) is usually UTF-16LE with a BOM. */
function decodeText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString("utf16le");
  if (buf.length >= 2 && buf[1] === 0x00) return buf.toString("utf16le");
  return buf.toString("utf8").replace(/^\uFEFF/, "");
}

function findTerminals(appData = process.env.APPDATA) {
  if (!appData) return [];
  const root = path.join(appData, "MetaQuotes", "Terminal");
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const terminals = [];
  for (const e of entries) {
    if (!e.isDirectory() || !TERMINAL_ID.test(e.name)) continue;
    const dataDir = path.join(root, e.name);
    const mql5 = path.join(dataDir, "MQL5");
    if (!fs.existsSync(mql5)) continue;
    let installDir = null;
    try {
      installDir = decodeText(fs.readFileSync(path.join(dataDir, "origin.txt"))).trim() || null;
    } catch {}
    const metaeditor = installDir ? path.join(installDir, "metaeditor64.exe") : null;
    terminals.push({
      id: e.name,
      dataDir,
      expertsDir: path.join(mql5, "Experts"),
      installDir,
      name: installDir ? path.basename(installDir) : `Terminal ${e.name.slice(0, 6)}`,
      metaeditor: metaeditor && fs.existsSync(metaeditor) ? metaeditor : null,
    });
  }
  return terminals.sort((a, b) => a.name.localeCompare(b.name));
}

/** Copies the EA into MQL5/Experts/StratoBot and returns the new path. */
function installEa(terminal, sourceFile) {
  const dir = path.join(terminal.expertsDir, "StratoBot");
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, path.basename(sourceFile));
  fs.copyFileSync(sourceFile, dest);
  return dest;
}

/** MetaEditor's log ends with e.g. "Result: 0 errors, 2 warnings". */
function parseCompileLog(text) {
  const m = /(\d+)\s+errors?,\s*(\d+)\s+warnings?/i.exec(text);
  return m ? { errors: Number(m[1]), warnings: Number(m[2]) } : null;
}

function compileEa(terminal, file, run = execFile) {
  return new Promise((resolve) => {
    if (!terminal.metaeditor) {
      resolve({ ok: false, reason: "MetaEditor wasn't found next to this terminal." });
      return;
    }
    const logFile = file.replace(/\.mq5$/i, ".log");
    const ex5 = file.replace(/\.mq5$/i, ".ex5");
    try {
      fs.rmSync(ex5, { force: true });
    } catch {}
    // MetaEditor's exit code isn't meaningful; the log and the .ex5 are.
    run(terminal.metaeditor, [`/compile:${file}`, `/log:${logFile}`], { timeout: 120_000, windowsHide: true }, () => {
      let log = "";
      try {
        log = decodeText(fs.readFileSync(logFile));
      } catch {}
      const result = parseCompileLog(log);
      const built = fs.existsSync(ex5);
      resolve({
        ok: built && (!result || result.errors === 0),
        errors: result?.errors ?? null,
        warnings: result?.warnings ?? null,
        log: log.trim().split(/\r?\n/).slice(-12).join("\n"),
      });
    });
  });
}

module.exports = { decodeText, findTerminals, installEa, parseCompileLog, compileEa };
