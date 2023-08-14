const {ipcRenderer} = require('electron');
const ipc = ipcRenderer;

const closeBtn = document.getElementById('closeBtn');
closeBtn.addEventListener('click', ()=> {
    ipc.send('closeApp');
});