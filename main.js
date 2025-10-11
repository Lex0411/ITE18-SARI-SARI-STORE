const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  win.setTitle("Tres Sari-Sari Store Inventory");

}

ipcMain.handle('read-file', async (_, filename) => {
  const filePath = path.join(app.getPath('userData'), filename);
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('write-file', async (_, filename, data) => {
  const filePath = path.join(app.getPath('userData'), filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('file-exists', async (_, filename) => {
  const filePath = path.join(app.getPath('userData'), filename);
  return fs.existsSync(filePath);
});

app.whenReady().then(createWindow);
