'use strict';

const {app, BrowserWindow, Menu, Tray, Notification} = require('electron')
const pageListService = require('./lib/pageListService');

let mainWindow = null;
let tray = null

app.setAppUserModelId(process.execPath);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  Menu.setApplicationMenu(menu);

  setUpMainWindow();

  setUpTray();

  setInterval(() => checkUpdate(), 60*60*1000);

  checkUpdate();
});

const template = [
  {
    label: 'webKohShin',
    submenu: [
      {
        label: 'Quit',
        accelerator: 'Ctrl+Q',
        click: () => app.quit()
      }
    ]
  }, {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'Ctrl+R',
        click: () => BrowserWindow.getFocusedWindow().reload()
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Shift+Ctrl+I',
        click: () => BrowserWindow.getFocusedWindow().toggleDevTools()
      }
    ]
  }
];
const menu = Menu.buildFromTemplate(template);

const setUpMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800, 
    height: 600,
    icon: __dirname + '/icon.ico',
    show: true,
    minimizable: false,
    skipTaskbar: true
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.on('close', (event) => {
    if (!mainWindow) {
      return
    }
    mainWindow.hide();
    event.preventDefault();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const setUpTray = () => {
  tray = new Tray(__dirname + '/icon.png');
  tray.setToolTip(app.getName());
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
  const contextMenu = Menu.buildFromTemplate([
    {label: '終了', click: () => {
      mainWindow = null;
      app.quit();
    }}
  ])
  tray.setContextMenu(contextMenu)
};

const checkUpdate = () => {
  pageListService.checkUpdate()
  .then(newList => {
    mainWindow.webContents.send('list-updated', newList);
    if (newList.some(page => page.status === pageListService.STATUS_CHANGED)) {
      notify();
    }
  });
};

const notify = () => {
  let notification = new Notification({
    title: '更新通知',
    body: 'サイトが更新されました'
  });
  notification.show();
};

