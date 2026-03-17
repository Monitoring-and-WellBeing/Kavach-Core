// Mock Electron APIs for Jest tests
export const app = {
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn(),
  on: jest.fn(),
}

export const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadFile: jest.fn(),
  loadURL: jest.fn(),
  show: jest.fn(),
  hide: jest.fn(),
  close: jest.fn(),
  webContents: {
    send: jest.fn(),
  },
}))

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
}

export const Tray = jest.fn().mockImplementation(() => ({
  setContextMenu: jest.fn(),
  setToolTip: jest.fn(),
}))

  buildFromTemplate: jest.fn(() => ({
    items: [],
  })),
}
