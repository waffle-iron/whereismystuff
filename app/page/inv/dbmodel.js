const treelib = require('tree');

// Update function
this.update = function(updateCallback){
  this.buildLocationTree(updateCallback);
}

// Function to pass in the dbm, in lieu of a proper constructor
this.passDBM = function(dbm){
  this.dbm = dbm;
}

// Retrieve the top of the inventory
this.getInvHead = function(callback){
  var stmt = this.dbm.makeStatement("SELECT * FROM inventory ORDER BY id DESC\
    LIMIT 30;");
  stmt.each(function(err, row){
    if(err == null){
      callback(row);
    }
    else{
      throw err;
    }
  },
  function(err, num){
    if(err == null){
      console.log("Got " + num + " rows");
      stmt.finalize();
    }
    else{
      throw err;
    }
  });
}

// Build the location tree
this.buildLocationTree = function(complete){
  this.locationTree = new treelib.Root();
  var ltree = this.locationTree;
  var stmt = this.dbm.makeStatement("SELECT * FROM location ORDER BY id ASC;");
  stmt.all(function(err, rows){
    // Handle the root
    var rootnode = new treelib.Node(null, {
      'id' : rows[0].id,
      'name' : rows[0].name
    });
    ltree.branch.append(rootnode);
    // Handle the rest of the tree
    do{
      var jump = false;
      for(i = 1; i < rows.length; i++){
        if(ltree.find(rows[i].inside_id) == null){
          jump = true;
        }
        else if(ltree.find(rows[i].id) == null){
          ltree.insert(new treelib.Node(null, {
            'id' : rows[i].id,
            'name' : rows[i].name
          }), rows[i].inside_id, rows[i].id);
        }
      }
    }while(jump);
    stmt.finalize();
    if(complete != undefined){
      complete();
    }
  });
}

// List the categories
this.getCategories = function(callback){
  var stmt = this.dbm.makeStatement("SELECT * FROM category ORDER BY name\
  ASC;");
  stmt.each(function(err, row){
    if(err == null){
      callback(row);
    }
    else{
      throw err;
    }
  },
  function(err, num){
    if(err == null){
      console.log("Got " + num + " rows");
      stmt.finalize();
    }
    else{
      throw err;
    }
  });
}

// Recurses over the location tree, appends a prefix to the name. Calls the
// callback for each item
this.printTreeRecurse = function(prefix, branch, callback){
  var i = 0;
  for(i = 0; i < branch.nodes.length; i++){
    callback({id: branch.nodes[i].id,
              name: prefix + branch.nodes[i].data.name});
    this.printTreeRecurse('>' + prefix, branch.nodes[i].children, callback);
  }
}

// List the locations
this.getLocations = function(callback){
  this.printTreeRecurse('', this.locationTree.branch, callback);
}

// Add a category
this.addCategory = function(name, successCB, failCB){
  var stmt = this.dbm.makeStatement("INSERT INTO category (name) VALUES \
  ($name)");
  stmt.run({$name: name}, function(err, row){
    if(err == null){
      if(successCB != undefined){
        successCB();
      }
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  stmt.finalize();
}

// Delete a category
this.deleteCategory = function(id, successCB, failCB){
  var stmt = this.dbm.makeStatement("DELETE FROM category WHERE id = $id");
  stmt.run({$id: id}, function(err, row){
    if(err == null){
      if(successCB != undefined){
        successCB();
      }
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  stmt.finalize();
}

// Count category members
this.countCategoryMembers = function(id, callback){
  var stmt = this.dbm.makeStatement("SELECT COUNT(*) AS num FROM item WHERE \
  category_id = $id;");
  stmt.get({$id: id}, function(err, row){
    if(err == null){
      callback(row.num);
    }
    else{
      throw err;
    }
  });
  stmt.finalize();
}

// Add location
this.addLocation = function(name, insideID, successCB, failCB){
  var stmt = this.dbm.makeStatement("INSERT INTO location (name, inside_id) \
  VALUES ($name, $inID)");
  stmt.run({$name: name, $inID: insideID}, function(err, row){
    if(err == null){
      if(successCB != undefined){
        successCB();
      }
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  stmt.finalize();
}

// Remove location
this.deleteLocation = function(id, successCB, failCB){
  var stmt = this.dbm.makeStatement("DELETE FROM location WHERE id = $id");
  stmt.run({$id: id}, function(err, row){
    if(err == null){
      if(successCB != undefined){
        successCB();
      }
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  stmt.finalize();
}

// Count location members and sub-locations
this.countLocationMembers = function(id, callback){
  var stmt = this.dbm.makeStatement("SELECT COUNT(*) AS num FROM entity WHERE \
  location_id = $id AND quantity > 0;");
  var substmt = this.dbm.makeStatement("SELECT COUNT(*) AS sub FROM location \
  WHERE inside_id = $id;")
  stmt.get({$id: id}, function(err, row){
    if(err == null){
      var num = row.num;
      substmt.get({$id: id}, function(err, row){
        if(err == null){
          callback([num, row.sub]);
        }
        else{
          throw err;
        }
      });
      substmt.finalize();
    }
    else{
      throw err;
    }
  });
  stmt.finalize();
}

// Update super-location of a location
this.updateSuperLocation = function(id, superID, successCB, failCB){
  var stmt = this.dbm.makeStatement("UPDATE location SET inside_id = $superid\
  WHERE id = $id");
  stmt.run({$id: id, $superid: superID}, function(err, row){
    if(err == null){
      if(successCB != undefined){
        successCB();
      }
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  stmt.finalize();
}

// Add stuff
this.addStuff = function(name, quantity, category, location, successCB, failCB){
  var successCB = successCB;
  var failCB = failCB;
  var idstmt = this.dbm.makeStatement("SELECT seq FROM sqlite_sequence WHERE \
  name = 'item'");
  var itemstmt = this.dbm.makeStatement("INSERT INTO item (id, name, \
  category_id) VALUES ($id, $name, $catID)");
  var entstmt = this.dbm.makeStatement("INSERT INTO entity (item_id, \
  location_id, quantity) VALUES ($item, $locID, $quantity)");
  idstmt.get(function(err, row){
    if(err == null){
      var id = row.seq + 1;
      itemstmt.run({$id: id, $name: name, $catID: category}, function(err, row){
        if(err == null){
          entstmt.run({$item: id, $locID: location, $quantity: quantity},
                     function(err,row){
            if(err == null){
              if(successCB != undefined){
                successCB();
              }
            }
            else{
              if(failCB != undefined){
                failCB();
              }
              throw err;
            }
          });
          entstmt.finalize();
        }
        else{
          if(failCB != undefined){
            failCB();
          }
          throw err;
        }
      });
      itemstmt.finalize();
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  idstmt.finalize();
}

// Move stuff
this.moveStuff = function(ids, location, successCB, failCB){
  var stmt = this.dbm.makeStatement("UPDATE entity SET location_id = $locid\
  WHERE id = $id");
  for(i = 0; i < ids.length; i++){
    stmt.run({$id: ids[i], $locid: location}, function(err, row){
      if(err != null){
        if(failCB != undefined){
          failCB();
        }
        throw err;
      }
    });
  }
  stmt.finalize();
}

// Recategorize stuff
this.recategorizeStuff = function(ids, category, successCB, failCB){
  var stmt = this.dbm.makeStatement("UPDATE item SET category_id = $catid\
  WHERE id = (SELECT item_id FROM entity WHERE id = $id);");
  for(i = 0; i < ids.length; i++){
    stmt.run({$id: ids[i], $catid: category}, function(err, row){
      if(err != null){
        if(failCB != undefined){
          failCB();
        }
        throw err;
      }
    });
  }
  stmt.finalize();
}

// Change stuff quantity
this.changeStuffQuantity = function(ids, quantity, successCB, failCB){
  var stmt = this.dbm.makeStatement("UPDATE entity SET quantity = $quantity\
  WHERE id = $id;");
  for(i = 0; i < ids.length; i++){
    stmt.run({$id: ids[i], $quantity: quantity}, function(err, row){
      if(err != null){
        if(failCB != undefined){
          failCB();
        }
        throw err;
      }
    });
  }
  stmt.finalize();
}

// Split stack of stuff
this.splitStuffStack = function(id, quantity, insufficientCB, failCB){
  var getstmt = this.dbm.makeStatement("SELECT * FROM entity WHERE id = $id");
  var insstmt = this.dbm.makeStatement("INSERT INTO entity (item_id, \
  location_id, quantity) VALUES ($item, $loc, $quantity);")
  var updstmt = this.dbm.makeStatement("UPDATE entity SET quantity = $quantity\
  WHERE id = $id;");
  getstmt.get({$id: id}, function(err, row){
    if(err == null){
      var currentQuant = row.quantity;
      if(currentQuant <= quantity){
        insufficientCB();
      }
      else{
        insstmt.run({$item: row.item_id, $loc: row.location_id, $quantity:
                     quantity}, function(err, row){
          if(err == null){
            updstmt.run({$id: id, $quantity: currentQuant - quantity},
                       function(err, row){
              if(err != null){
                if(failCB != undefined){
                  failCB();
                }
                throw err;
              }
            });
          }
          else{
            if(failCB != undefined){
              failCB();
            }
            throw err;
          }
        });
        insstmt.finalize();
      }
    }
    else{
      if(failCB != undefined){
        failCB();
      }
      throw err;
    }
  });
  getstmt.finalize();
}

// Generate virtual filter view
this.makeFilterView = function(textConstraint, categoryConstraint,
                               locationConstraint, callback){
  var query = "CREATE TEMP VIEW filterView AS\
  SELECT entity.id AS id, entity.quantity AS quantity, item.name AS name,\
    category.name AS category, location.name AS location\
  FROM entity\
  INNER JOIN "
  if(locationConstraint != null){
    query += "(SELECT * FROM location WHERE id = "+locationConstraint+") "
  }
  query += "location\
  ON entity.location_id = location.id\
  INNER JOIN "
  if(textConstraint != null){
    query += "(SELECT * FROM item WHERE name LIKE \"%" + textConstraint +
      "%\") "
  }
  query += "item\
  ON entity.item_id = item.id\
  INNER JOIN "
  if(categoryConstraint != null){
    query += "(SELECT * FROM category WHERE id = " + categoryConstraint + ") "
  }
  query += "category\
  ON item.category_id = category.id\
  WHERE entity.quantity > 0;"

  var dbm = this.dbm;
  var dropstmt = this.dbm.makeStatement("DROP VIEW IF EXISTS filterView;");

  dropstmt.run(function(err, row){
    if(err == null){
      var stmt = dbm.makeStatement(query);
      stmt.run(function(err, row){
        if(err == null){
          callback();
        }
        else{
          throw err;
        }
      });
      stmt.finalize();
    }
    else{
      throw err;
    }
  });
  dropstmt.finalize();
}

// Retrieve the top of the inventory
this.getInv = function(callback, finishCB){
  var stmt = this.dbm.makeStatement("SELECT * FROM filterView ORDER BY id \
  DESC;");
  stmt.each(function(err, row){
    if(err == null){
      callback(row);
    }
    else{
      throw err;
    }
  },
  function(err, num){
    if(err == null){
      console.log("Got " + num + " rows");
      finishCB();
      stmt.finalize();
    }
    else{
      throw err;
    }
  });
}
