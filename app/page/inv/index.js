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
    table.append("<tr><td><input type=\"checkbox\" value=\"" + row.id +
                 "\"></td><td>" + row.quantity + "</td><td>" + row.name +
                 "</td><td>" + row.category + "</td><td>" + row.location +
                 "</td></tr>");
  }
  return insertFunction;
}

// Insert option into select-list function
function insertOptionIntoSelect(select){
  var insertFunction = function(row){
    select.append("<option value=\"" + row.id + "\">" + row.name + "</option>");
  }
  return insertFunction;
}

// Update the interface selector lists
function updateLists(){
  // Push category lists
  var catListList = ['#filter-category', '#add-stuff-category',
                     '#manage-delete-category', '#recategorize-stuff'];
  for(i = 0; i < catListList.length; i++){
    var select = $(catListList[i]);
    select.children().not('option[value="-1"]').remove();
    dbModel.getCategories(insertOptionIntoSelect(select));
  }
  // Push location lists
  var locListList = ['#filter-location', '#add-stuff-location',
                     '#manage-move-location-into', '#manage-move-location-from',
                     '#manage-add-location-inside', '#manage-delete-location',
                     '#move-stuff'];
  for(i = 0; i < locListList.length; i++){
    var select = $(locListList[i]);
    select.children().not('option[value="-1"]').remove();
    dbModel.getLocations(insertOptionIntoSelect(select));
  }
}

// Post a notification to the given pane
function notify(tabID, message, type){
  var tab = $('#' + tabID);
  var headrow = tab.prepend('<div class="row" style="display:\
  none"></div>').children(':first');
  var notif = headrow.append('<div\
  class="col-md-12"></div>').children(':first');
  notif = notif.append('<div class="alert"\
  role="alert"></div>').children(':first');
  notif.addClass('alert-' + type);
  notif.text(message);
  headrow.slideDown('fast');
  notif.click(function(){
    headrow.slideUp('fast');
  });
}

// Get the selected rows of the table
function getSelectedRows(){
  var rows = $('#inventory :checked');
  if(rows.length == 0){
    return null;
  }
  else{
    return rows;
  }
}

// Update table function
function updateTable(){
  var table = $('#inventory');
  table.empty();
  dbModel.getInv(insertRowIntoTable(table), function(){
    // Row formatting
    $('#inventory :checkbox').change(function(){
      if(this.checked){
        $(this).parent().parent().addClass('info');
      }
      else{
        $(this).parent().parent().removeClass('info');
      }
    });

    // Row selection
    $('#inventory tr').click(function(){
      $(this).children().children(':checkbox').click();
    });
  });
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

  // Activate buttons
  // Manage add-category
  $('#manage-add-category-button').removeClass('disabled').click(function(){
    var field = $('#manage-add-category');
    var newCat = field.val();
    if(newCat != ""){
      dbModel.addCategory(newCat, function(){
        field.val("");
        dbModel.update(updateLists);
        notify('manage-tab', "Successfully added category "+newCat, 'success');
      }, function(){
        notify('manage-tab', "Failed to add category "+newCat, 'danger');
      });
    }
  });
  // Manage remove-category
  $('#manage-delete-category-button').removeClass('disabled').click(function(){
    var target = $('#manage-delete-category').val();
    // Early escape clauses. Help with indentation problems
    if(target < 0){return;}
    if(target == 1){
      notify('manage-tab', "The Uncategorized category cannot be deleted",
             'warning');
      return;
    }
    var name = $('#manage-delete-category option[value=' + target + ']').text();
    dbModel.countCategoryMembers(target, function(number){
      if(number != 0){
        notify('manage-tab', "Cannot delete nonempty category "+name,
        'warning');
        return;
      }
      dbModel.deleteCategory(target, function(){
        dbModel.update(updateLists);
        notify('manage-tab', "Successfully deleted category "+name, 'success');
      }, function(){
        notify('manage-tab', "Failed to delete category "+name, 'danger');
      });
    });
  });
  // Manage add-location
  $('#manage-add-location-button').removeClass('disabled').click(function(){
    var nameField = $('#manage-add-location-name');
    var name = nameField.val();
    var inside = $('#manage-add-location-inside').val();
    if(name == "" || inside < 0){return;}
    dbModel.addLocation(name, inside, function(){
      nameField.val("");
      dbModel.update(updateLists);
      notify('manage-tab', "Successfully added location "+name, 'success');
    }, function(){
      notify('manage-tab', "Failed to add location "+name, 'danger');
    });
  });
  // Manage delete-location
  $('#manage-delete-location-button').removeClass('disabled').click(function(){
    var target = $('#manage-delete-location').val();
    var name = $('#manage-delete-location option[value=' + target +']').text();
    if(target < 0){return;}
    if(target == 1){
      notify('manage-tab', "You are not allowed to delete the World",
             'warning');
      return;
    }
    dbModel.countLocationMembers(target, function(numbers){
      var items = numbers[0];
      var subloc = numbers[1];
      if(items != 0){
        notify('manage-tab', "Cannot delete nonempty location "+name,
        'warning');
        return;
      }
      if(subloc != 0){
        notify('manage-tab', "Location "+name+" still has children; cannot"+
               " delete", 'warning');
        return;
      }
      dbModel.deleteLocation(target, function(){
        dbModel.update(updateLists);
        notify('manage-tab', "Successfully deleted location "+name, 'success');
      }, function(){
        notify('manage-tab', "Failed to delete location "+name, 'danger');
      });
    });
  });
  // Manage move-location
  $('#manage-move-location-button').removeClass('disabled').click(function(){
    var from = $('#manage-move-location-from').val();
    var into = $('#manage-move-location-into').val();
    if(from == null || into == null){return;}
    if(from == into){
      notify('manage-tab', "Cannot move a location into itself", 'warning');
      return;
    }
    if(from == 1){
      notify('manage-tab', "You cannot move the World", 'warning');
      return;
    }
    var name = $('#manage-move-location-from option[value=' + from +']').text();
    dbModel.updateSuperLocation(from, into, function(){
      dbModel.update(updateLists);
      notify('manage-tab', "Successfully moved location "+name, 'success');
    }, function(){
      notify('manage-tab', "Failed to move location "+name, 'danger');
    });
  });

  // Add stuff
  $('#add-stuff-button').removeClass('disabled').click(function(){
    var name = $('#add-stuff').val();
    var quantity = $('#add-stuff-quantity').val();
    var category = $('#add-stuff-category').val();
    var location = $('#add-stuff-location').val();
    if(name == "" || quantity == "" || category == null || location == null){
      return;
    }
    dbModel.addStuff(name, quantity, category, location, function(){
      notify('add-tab', "Successfully added "+name, 'success');
    }, function(){
      notify('add-tab', "Failed to add "+name, 'danger');
    });
  });

  // Move stuff
  $('#move-stuff-button').removeClass('disabled').click(function(){
    var rows = getSelectedRows();
    if(rows == null){return;}
    var location = $('#move-stuff').val();
    if(location == null){return;}
    var ids = [];
    for(i = 0; i < rows.length; i++){
      ids.push(rows[i].value);
    }
    dbModel.moveStuff(ids, location, null, function(){
      notify('stuff-tab', "Failed to move items", 'danger');
    });
  });
  // Recategorize stuff
  $('#recategorize-stuff-button').removeClass('disabled').click(function(){
    var rows = getSelectedRows();
    if(rows == null){return;}
    var category = $('#recategorize-stuff').val();
    if(category == null){return;}
    var ids = [];
    for(i = 0; i < rows.length; i++){
      ids.push(rows[i].value);
    }
    dbModel.recategorizeStuff(ids, category, null, function(){
      notify('stuff-tab', "Failed to recategorize items", 'danger');
    });
  });
  // Change stuff quantity
  $('#change-stuff-quantity-button').removeClass('disabled').click(function(){
    var rows = getSelectedRows();
    if(rows == null){return;}
    var quantity = $('#change-stuff-quantity').val();
    if(quantity == null){return;}
    var ids = [];
    for(i = 0; i < rows.length; i++){
      ids.push(rows[i].value);
    }
    dbModel.changeStuffQuantity(ids, quantity, null, function(){
      notify('stuff-tab', "Failed to change quantity of items", 'danger');
    });
  });
  // Split stack of stuff
  $('#split-stuff-stack-button').removeClass('disabled').click(function(){
    var rows = getSelectedRows();
    if(rows == null){return;}
    if(rows.length > 1){
      notify('stuff-tab', "Splitting more than one stack at once isn't "+
             "supported", 'warning');
      return;
    }
    var quantity = $('#split-stuff-stack').val();
    if(quantity == null){return;}
    var id = rows[0].value;
    dbModel.splitStuffStack(id, quantity, function(){
      notify('stuff-tab', "Original stack doesn't have a quantity large enough"+
             " for that split", 'warning');
    }, function(){
      notify('stuff-tab', "Failed to split stack", 'danger');
    });
  });

  // Filtering
  $('#filter-button').removeClass('disabled').click(function(){
    var text = $('#text-filter').val();
    var category = $('#filter-category').val();
    var location = $('#filter-location').val();
    if(text == ""){text = null}
    if(category == -1){category = null}
    if(location == -1){location = null}
    dbModel.makeFilterView(text, category, location, function(){
      updateTable();
    });
  });
});
