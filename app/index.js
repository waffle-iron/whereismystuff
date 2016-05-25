window.$ = require('jquery');

const electron = require('electron');
const dialog = electron.remote.dialog;
const {ipcRenderer} = require('electron');

// Site IO
$(document).ready(function(){
  // Handle new database request
  $('#new-database').click(function(){
    dialog.showSaveDialog({
      title: "Create new database",
      defaultPath: ".",
      filters: [
        {
          name: 'WIMS DB (.wms)',
          extensions: ['wms']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    }, 
    function(filename){
      if(undefined != filename){
        ipcRenderer.send('db-create-request', filename);
      }
    });
  });

  // Handle new database confirmation
  ipcRenderer.on('db-create-reply', (event, arg) => {
    $('#new-database').slideUp();
    $('#load-database').slideUp();
  });
});
