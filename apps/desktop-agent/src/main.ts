import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import path from "path";
import { startTrackingLoop, stopTrackingLoop, isTrackingActive, TrackingLoopOptions } from "./tracking/trackingLoop";
import { loadConfig, saveConfig } from "./auth/config";
import { EnforcementEngine } from "./enforcement/EnforcementEngine";
import { RuleSync } from "./enforcement/RuleSync";
import { BrowserMonitor } from "./enforcement/BrowserMonitor";
import { SelfProtection } from "./protection/SelfProtection";
import { timeSync } from "./enforcement/TimeSync";
import { ScreenshotCapture } from "./screenshots/ScreenshotCapture";
import { generateLinkCode, pollForLink, sendHeartbeat } from "./sync/deviceRegistration";
import { logger } from "./logger";
import { AGENT_VERSION } from "./version";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Enforcement singletons — kept at module scope so stopEnforcement() can reach them
let enforcementEngine: EnforcementEngine | null = null;
let ruleSync: RuleSync | null = null;
let browserMonitor: BrowserMonitor | null = null;
let selfProtection: SelfProtection | null = null;
let screenshotCapture: ScreenshotCapture | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

/**
 * Starts the full enforcement stack for a linked device.
 * Order matters:
 *   1. Sync server time first (so schedule checks are correct immediately)
 *   2. Create enforcement engine + screenshot capture
 *   3. Create BrowserMonitor (needed by RuleSync constructor)
 *   4. Create RuleSync(deviceId, engine, browserMonitor) — fetches rules immediately
 *   5. Start enforcement loop
 *   6. Start browser URL monitor (rules already loaded by step 4)
 *   7. Start self-protection watchdog
 *   8. Register Windows startup key
 */
async function startEnforcement(deviceId: string): Promise<void> {
  // 1. Server-time sync (anti-clock-manipulation — edge case 8)
  await timeSync.sync();

  // 2. Enforcement engine
  enforcementEngine = new EnforcementEngine(deviceId);

  // 2a. Screenshot capture — load settings, wire into engine, start periodic
  screenshotCapture = new ScreenshotCapture();
  await screenshotCapture.loadSettings(deviceId);
  enforcementEngine.setScreenshotCapture(screenshotCapture);

  // Show student disclosure dialog if screenshots enabled and student not yet notified
  await screenshotCapture.showDisclosureIfNeeded(deviceId);

  // Start periodic capture if enabled
  screenshotCapture.startPeriodic(deviceId);

  // 3. Browser URL monitor — must be created before RuleSync so it can be injected
  browserMonitor = new BrowserMonitor();

  // 4. Rule sync — fetches rules immediately, then every 30 s.
  //    Receives browserMonitor so it can push URL rules into it on every sync.
  ruleSync = new RuleSync(deviceId, enforcementEngine, browserMonitor);
  ruleSync.start();

  // 5. Enforcement loop (kills blocked apps every 2 s)
  enforcementEngine.start();

  // 6. Start browser URL monitor after rules are loaded
  browserMonitor.start();

  // 7. Self-protection watchdog (detects Task Manager / Process Explorer)
  selfProtection = new SelfProtection();
  selfProtection.start(process.pid);

  // 8. Register agent in Windows startup so it survives crashes & reboots (edge case 9)
  await SelfProtection.registerStartup();

  // 9. Heartbeat — send device keep-alive every 30 s so parent dashboard shows "Online"
  sendHeartbeat().catch(() => {})
  heartbeatTimer = setInterval(() => sendHeartbeat().catch(() => {}), 30_000)

  logger.info('[KAVACH] Enforcement engine active for device', deviceId);
}

function stopEnforcement(): void {
  enforcementEngine?.stop();
  ruleSync?.stop();
  browserMonitor?.stop();
  selfProtection?.stop();
  screenshotCapture?.stopPeriodic();
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

// After device is confirmed linked, start tracking + enforcement:
async function initializeAgent() {
  const config = await loadConfig();

  if (config.deviceLinked && config.deviceId) {
    logger.info('[main] Device already linked, starting tracking + enforcement');
    // skipLegacyEnforcement=true: EnforcementEngine handles all blocking.
    // TrackingLoop runs in activity-logging-only mode to avoid double-kills
    // and duplicate usage reports.
    startTrackingLoop({ skipLegacyEnforcement: true });
    await startEnforcement(config.deviceId);
    mainWindow?.hide(); // hide window — runs in tray
  } else {
    logger.info('[main] Device not linked, showing link screen');
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

  // IPC: renderer requests a new link code (step 1 of linking flow)
  ipcMain.handle("generate-link-code", async () => {
    try {
      const { code, expiresInMinutes } = await generateLinkCode();

      // Start background polling — when linked, notify renderer and start enforcement
      pollForLink(code).then(async (deviceId) => {
        if (deviceId) {
          startTrackingLoop({ skipLegacyEnforcement: true });
          await startEnforcement(deviceId);
          mainWindow?.webContents.send("link-success");
          setTimeout(() => mainWindow?.hide(), 3500);
        }
      }).catch((err) => {
        logger.error('[main] pollForLink failed', String(err));
      });

      return { code, expiresInMinutes };
    } catch (err: any) {
      logger.error('[main] generate-link-code error', String(err));
      return { error: err?.message || 'Failed to reach KAVACH server' };
    }
  });

  // IPC: called after successful linking (e.g. manual trigger / legacy)
  ipcMain.handle("device-linked", async () => {
    const linkedConfig = await loadConfig();
    startTrackingLoop({ skipLegacyEnforcement: true });
    if (linkedConfig.deviceId) {
      await startEnforcement(linkedConfig.deviceId);
    }
    mainWindow?.hide();
    return { success: true };
  });

  // IPC: status check
  ipcMain.handle("get-status", async () => {
    const current = await loadConfig();
    return {
      linked: current.deviceLinked,
      tracking: isTrackingActive(),
      version: AGENT_VERSION,
    };
  });

  // Legacy handler for backward compatibility
  ipcMain.handle("get-tracking-status", async () => {
    const current = await loadConfig();
    return {
      linked: current.deviceLinked,
      tracking: isTrackingActive(),
      version: AGENT_VERSION,
    };
  });
});

// Graceful shutdown
app.on("before-quit", () => {
  stopTrackingLoop();
  stopEnforcement();
});

app.on("window-all-closed", (e: Event) => {
  e.preventDefault(); // Keep running in tray
});

// Crash recovery handlers
process.on('uncaughtException', (error) => {
  logger.error('[crash] Uncaught exception in main process', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('[crash] Unhandled promise rejection', { reason: String(reason) });
});
