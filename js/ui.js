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
        const $deleteBtn = $('<button class="btn btn-default connection-action-btn delete">\n' +
            '                    <span class="icon icon-cancel-circled"></span>\n' +
            '                </button>');

        const $updateBtn = $('<button class="btn btn-default connection-action-btn update">\n' +
            '                    <span class="icon icon-pencil"></span>\n' +
            '                </button>');

        const $connectBtn = $('<button class="btn btn-default connection-action-btn connect">\n' +
            '                    <span class="icon icon-check"></span>\n' +
            '                </button>');

        $tr.append($('<td>').html(value.connectionName));
        $tr.append($('<td>').html(value.host));
        $tr.append($('<td>').append($deleteBtn).append($updateBtn).append($connectBtn));

        $('#connection-list-body').append($tr);
    }

    $('.delete').on('click', (x) => {
        const connectionName = $(x.currentTarget).parent().parent().find('td').eq(0).html();
        let connections = getAllConnection();
        delete connections[connectionName];

        localStorage.setItem('connections', JSON.stringify(connections));
        loadAllConnection();
    });
}
