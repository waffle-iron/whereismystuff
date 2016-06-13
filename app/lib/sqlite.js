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
    db.run("CREATE TABLE category (\
      id INTEGER PRIMARY KEY AUTOINCREMENT,\
      name TEXT\
    );");
    db.run("CREATE TABLE item (\
      id INTEGER PRIMARY KEY AUTOINCREMENT,\
      name TEXT,\
      category_id INTEGER\
    );");
    db.run("CREATE TABLE location (\
      id INTEGER PRIMARY KEY AUTOINCREMENT,\
      name TEXT,\
      inside_id INTEGER\
    );");
    db.run("CREATE TABLE entity (\
      id INTEGER PRIMARY KEY AUTOINCREMENT,\
      item_id INTEGER NOT NULL,\
      location_id INTEGER NOT NULL,\
      quantity INTEGER\
    );");

    // Add base data
    db.run("INSERT INTO location (name) VALUES ('World');");
    db.run("INSERT INTO category (name) VALUES ('Uncategorized');");

    // Add main view
    db.run("CREATE VIEW inventory AS\
      SELECT entity.id AS id, entity.quantity AS quantity, item.name AS name,\
        category.name AS category, location.name AS location\
      FROM entity\
      INNER JOIN location\
      ON entity.location_id = location.id\
      INNER JOIN item\
      ON entity.item_id = item.id\
      INNER JOIN category\
      ON item.category_id = category.id\
      WHERE entity.quantity > 0\
    ;");
  });
}

// Prepares a statement - the primary way the database will be accessed
this.makeStatement = function(sql){
  return this.db.prepare(sql);
}

// Close the database
this.close = function(){
  if(this.loaded){
    this.db.close();
  }
}
