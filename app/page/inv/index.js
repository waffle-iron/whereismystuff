window.$ = require('jquery');
require('../../lib/tab.js');

const electron = require('electron');
const remote = electron.remote;

let dbModel;

// Model constructor
function makeModel(dbm){
  dbModel = require('./dbmodel.js');
  dbModel.passDBM(dbm);
}

// Insert row into table function
function insertRowIntoTable(table){
  var insertFunction = function(row){
    table.append("<tr><td><input type=\"checkbox\" id=\"entity-checkbox-" +
                 row.id + "\" value=\"" + row.id + "\"></td><td>" + row.quantity +
                 "</td><td>" + row.name + "</td><td>" + row.category +
                 "</td><td>" + row.location + "</td></tr>")
  }
  return insertFunction;
}

// Site IO
$(document).ready(function(){
  // Call in the database connection so that the model can be established
  makeModel(remote.getGlobal('dbm'));
  // Retrieve the inventory table
  var table = $('#inventory')
  // Get the inventory data and plug it into the table
  dbModel.getInvHead(insertRowIntoTable(table));
});
