import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import path from "path";
import { startTrackingLoop, stopTrackingLoop, isTrackingActive } from "./tracking/trackingLoop";
import { loadConfig, saveConfig } from "./auth/config";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// After device is confirmed linked, start tracking:
async function initializeAgent() {
  const config = await loadConfig();

  if (config.deviceLinked && config.deviceId) {
    console.log('[main] Device already linked, starting tracking');
    startTrackingLoop();
    mainWindow?.hide(); // hide window — runs in tray
  } else {
    console.log('[main] Device not linked, showing link screen');
    mainWindow?.show();
  }
}

app.whenReady().then(async () => {
  const config = await loadConfig();

  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: !config.deviceLinked,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "KAVACH AI Agent",
    icon: path.join(__dirname, "../assets/icon.png"),
    frame: false,
    resizable: false,
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  // System tray
  const trayIconPath = path.join(__dirname, "../assets/tray-icon.png");
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: "KAVACH AI — Active", enabled: false },
    { type: "separator" },
    { label: "Show Status", click: () => mainWindow?.show() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("KAVACH AI — Monitoring Active");

  // Initialize agent
  await initializeAgent();

  // IPC handlers
  ipcMain.handle("link-device", async (_, code: string) => {
    // Mock device linking
    await saveConfig({ ...config, deviceLinked: true, deviceCode: code });
    startTrackingLoop();
    mainWindow?.hide();
    return { success: true };
  });

  // IPC: called after successful linking from renderer
  ipcMain.handle("device-linked", async () => {
    startTrackingLoop();
    mainWindow?.hide();
    return { success: true };
  });

  // IPC: status check
  ipcMain.handle("get-status", () => ({
    linked: config.deviceLinked,
    tracking: isTrackingActive(),
    version: "1.2.4",
  }));

  // Legacy handler for backward compatibility
  ipcMain.handle("get-tracking-status", () => ({
    linked: config.deviceLinked,
    tracking: isTrackingActive(),
    version: "1.2.4",
  }));
});

// Graceful shutdown
app.on("before-quit", () => {
  stopTrackingLoop();
});

app.on("window-all-closed", (e: Event) => {
  e.preventDefault(); // Keep running in tray
});

// Crash recovery handlers
process.on('uncaughtException', (error) => {
  console.error('[crash] Uncaught exception in main process', { error: error.message, stack: error.stack });
  // Don't crash the agent — log and continue
  // If the error is in a non-critical module, attempt recovery
});

process.on('unhandledRejection', (reason) => {
  console.error('[crash] Unhandled promise rejection', { reason: String(reason) });
});
