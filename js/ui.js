const {ipcRenderer} = require('electron');
const ipc = ipcRenderer;
window.$ = window.jQuery = require('jquery');

$(() => {
    loadAllConnection();
});

const closeBtn = document.getElementById('closeBtn');
closeBtn.addEventListener('click', () => {
    ipc.send('closeApp');
});

$('#add-new-connection').on('click', () => {
    cleanConnectionModal();
    $('#connectionModal').modal('show');
});

$('#connection-save-btn').on('click', () => {
    $('#connection-name-error').html('');
    const connectionName = $('#connection-name').val();
    const host = $('#host').val();
    const port = $('#port').val();
    const username = $('#username').val();
    const password = $('#password').val();
    const proxyHost = $('#proxy-host').val();
    const proxyPort = $('#proxy-port').val();

    let allConnections = getAllConnection() || {};

    if (!(connectionName in allConnections)) {
        allConnections[connectionName] = {
            connectionName: connectionName,
            host: host,
            port: port,
            username: username,
            password: password,
            proxyHost: proxyHost,
            proxyPort: proxyPort
        }

        localStorage.setItem('connections', JSON.stringify(allConnections));
        loadAllConnection();
        $('#connectionModal').modal('hide');
    } else {
        $('.connection-name-error').html('Name already exist');
    }
});

const getAllConnection = () => {
    return JSON.parse(localStorage.getItem('connections'));
}

const cleanConnectionModal = () => {
    $('#connection-name').val('');
    $('#host').val('');
    $('#port').val('');
    $('#username').val('');
    $('#password').val('');
    $('#proxy-host').val('');
    $('#proxy-port').val('');
}

const loadAllConnection = () => {
    $('#connection-list-body').html('');

    const connections = getAllConnection();
    for (const [key, value] of Object.entries(connections)) {
        const $tr = $('<tr>');
        $tr.append($('<td>').html(value.connectionName));
        $tr.append($('<td>').html(value.host));
        $tr.append($('<td>').html('Actions'));

        $('#connection-list-body').append($tr);
    }
}