const { contextBridge, ipcRenderer, shell, clipboard } = require('electron');

contextBridge.exposeInMainWorld('ottoAPI', {
    // FS Operations
    writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
    
    // Command Execution
    exec: (cmd, cwd) => ipcRenderer.invoke('cp:exec', cmd, cwd),
    
    // SerialPort Operations
    listPorts: () => ipcRenderer.invoke('serial:list'),
    openPort: (port, baud) => ipcRenderer.invoke('serial:open', port, baud),
    closePort: () => ipcRenderer.invoke('serial:close'),
    writePort: (data) => ipcRenderer.invoke('serial:write', data),
    onSerialData: (callback) => {
        ipcRenderer.on('serial:data', (event, data) => callback(data));
    },
    
    // Remote / App
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
    windowAction: (action) => ipcRenderer.invoke('window:action', action),
    
    // Legacy IPC messages
    send: (channel, data) => ipcRenderer.send(channel, data),
    sendSync: (channel, data) => ipcRenderer.sendSync(channel, data),
    on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    
    // Utilities
    openExternal: (url) => shell.openExternal(url),
    writeText: (text) => clipboard.writeText(text)
});
