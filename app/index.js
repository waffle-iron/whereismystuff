window.$ = require('jquery');

const electron = require('electron');
const dialog = electron.remote.dialog;
const {ipcRenderer} = require('electron');

function dialogconf(mode){
  if(mode == "create"){
    var title = "Create new database";
  }
  else if(mode == "load"){
    var title = "Load database";
  }
  var conf = {
    title: title,
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
    ],
    properties: [
      'openFile'
    ]
  };
  return conf;
}

// Site IO
$(document).ready(function(){
  // Handle new database request
  $('#new-database').click(function(){
    dialog.showSaveDialog(
    dialogconf("create"), 
    function(filename){
      if(undefined != filename){
        ipcRenderer.send('db-create-request', filename);
      }
    });
  });

  // Handle database load request
  $('#load-database').click(function(){
    dialog.showOpenDialog(
      dialogconf("load"),
    function(filename){
      if(undefined != filename){
        ipcRenderer.send('db-load-request', filename[0]);
      }
    });
  });
});
