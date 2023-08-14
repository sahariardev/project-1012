// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const ipc = ipcMain;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        minWidth: 1600,
        minHeight: 900,
        maxWidth: 1600,
        maxHeight: 900,
        frame: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            webviewTag: true,
            devTools: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html');

    ipc.on('closeApp', () => {
        mainWindow.close();
    });
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});