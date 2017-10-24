const { app, BrowserWindow } = require('electron');

app.on('ready', function() {
  const mainWindow = new BrowserWindow();
  mainWindow.loadURL(`file://${__dirname}/index.html`);
});