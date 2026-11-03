const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const mt5 = require("./mt5");
const licence = require("./licence");

const SITE = (process.env.STRATOBOT_URL || "https://www.stratobot.trade").replace(/\/$/, "");
const ORIGIN = new URL(SITE).origin;
const START_URL = `${SITE}/app`;
const BG = "#0e1420";

let mainWindow = null;
let licenceWindow = null;
let store = null;
let machine = null;
let licenceNotice = null;

if (!app.requestSingleInstanceLock()) app.quit();

app.on("second-instance", () => {
  const w = mainWindow || licenceWindow;
  if (!w) return;
  if (w.isMinimized()) w.restore();
  w.focus();
});

const isSite = (url) => {
  try {
    return new URL(url).origin === ORIGIN;
  } catch {
    return false;
  }
};

const openExternal = (url) => {
  if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
};

function eaFolder() {
  const dir = path.join(app.getPath("documents"), "StratoBot");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function message(opts) {
  const w = BrowserWindow.getFocusedWindow() || mainWindow;
  return w ? dialog.showMessageBox(w, opts) : dialog.showMessageBox(opts);
}

async function offerInstall(file) {
  const name = path.basename(file);
  const terminals = process.platform === "win32" ? mt5.findTerminals() : [];
  if (terminals.length === 0) {
    const { response } = await message({
      type: "info",
      message: `${name} is saved`,
      detail:
        process.platform === "win32"
          ? `Saved to ${file}.\n\nMetaTrader 5 wasn't found on this PC. Install it from your broker, open it once, then use File → Install an EA into MetaTrader 5.`
          : `Saved to ${file}. Installing into MetaTrader 5 works on Windows.`,
      buttons: ["Show file", "OK"],
      defaultId: 1,
    });
    if (response === 0) shell.showItemInFolder(file);
    return;
  }

  const shown = terminals.slice(0, 4);
  const { response } = await message({
    type: "question",
    message: `Install ${name} into MetaTrader 5?`,
    detail: "StratoBot copies it into MQL5 → Experts → StratoBot and compiles it with MetaEditor.",
    buttons: [...shown.map((t) => `Install into ${t.name}`), "Not now"],
    defaultId: 0,
    cancelId: shown.length,
  });
  const terminal = shown[response];
  if (!terminal) return;

  let dest;
  try {
    dest = mt5.installEa(terminal, file);
  } catch (err) {
    await message({ type: "error", message: "Couldn't copy the EA", detail: String(err?.message || err) });
    return;
  }
  const result = await mt5.compileEa(terminal, dest);
  if (result.ok) {
    await message({
      type: "info",
      message: "Installed and compiled",
      detail: `${name} compiled with 0 errors${result.warnings ? ` (${result.warnings} warnings)` : ""}.\n\nIn MetaTrader 5: Navigator → Expert Advisors → StratoBot (right-click → Refresh if it isn't listed). Turn on Algo Trading, then drag the EA onto a chart.`,
    });
    return;
  }
  const { response: r2 } = await message({
    type: "warning",
    message: result.reason ? "Copied, but not compiled" : "Copied, but MetaEditor reported errors",
    detail: `${result.reason || result.log || "No compile log."}\n\nThe file is in ${path.dirname(dest)}. Open it in MetaEditor and press F7 to see the details.`,
    buttons: ["Show file", "OK"],
    defaultId: 1,
  });
  if (r2 === 0) shell.showItemInFolder(dest);
}

async function installFromFile() {
  const w = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePaths } = await dialog.showOpenDialog(w, {
    title: "Choose an EA to install",
    defaultPath: eaFolder(),
    filters: [{ name: "MQL5 source", extensions: ["mq5"] }],
    properties: ["openFile"],
  });
  if (!canceled && filePaths[0]) await offerInstall(filePaths[0]);
}

async function showLicence() {
  const saved = store.load();
  const masked = saved ? `${saved.key.slice(0, 8)}-••••-••••-${saved.key.slice(-4)}` : "none";
  const { response } = await message({
    type: "info",
    message: "StratoBot licence",
    detail: `Key: ${masked}\n\nDeactivating removes the key from this PC. To move it to another PC, contact support.`,
    buttons: ["OK", "Remove key from this PC"],
    defaultId: 0,
  });
  if (response === 1) {
    store.clear();
    app.relaunch();
    app.exit(0);
  }
}

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        { label: "Install an EA into MetaTrader 5…", accelerator: "CmdOrCtrl+I", click: () => void installFromFile() },
        { label: "Open StratoBot EA folder", click: () => void shell.openPath(eaFolder()) },
        { type: "separator" },
        { label: "Licence…", click: () => void showLicence() },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { label: "Back", accelerator: "Alt+Left", click: () => mainWindow?.webContents.navigationHistory.goBack() },
        { label: "Forward", accelerator: "Alt+Right", click: () => mainWindow?.webContents.navigationHistory.goForward() },
        { label: "Strategy builder", accelerator: "CmdOrCtrl+Shift+H", click: () => mainWindow?.loadURL(START_URL) },
        { role: "reload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "togglefullscreen" },
        ...(app.isPackaged ? [] : [{ role: "toggleDevTools" }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        { label: "How to run your EA in MT5", click: () => mainWindow?.loadURL(`${SITE}/install`) },
        { label: "FAQ", click: () => mainWindow?.loadURL(`${SITE}/faq`) },
        { label: "Open stratobot.trade in your browser", click: () => openExternal(SITE) },
        { type: "separator" },
        { label: `StratoBot ${app.getVersion()}`, enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 420,
    minHeight: 600,
    title: "StratoBot",
    backgroundColor: BG,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  const wc = mainWindow.webContents;

  wc.setWindowOpenHandler(({ url }) => {
    if (isSite(url)) void mainWindow.loadURL(url);
    else openExternal(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (e, url) => {
    if (isSite(url) || url.startsWith("file:")) return;
    e.preventDefault();
    openExternal(url);
  });
  wc.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    void mainWindow.loadFile(path.join(__dirname, "offline.html"), { query: { retry: isSite(url) ? url : START_URL } });
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  void mainWindow.loadURL(START_URL);
}

function createLicenceWindow() {
  licenceWindow = new BrowserWindow({
    width: 520,
    height: 600,
    resizable: false,
    title: "Activate StratoBot",
    backgroundColor: BG,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, preload: path.join(__dirname, "preload.js") },
  });
  licenceWindow.setMenuBarVisibility(false);
  licenceWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  licenceWindow.webContents.on("will-navigate", (e) => e.preventDefault());
  licenceWindow.on("closed", () => {
    licenceWindow = null;
  });
  void licenceWindow.loadFile(path.join(__dirname, "activate.html"));
}

ipcMain.handle("licence:buy", () => openExternal(`${SITE}/desktop`));
ipcMain.handle("licence:notice", () => licenceNotice);
ipcMain.handle("licence:activate", async (_e, input) => {
  const key = licence.normalizeKey(input);
  if (!key) return { ok: false, error: "Licence keys look like SBD-XXXX-XXXX-XXXX-XXXX." };
  const r = await licence.checkKey(SITE, key, machine);
  if (r.status === "offline") return { ok: false, error: "Couldn't reach stratobot.trade. Check your connection and try again." };
  if (r.status === "invalid") return { ok: false, error: r.error };
  store.save({ key, lastOk: Date.now() });
  createMainWindow();
  licenceWindow?.close();
  return { ok: true };
});

app.whenReady().then(async () => {
  app.userAgentFallback = `${app.userAgentFallback} StratoBotDesktop/${app.getVersion()}`;
  store = licence.createStore(path.join(app.getPath("userData"), "licence.json"), safeStorage);
  machine = licence.machineId();
  buildMenu();

  session.defaultSession.on("will-download", (_e, item) => {
    const name = path.basename(item.getFilename());
    if (!/\.mq5$/i.test(name)) return;
    const target = path.join(eaFolder(), name);
    item.setSavePath(target);
    item.once("done", (_ev, state) => {
      if (state === "completed") void offerInstall(target);
    });
  });

  const v = await licence.verifyStored(store, SITE, machine);
  if (v.allowed) createMainWindow();
  else {
    licenceNotice = v.error || null;
    createLicenceWindow();
  }
});

app.on("window-all-closed", () => app.quit());
