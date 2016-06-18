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
                 "</td><td>" + row.location + "</td></tr>");
  }
  return insertFunction;
}

// Insert option into select-list function
function insertOptionIntoSelect(select){
  var insertFunction = function(row){
    select.append("<option data-id=\"" + row.id + "\">" + row.name +
                  "</option>");
  }
  return insertFunction;
}

// Update the interface selector lists
function updateLists(){
  // Push category lists
  var catListList = ['#filter-category', '#add-stuff-category',
                     '#manage-delete-category'];
  for(i = 0; i < catListList.length; i++){
    var select = $(catListList[i]);
    dbModel.getCategories(insertOptionIntoSelect(select));
  }
  // Push location lists
  var locListList = ['#filter-location', '#add-stuff-location',
                     '#manage-move-location-into', '#manage-move-location-from',
                     '#manage-add-location', '#manage-delete-location'];
  for(i = 0; i < locListList.length; i++){
    var select = $(locListList[i]);
    dbModel.getLocations(insertOptionIntoSelect(select));
  }
}

// Site IO
$(document).ready(function(){
  // Call in the database connection so that the model can be established
  makeModel(remote.getGlobal('dbm'));
  // Retrieve the inventory table
  var table = $('#inventory')
  // Get the inventory data and plug it into the table
  dbModel.getInvHead(insertRowIntoTable(table));
  // While we're at it, populate the interface selector lists
  dbModel.update(updateLists);

});
