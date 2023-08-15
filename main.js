// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const http = require('http');
const Client = require('ssh2-sftp-client');
const ipc = ipcMain;
const fs = require('fs');

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
    });

    mainWindow.loadFile('index.html');

    ipc.on('closeApp', () => {
        mainWindow.close();
    });

    ipc.on('downloadFile', async (event, args) => {
        const {connection, filePath} = JSON.parse(args);
        let sftp = new Client();

        let obj = {
            host: connection.host,
            username: connection.username,
            password: connection.password,
            port: connection.port
        }

        let hostWithPath = obj.host + ':' + obj.port;
        obj.sock = await getSocketProxy(hostWithPath, connection.proxyHost, connection.proxyPort);

        sftp.connect(obj)
            .then(() => {
                const pathParts = filePath.split('/');
                const downloadedFileNameWithPath = path.join(__dirname, pathParts[pathParts.length - 1]);
                let dst = fs.createWriteStream(downloadedFileNameWithPath);

                return sftp.get(filePath, dst);
            })
            .then(() => {
                sftp.end();
            })
            .catch(err => {
                console.error(err.message);
            });
    });

    ipc.on('uploadFile', async (event, args) => {
        const {connection, path} = JSON.parse(args);

        var selectedFile = await dialog.showOpenDialog({
            properties: ['openFile']
        });

        if (!selectedFile || selectedFile.canceled) {
            return;
        }
        if (!selectedFile.filePaths) {
            return;
        }

        const filePath = selectedFile.filePaths[0];
        const filePathParts = filePath.split('/');

        let data = fs.createReadStream(filePath);
        let remote = path + '/' + filePathParts[filePathParts.length - 1];

        let sftp = new Client();

        let obj = {
            host: connection.host,
            username: connection.username,
            password: connection.password,
            port: connection.port
        }

        let hostWithPath = obj.host + ':' + obj.port;
        obj.sock = await getSocketProxy(hostWithPath, connection.proxyHost, connection.proxyPort);

        sftp.connect(obj)
            .then(() => {
                return sftp.put(data, remote);
            })
            .then(() => {
                listFiles(event, args);
                sftp.end();
            })
            .catch(err => {
                console.error(err.message);
            });
    });

    ipc.on('listFiles', async (event, args) => {
        listFiles(event, args);
    });

    const listFiles = async (event, args) => {
        const {connection, path} = JSON.parse(args);
        let sftp = new Client();

        let obj = {
            host: connection.host,
            username: connection.username,
            password: connection.password,
            port: connection.port
        }

        let hostWithPath = obj.host + ':' + obj.port;
        obj.sock = await getSocketProxy(hostWithPath, connection.proxyHost, connection.proxyPort);

        sftp.connect(obj)
            .then(() => {
                return sftp.list(path);
            })
            .then(data => {
                mainWindow.webContents.send('filesListed', {fileList: data, connection: connection, path: path});
            })
            .then(() => {
                sftp.end();
            })
            .catch(err => {
                console.error(err.message);
            });
    }
}

const getSocketProxy = (path, proxyHost, proxyPort) => {
    let res = new Promise((resolve, reject) => {
        let options = {
            port: proxyPort,
            host: proxyHost,
            method: 'CONNECT',
            path
        };

        const req = http.request(options);
        req.end();
        req.on('connect', (res, socket, head) => {
            resolve(socket);
        });
    });
    return res;
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