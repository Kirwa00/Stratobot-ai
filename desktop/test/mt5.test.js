const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const mt5 = require("../mt5");

function utf16(s) {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, "utf16le")]);
}

test("finds terminals from the MetaQuotes data folder", () => {
  const appData = fs.mkdtempSync(path.join(os.tmpdir(), "sb-"));
  const root = path.join(appData, "MetaQuotes", "Terminal");
  const install = path.join(appData, "Program Files", "XM Global MT5");
  fs.mkdirSync(install, { recursive: true });
  fs.writeFileSync(path.join(install, "metaeditor64.exe"), "");
  const a = path.join(root, "D0E8209F77C8CF37AD8BF550E51FF075");
  fs.mkdirSync(path.join(a, "MQL5", "Experts"), { recursive: true });
  fs.writeFileSync(path.join(a, "origin.txt"), utf16(install));
  const b = path.join(root, "0123456789ABCDEF0123456789ABCDEF");
  fs.mkdirSync(path.join(b, "MQL5"), { recursive: true });
  fs.mkdirSync(path.join(root, "Common"), { recursive: true });
  fs.mkdirSync(path.join(root, "Community"), { recursive: true });

  const found = mt5.findTerminals(appData);
  assert.equal(found.length, 2);
  const xm = found.find((t) => t.name === "XM Global MT5");
  assert.ok(xm);
  assert.equal(xm.metaeditor, path.join(install, "metaeditor64.exe"));
  const other = found.find((t) => t.id === "0123456789ABCDEF0123456789ABCDEF");
  assert.equal(other.metaeditor, null);

  const src = path.join(appData, "my-bot.mq5");
  fs.writeFileSync(src, "// ea");
  const dest = mt5.installEa(xm, src);
  assert.equal(dest, path.join(a, "MQL5", "Experts", "StratoBot", "my-bot.mq5"));
  assert.equal(fs.readFileSync(dest, "utf8"), "// ea");
});

test("no APPDATA or no MetaQuotes folder means no terminals", () => {
  assert.deepEqual(mt5.findTerminals(undefined), []);
  assert.deepEqual(mt5.findTerminals(fs.mkdtempSync(path.join(os.tmpdir(), "sb-"))), []);
});

test("reads MetaEditor's compile result", () => {
  assert.deepEqual(mt5.parseCompileLog("...\r\nResult: 0 errors, 2 warnings, 512 msec elapsed"), { errors: 0, warnings: 2 });
  assert.deepEqual(mt5.parseCompileLog("Result: 1 error, 0 warnings"), { errors: 1, warnings: 0 });
  assert.equal(mt5.parseCompileLog(""), null);
  assert.equal(mt5.decodeText(utf16("Result: 0 errors, 0 warnings")), "Result: 0 errors, 0 warnings");
});

test("compile reports success when MetaEditor writes the .ex5 and 0 errors", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-"));
  const file = path.join(dir, "bot.mq5");
  fs.writeFileSync(file, "");
  const fakeRun = (_exe, args, _opts, done) => {
    const log = args.find((a) => a.startsWith("/log:")).slice(5);
    fs.writeFileSync(log, utf16("bot.mq5 : information: compiling\r\nResult: 0 errors, 0 warnings"));
    fs.writeFileSync(file.replace(/\.mq5$/, ".ex5"), "");
    done(null);
  };
  const r = await mt5.compileEa({ metaeditor: "metaeditor64.exe" }, file, fakeRun);
  assert.equal(r.ok, true);
  assert.equal(r.errors, 0);

  const failing = (_exe, args, _opts, done) => {
    fs.writeFileSync(args[1].slice(5), utf16("Result: 3 errors, 0 warnings"));
    done(null);
  };
  const bad = await mt5.compileEa({ metaeditor: "metaeditor64.exe" }, file, failing);
  assert.equal(bad.ok, false);
  assert.equal(bad.errors, 3);
});
