import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import path from "path";
import { startTracking, stopTracking } from "./tracking/tracker";
import { syncToServer } from "./sync/syncer";
import { loadConfig, saveConfig } from "./auth/config";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trackingInterval: NodeJS.Timeout | null = null;

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

  // Start tracking if device is linked
  if (config.deviceLinked) {
    startTrackingLoop();
  }

  // IPC handlers
  ipcMain.handle("link-device", async (_, code: string) => {
    // Mock device linking
    await saveConfig({ ...config, deviceLinked: true, deviceCode: code });
    startTrackingLoop();
    mainWindow?.hide();
    return { success: true };
  });

  ipcMain.handle("get-status", () => ({
    linked: config.deviceLinked,
    tracking: !!trackingInterval,
    version: "1.2.4",
  }));
});

function startTrackingLoop() {
  if (trackingInterval) return;

  trackingInterval = setInterval(async () => {
    const logs = await startTracking();
    await syncToServer(logs);
  }, 30000); // every 30 seconds
}

app.on("window-all-closed", (e: Event) => {
  e.preventDefault(); // Keep running in tray
});

// Suppress unused warning
void stopTracking;
