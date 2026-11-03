// Only the licence window gets this bridge; the website window has none.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stratobot", {
  activate: (key) => ipcRenderer.invoke("licence:activate", key),
  buy: () => ipcRenderer.invoke("licence:buy"),
  notice: () => ipcRenderer.invoke("licence:notice"),
});
