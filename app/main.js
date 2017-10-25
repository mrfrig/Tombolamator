const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');

let mainWindow = null;

const getFileFromUserSelection = exports.getFileFromUserSelection = function() {
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [ {name: 'Raffle Files', extensions: ['rff']} ]
  });

  if (!files) return;
  
  const file = files[0];
  const content = fs.readFileSync(file).toString();

  mainWindow.webContents.send('file-opened', file, content);
};

const saveRaffle = exports.saveRaffle = function(file, content) {
  if (!file) {
    file = dialog.showSaveDialog(mainWindow, {
      title: "Save Raffle",
      defaultPath: app.getPath("documents"),
      filters: [ {name: 'Raffle Files', extensions: ['rff']} ]
    });
  }

  if (!file) return null;

  fs.writeFileSync(file,content);

  return file;
};

app.on('ready', function() {
  mainWindow = new BrowserWindow();

  mainWindow.once('ready-to-show', function(){
    mainWindow.show();
    
  });

  mainWindow.on('close', function() {
   mainWindow = null;
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
});