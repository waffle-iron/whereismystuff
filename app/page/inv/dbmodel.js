// Function to pass in the dbm, in lieu of a proper constructor
this.passDBM = function(dbm){
  this.dbm = dbm;
}

// Retrieve the top of the inventory
this.getInvHead = function(callback){
  stmt = this.dbm.makeStatement("SELECT * FROM inventory ORDER BY id DESC LIMIT\
    30;");
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
