const sqlite3 = require('sqlite3').verbose();

// Database GET?
this.loaded = false;

// Load the database
this.loadDatabase = function(filename, callback){
  this.db = new sqlite3.Database(filename, callback);
  this.loaded = true;
}

// Create a database and load it
this.createDatabase = function(filename, callback){
  this.loadDatabase(filename, callback);
  initDB(this.db);
}

// Initialize the database
function initDB(db){
  db.serialize(function(){
    // Create the base tables
    db.run("CREATE TABLE category (id INTEGER PRIMARY KEY AUTOINCREMENT, name\
    TEXT);");
    db.run("CREATE TABLE item (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,\
    category NUMERIC);");
    db.run("CREATE TABLE location (id INTEGER PRIMARY KEY AUTOINCREMENT, name\
    TEXT, inside INTEGER);");
    db.run("CREATE TABLE entity (item INTEGER NOT NULL, location INTEGER NOT\
    NULL, quantity INTEGER);");

    // Add base data
    db.run("INSERT INTO location (name) VALUES ('World')");
    db.run("INSERT INTO category (name) VALUES ('Uncategorized')");
  });
}

// Close the database
this.close = function(){
  if(this.loaded){
    this.db.close();
  }
}
