const {ipcRenderer} = require('electron');
const ipc = ipcRenderer;
window.$ = window.jQuery = require('jquery');
const shell = require('electron').shell;

$(() => {
    loadAllConnection();
    $('.file-pane').hide();
    localStorage.removeItem('currentConnectionInfo');
});

const closeBtn = document.getElementById('closeBtn');
closeBtn.addEventListener('click', () => {
    ipc.send('closeApp');
});

$('.link').on('click', (event) => {
    shell.openExternal($(event.currentTarget).attr('link'));
});

$('#add-new-connection').on('click', () => {
    cleanConnectionModal();
    $('#connectionModal').modal('show');
});

$('#author-info').on('click', () => {
    $('#author-info-modal').modal('show');
});

$('#home').on('click', () => {
    $('.connection-pane').show();
    $('#file-list-body').html('');
    loadAllConnection();
    $('.file-pane').hide();
    localStorage.removeItem('currentConnectionInfo');
});

$('#upload').on('click', () => {
    if (!localStorage.getItem("currentConnectionInfo")) {
        return;
    }
    ipc.send('uploadFile', localStorage.getItem("currentConnectionInfo"));
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

    $('.connect').on('click', (x) => {
        const connectionName = $(x.currentTarget).parent().parent().find('td').eq(0).html();
        let connections = getAllConnection();
        const connection = connections[connectionName];
        $('.connection-pane').hide();
        $('.file-pane').show();

        const data = {
            connection: connection,
            path: '/'
        }

        ipc.send('listFiles', JSON.stringify(data));
    });
}

ipc.on('filesListed', function (event, data) {
    localStorage.setItem("currentConnectionInfo", JSON.stringify(data));
    generateFilesListView(data);
    updateSelectedPath(data.path, data.connection);
});

const generateFilesListView = ({fileList, connection, path}) => {
    $('#file-list-body').html('');

    fileList.forEach((file) => {
        const $tr = $('<tr>', {class: file.type === 'd' ? 'directory' : 'file'});

        $tr.append($('<th>').html(file.name));
        $tr.append($('<th>').html(file.type));
        $tr.append($('<th>').html(file.size));
        $tr.append($('<th>').html(file.longname));

        $('#file-list-body').append($tr);
    });

    $('.directory').on('click', (event) => {
        const directory = $(event.currentTarget).find('th').eq(0).html();

        const data = {
            connection: connection,
            path: path + '/' + directory
        }

        ipc.send('listFiles', JSON.stringify(data));
    });

    $('.file').on('click', (event) => {
        const directory = $(event.currentTarget).find('th').eq(0).html();

        const data = {
            connection: connection,
            filePath: path + '/' + directory
        }

        ipc.send('downloadFile', JSON.stringify(data));
    });
}

const updateSelectedPath = (path, connection) => {
    $selectedPath = $('#selected-path');
    $selectedPath.html('');
    const pathParts = path.split('/');

    let concatedPath = '';

    pathParts.forEach(pathPart => {
        concatedPath += pathPart + '/'
        $span = $('<span>', {path: concatedPath, class: 'path-part'});
        $selectedPath.append($span.html(pathPart));
        $selectedPath.append($('<span>').html('/'));
    });

    $('.path-part').on('click', () => {
        const path = $(event.currentTarget).attr('path');
        const data = {
            connection: connection,
            path: path
        }

        ipc.send('listFiles', JSON.stringify(data));
    });
}