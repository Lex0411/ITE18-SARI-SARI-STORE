// main.js
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

// === File Handling Logic ===
// Save JSON beside your app (in the same folder as main.js)
ipcMain.handle('read-file', async (_, filename) => {
  const filePath = path.join(__dirname, filename);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('Error parsing JSON:', err);
    return [];
  }
});

ipcMain.handle('write-file', async (_, filename, data) => {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('file-exists', async (_, filename) => {
  const filePath = path.join(__dirname, filename);
  return fs.existsSync(filePath);
});

// === App Lifecycle ===
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
