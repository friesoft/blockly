var {electron, ipcMain, app, BrowserWindow, globalShortcut, dialog} = require('electron')
const { exec } = require('child_process');
const fs = require('fs');
const { SerialPort } = require('serialport');
var { autoUpdater } = require("electron-updater")
var path = require('path')
var mainWindow
var termWindow
var factoryWindow
var promptWindow
var promptOptions
var promptAnswer
autoUpdater.autoDownload = false
autoUpdater.logger = null
function createWindow () {
	mainWindow = new BrowserWindow({
		width: 1240, height: 700, icon: 'www/media/app.ico', frame: false, movable: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})
	if (process.platform == 'win32' && process.argv.length >= 2) {
		mainWindow.loadURL("file://" + path.join(__dirname, 'www/index.html?url='+process.argv[1]))
	} else {
		mainWindow.loadURL("file://" + path.join(__dirname, 'www/index.html'))
	}
	mainWindow.setMenu(null)
	mainWindow.on('closed', function () {
		mainWindow = null
	})
}
function createTerm() {
	termWindow = new BrowserWindow({
		width: 640, height: 560, 'parent': mainWindow, resizable: false, movable: true, frame: false, modal: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	}) 
	termWindow.loadURL("file://" + path.join(__dirname, "www/term.html"))
	termWindow.setMenu(null)
	termWindow.on('closed', function () { 
		termWindow = null 
	})
}
function createRepl() {
	termWindow = new BrowserWindow({
		width: 640, height: 515, 'parent': mainWindow, resizable: false, movable: true, frame: false, modal: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	}) 
	termWindow.loadURL("file://" + path.join(__dirname, "www/repl.html"))
	termWindow.setMenu(null)
	termWindow.on('closed', function () { 
		termWindow = null 
	})
}
function createfactory() {
	factoryWindow = new BrowserWindow({
		width: 1066, height: 640, 'parent': mainWindow, resizable: true, movable: true, frame: false,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})
	factoryWindow.loadURL("file://" + path.join(__dirname, "www/factory.html"))
	factoryWindow.setMenu(null)
	factoryWindow.on('closed', function () { 
		factoryWindow = null 
	})
}
function promptModal(options, callback) {
	promptOptions = options
	promptWindow = new BrowserWindow({
		width:360, height: 135, 'parent': mainWindow, resizable: false, movable: true, frame: false, modal: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})
	promptWindow.loadURL("file://" + path.join(__dirname, "www/modalVar.html"))
	promptWindow.on('closed', function () { 
		promptWindow = null 
		callback(promptAnswer)
	})
}
function open_console(mainWindow = BrowserWindow.getFocusedWindow()) {
	if (mainWindow) mainWindow.webContents.toggleDevTools()
}
function refresh(mainWindow = BrowserWindow.getFocusedWindow()) {
	if (mainWindow) mainWindow.webContents.reloadIgnoringCache()
}
app.on('ready',  function () {
	createWindow()
	globalShortcut.register('F8', open_console)
	globalShortcut.register('F5', refresh)
})
app.on('activate', function () {
	if (mainWindow === null) createWindow()
})
app.on('window-all-closed', function () {
	globalShortcut.unregisterAll()
	if (process.platform !== 'darwin') app.quit()
})
ipcMain.on("version", function () {
	autoUpdater.checkForUpdates()  
})
ipcMain.on("prompt", function () {
	createTerm()  
})
ipcMain.on("repl", function () {
	createRepl()  
})
ipcMain.on("factory", function () {
	createfactory()       
})
ipcMain.on("openDialog", function (event, data) {
    event.returnValue = JSON.stringify(promptOptions, null, '')
})
ipcMain.on("closeDialog", function (event, data) {
	promptAnswer = data
})
ipcMain.on("modalVar", function (event, arg) {
	promptModal(
		{"label": arg, "value": "", "ok": "OK"}, 
	    function(data) {
	       event.returnValue = data
        }
	)       
})
ipcMain.on('save-bin', function (event) {
	dialog.showSaveDialog(mainWindow,{
		title: 'Exporter les binaires',
		defaultPath: 'Otto_hex',
		filters: [{ name: 'Binary', extensions: ['hex']}]
	}).then(result => {
		if (!result.canceled && result.filePath) {
			event.sender.send('saved-bin', result.filePath)
		}
	})
})
ipcMain.on('save-ino', function (event) {
	dialog.showSaveDialog(mainWindow,{
		title: 'Save format .INO',
		defaultPath: 'Otto_Arduino',
		filters: [{ name: 'Arduino', extensions: ['ino'] }]
	}).then(result => {
		if (!result.canceled && result.filePath) {
			event.sender.send('saved-ino', result.filePath)
		}
	})
})
ipcMain.on('save-py', function (event) {
	dialog.showSaveDialog(mainWindow,{
		title: 'Save format .PY',
		defaultPath: 'Otto_python',
		filters: [{ name: 'python', extensions: ['py'] }]
	}).then(result => {
		if (!result.canceled && result.filePath) {
			event.sender.send('saved-py', result.filePath)
		}
	})
})
ipcMain.on('save-bloc', function (event) {
	dialog.showSaveDialog(mainWindow,{
		title: 'Save format .BLOC',
		defaultPath: 'Otto_block',
		filters: [{ name: 'Ottoblockly', extensions: ['bloc'] }]
	}).then(result => {
		if (!result.canceled && result.filePath) {
			event.sender.send('saved-bloc', result.filePath)
		}
	})
})
ipcMain.on('save-csv', function (event) {
	dialog.showSaveDialog(mainWindow,{
		title: 'Save format CSV',
		defaultPath: 'Otto_csv',
		filters: [{ name: 'data', extensions: ['csv'] }]
	}).then(result => {
		if (!result.canceled && result.filePath) {
			event.sender.send('saved-csv', result.filePath)
		}
	})
})
autoUpdater.on('error', function(error) {
	dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})
autoUpdater.on('update-available', function() {
	dialog.showMessageBox(mainWindow,{
		type: 'none',
		title: 'Update',
		message: "A new version is available, do you want to download and install it now?",
		buttons: ['Yes', 'No'],
		cancelId: 1,
		noLink: true
	}).then(result => {
		if (result.response === 0) {
			autoUpdater.downloadUpdate()
		}
	})
})
autoUpdater.on('update-not-available', function() {
	dialog.showMessageBox(mainWindow,{
		title: 'Updated',
		message: 'Your version is up to date.'
	})
})
autoUpdater.on('update-downloaded', function() {
	dialog.showMessageBox(mainWindow,{
		title: 'Updated',
		message: "Download finished, the application will install then restart.."
	}).then(() => {
		setImmediate(() => autoUpdater.quitAndInstall())
	})
})

let s_p = null;

ipcMain.handle('fs:readFile', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf8');
});

ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
    fs.writeFileSync(filePath, data);
    return true;
});

ipcMain.handle('fs:copyFile', async (event, src, dest) => {
    fs.copyFileSync(src, dest);
    return true;
});

ipcMain.handle('cp:exec', async (event, cmd, cwdOptions) => {
    return new Promise((resolve, reject) => {
        exec(cmd, cwdOptions, (error, stdout, stderr) => {
            if (error) {
                reject(error.toString());
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
});

ipcMain.handle('serial:list', async () => {
    return await SerialPort.list();
});

ipcMain.handle('serial:open', async (event, port, baud) => {
    return new Promise((resolve, reject) => {
        if (s_p && s_p.isOpen) {
            s_p.close();
        }
        s_p = new SerialPort({ path: port, baudRate: baud, autoOpen: false });
        s_p.open((err) => {
            if (err) return reject(err.message);
            s_p.on('data', (data) => {
                event.sender.send('serial:data', data.toString());
            });
            resolve(true);
        });
    });
});

ipcMain.handle('serial:close', async () => {
    return new Promise((resolve) => {
        if (s_p && s_p.isOpen) {
            s_p.close(() => {
                resolve(true);
            });
        } else {
            resolve(true);
        }
    });
});

ipcMain.handle('serial:write', async (event, data) => {
    if (s_p && s_p.isOpen) {
        s_p.write(data);
    }
});

ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

ipcMain.handle('window:action', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (action === 'close') win.close();
    else if (action === 'maximize') win.maximize();
    else if (action === 'unmaximize') win.unmaximize();
    else if (action === 'minimize') win.minimize();
    else if (action === 'isMaximized') return win.isMaximized();
});
module.exports.open_console = open_console
module.exports.refresh = refresh
