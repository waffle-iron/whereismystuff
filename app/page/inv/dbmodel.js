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
    for(i = 1; i < rows.length; i++){
      ltree.insert(new treelib.Node(null, {
        'id' : rows[i].id,
        'name' : rows[i].name
      }), rows[i].inside_id, rows[i].id);
    }
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
