const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises; // Use promises for better async handling
const fsSync = require('fs'); // Keep sync for existsSync

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Data directory path
const dataDir = path.join(__dirname, 'data');

// Ensure data directory exists
function ensureDataDir() {
  if (!fsSync.existsSync(dataDir)) {
    fsSync.mkdirSync(dataDir, { recursive: true });
  }
}

// IPC handlers for file operations
ipcMain.handle('read-file', async (event, filename) => {
  try {
    ensureDataDir();
    const filePath = path.join(dataDir, filename);
    
    if (fsSync.existsSync(filePath)) {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    }
    return []; // Return empty array if file doesn't exist
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('write-file', async (event, filename, data) => {
  try {
    ensureDataDir();
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

ipcMain.handle('file-exists', async (event, filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    return fsSync.existsSync(filePath);
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
});

// New handler to get both products and sales at once
ipcMain.handle('load-all-data', async () => {
  try {
    ensureDataDir();
    
    const productsPath = path.join(dataDir, 'products.json');
    const salesPath = path.join(dataDir, 'sales.json');
    
    let products = [];
    let sales = [];
    
    if (fsSync.existsSync(productsPath)) {
      const productsData = await fs.readFile(productsPath, 'utf8');
      products = JSON.parse(productsData);
    }
    
    if (fsSync.existsSync(salesPath)) {
      const salesData = await fs.readFile(salesPath, 'utf8');
      sales = JSON.parse(salesData);
    }
    
    return { products, sales };
  } catch (error) {
    console.error('Error loading all data:', error);
    throw error;
  }
});
