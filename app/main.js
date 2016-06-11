const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const {ipcMain} = electron;

// Global reference to the main window
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object.
    mainWindow = null;
  });
}

// Create the window when that's a good idea
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    dbmanager.close();
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Load in the database manager
var dbmanager = require('./lib/sqlite');

// Define the database initializer callback
function dbInitCallback(event){
  var callback = function(err){
    if(err == null){
      event.sender.send('db-init-reply', null);
    }
    else{
      throw err;
    }
  }
  return callback;
}

// Recieve db-create-request
ipcMain.on('db-create-request', (event, arg) => {
  console.log("Request to create database at " + arg + " recieved.");
  dbmanager.createDatabase(arg, dbInitCallback(event));
});

// Recieve db-load-request
ipcMain.on('db-load-request', (event, arg) => {
  console.log("Request to load database " + arg + " recieved.");
  dbmanager.loadDatabase(arg, dbInitCallback(event));
});
