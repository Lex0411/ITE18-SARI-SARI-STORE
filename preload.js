
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filename) => ipcRenderer.invoke('read-file', filename),
  writeFile: (filename, data) => ipcRenderer.invoke('write-file', filename, data),
  fileExists: (filename) => ipcRenderer.invoke('file-exists', filename),
});

contextBridge.exposeInMainWorld('electronAPI', Object.freeze({
  readFile: (filename) => ipcRenderer.invoke('read-file', filename),
  writeFile: (filename, data) => ipcRenderer.invoke('write-file', filename, data),
  fileExists: (filename) => ipcRenderer.invoke('file-exists', filename),
  loadAllData: () => ipcRenderer.invoke('load-all-data'),
}));
