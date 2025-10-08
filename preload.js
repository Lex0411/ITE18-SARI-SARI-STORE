// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (filename) => ipcRenderer.invoke('read-file', filename),
  writeFile: (filename, data) => ipcRenderer.invoke('write-file', filename, data),
  fileExists: (filename) => ipcRenderer.invoke('file-exists', filename),
  loadAllData: () => ipcRenderer.invoke('load-all-data'),
  
  // You can add other APIs here as needed
});