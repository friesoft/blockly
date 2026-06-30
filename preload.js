const { contextBridge, ipcRenderer, shell, clipboard } = require('electron');

contextBridge.exposeInMainWorld('ottoAPI', {
    // FS Operations
    writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
    exists: (path) => ipcRenderer.invoke('fs:exists', path),
    mkdir: (path) => ipcRenderer.invoke('fs:mkdir', path),
    
    // Command Execution
    exec: (cmd, cwd) => ipcRenderer.invoke('cp:exec', cmd, cwd),
    spawn: (cmd, args, cwdOptions, callbacks) => {
        const id = Math.random().toString(36).substring(7);
        
        ipcRenderer.on(`cp:spawn:stdout:${id}`, (event, data) => { if(callbacks.onStdout) callbacks.onStdout(data) });
        ipcRenderer.on(`cp:spawn:stderr:${id}`, (event, data) => { if(callbacks.onStderr) callbacks.onStderr(data) });
        ipcRenderer.on(`cp:spawn:error:${id}`, (event, err) => { if(callbacks.onError) callbacks.onError(err) });
        
        ipcRenderer.once(`cp:spawn:close:${id}`, (event, code) => {
            ipcRenderer.removeAllListeners(`cp:spawn:stdout:${id}`);
            ipcRenderer.removeAllListeners(`cp:spawn:stderr:${id}`);
            ipcRenderer.removeAllListeners(`cp:spawn:error:${id}`);
            if(callbacks.onClose) callbacks.onClose(code);
        });
        
        ipcRenderer.send('cp:spawn', id, cmd, args, cwdOptions);
    },
    
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
    getAppPath: () => ipcRenderer.invoke('app:getAppPath'),
    isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
    getArduinoBaseDir: () => ipcRenderer.invoke('app:getArduinoBaseDir'),
    getArduinoDataPath: () => ipcRenderer.invoke('app:getArduinoDataPath'),
    openPath: (path) => ipcRenderer.invoke('app:openPath', path),
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
