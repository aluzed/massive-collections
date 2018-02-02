#!/usr/bin/env node

/* eslint-disable no-console */
'use strict';
const log = require('color-log');
const argv = require('minimist')(process.argv.slice(2));
const path = require('path');
const os = require('os');
const fs = require('fs');
const massive = require('massive');
const helpFile = './help';

const currentPath = path.resolve(__dirname);

// File that will contain our credentials
const credentialsPath = path.join(__dirname, 'massive-collections_credentials.json');

// Check git ignore
if(currentPath.indexOf('node_modules') > -1) {
  const parentPath = path.resolve(currentPath.split('node_modules')[0]);

  const gitIgnorePath = path.join(parentPath, '.gitignore');

  // Get relative path from gitignore file
  const credentialsRelative = credentialsPath.substring(parentPath.length, credentialsPath.length);

  if(fs.existsSync(gitIgnorePath) && fs.lstatSync(gitIgnorePath)) {
    const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');

    let splitted = gitIgnoreContent.split(os.EOL);

    let found = false;

    for(let i in splitted) {
      if(splitted[i].match(credentialsRelative + "\s*$")) {
        found = true;
      }
    }

    // If credientials is not in gitignore
    if(!found) {
      // Add it
      splitted.push('.' + credentialsRelative);

      // Save
      fs.writeFileSync(gitIgnorePath,
        splitted.filter(r => r.trim() !== "").join(os.EOL)); // remove empty rows
    }
  }
}

/**
* @entry connect
* @type CLI
*
* Creates credientials file to execute queries
*
* @param {String} address host:port
* @param {String} db
* @param {String} user
* @param {String} password
* @constraint address must be type of string
* @constraint address be formatted like 'host:port'
* @constraint db must be type of string
* @constraint user must be type of string
* @constraint password must be type of string
*/
function connect(address, db, user, password) {
  if(typeof address === "undefined" || typeof user === "undefined" || typeof password === "undefined" || typeof db === "undefined")
    throw new Error('Missing parameter, address, db, user and password are required to connect.');

  const [host, port] = address.split(':');

  if(typeof host === "undefined" || typeof port === "undefined")
    throw new Error('Bad address format, it should be like host:port');

  const cred = { user, password, host, port, database: db };

  fs.writeFileSync(credentialsPath, JSON.stringify(cred));

  log.info('Connected');
}

/**
* @entry disconnect
* @type CLI
*
* Remove credientials file
*/
function disconnect() {
  if(fs.existsSync(credentialsPath) && fs.lstatSync(credentialsPath).isFile()) {
    fs.unlinkSync(credentialsPath);
  }

  log.info('Disconnected');
}

/**
* @entry createTable
* @type CLI
*
* Generate a create table query
*
* @param {String} tableName
* @param {Array} columns (column:type:[index]:[nullable]:[default])
* @constraint tableName must be type of string
* @constraint columns must be type of array
*/
function createTable(tableName, columns) {
  if(typeof tableName === "undefined" || typeof columns === "undefined")
    throw new Error('Missing parameter, table name and columns must be defined.');

  if(typeof columns.splice === "undefined")
    throw new Error('Columns must be type of array.');

  if(columns.length === 0)
    throw new Error('Columns missing.');

  const cols = ['id serial primary key'];

  // Sanitize types
  function handleType(type) {
    switch(type.toLowerCase()) {
      case "int":
        type = "integer";
      break;

      case "bool":
        type = "boolean";
      break;

      case "timestampz":
        type = "timestamp with time zone"
      break;

      default:
        return type;
    }

    return type;
  }

  // Sanitize index
  function handleIndex(index) {
    switch(index.toLowerCase()) {
      case "unique" :
        index = " UNIQUE";
      break;

      case "noindex" :
        index = "";
      break;

      default:
        throw new Error('Bad index value : ' + index);
      break;
    }

    return index;
  }

  // Sanitize nullable
  function handleNullable(nullable) {
    switch(nullable.toLowerCase()) {
      case "notnull":
        nullable = " NOT NULL";
      break;

      case "null":
        nullable = "";
      break;

      default:
        throw new Error('Bad nullable value : ' + nullable);
    }

    return nullable;
  }

  for(let i in columns) {
    let column = columns[i].split(':');

    if(column.length < 2)
      throw new Error('Bad column format : ' + columns[i]);

    switch(column.length) {
      case 2 :
        var [name, type] = column;

        type = handleType(type);

        cols.push(`${name} ${type}`);
      break;

      case 3 :
        var [name, type, index] = column;

        type = handleType(type);
        index = handleIndex(index);

        cols.push(`${name} ${type}${index}`);
      break;

      case 4 :
        var [name, type, index, nullable] = column;

        type = handleType(type);
        index = handleIndex(index);
        nullable = handleNullable(nullable);

        cols.push(`${name} ${type}${index}${nullable}`);
      break;

      case 5 :
        var [name, type, index, nullable, def] = column;

        if(def.length === 0)
          throw new Error('Missing default value for column ' + name);

        type = handleType(type);
        index = handleIndex(index);
        nullable = handleNullable(nullable);

        cols.push(`${name} ${type}${index}${nullable} DEFAULT ${def}`);
      break;
    }
  }

  let query = `CREATE TABLE IF NOT EXISTS "${tableName}" ( ${cols.join(', ')} )`;

  return query;
}

/**
* @entry runQuery
* @type CLI
*
* Connect to a db then execute a query
*
* @param {String} query
* @constraint query must be type of string
*/
function runQuery(query) {
  if(typeof query !== "string")
    throw new Error('Bad query');

  if(!fs.existsSync(credentialsPath))
    throw new Error('Error, you must connect first.');

  const credentials = require(credentialsPath);

  massive(credentials).then(db => {
    db.query(query).then((res) => {
      log.info('Done.');
      process.exit(0);
    }).catch(err => {
      throw err;
    })
  });
}

try {
  // Handle argv
  if(argv._.length > 0) {

    switch(argv._[0]) {
      case 'connect':
        connect(argv.h, argv.db, argv.u, argv.p);
      break;

      case 'disconnect':
        disconnect();
      break;

      case 'create-table':
      case 'createTable':
        if(argv._.length < 3) 
          throw new Error('Error, not enough arguments.');

        const tableName = argv._[1];
        const cols = argv._.splice(2, argv._.length);

        const query = createTable(tableName, cols);

        runQuery(query);
      break;

      case 'help':
        // Cleaner
        require(helpFile);
      break;
    }
  }
}
catch(err) {
  log.error(JSON.stringify(err));
  log.error('Please read the documentation : massive-collections-cli help');
}

module.exports = {
  connect,
  disconnect,
  createTable,
  runQuery
};

// console.log(argv);
