/**
 * @module Massive Collections
 * @resource Core
 *
 * Easiest collection wrapper for Massive-js
 *
 * @author: Alexandre PENOMBRE <aluzed_AT_gmail.com>
 */
const { InvalidFormat, CannotBeEmpty } = require('./errors');
const Promise = require('bluebird');
let __collections = {};

module.exports = class MassiveCollection {
  /**
   * @entry Collection
   * @type Class
   *
   * Class collection
   *
   * @param {String} tableName
   * @param {Object} connection
   */
  constructor(tableName, connection) {
    if(typeof tableName === "undefined")
      throw new MissingArg('tableName');

    this.db = null;
    this.connection = null;
    this.tableName = tableName;

    // Formatters
    this.toDB = null;
    this.toJS = null;

    // Hooks
    this.pre = {
      flush: null,
      insert: null,
      update: null,
      remove: null,
      find: null
    };

    this.post = {
      flush: null,
      insert: null,
      update: null,
      remove: null,
      find: null
    };

    if(typeof connection !== "undefined") {
      this.connection = connection;
      this.db = this.connection[this.tableName];
    }

    // Add it in collections
    __collections[this.tableName] = this;
  }

  /**
   * @entry getModel
   * @type Static Method
   *
   * Get a model that has already been declared
   *
   * @param {String} name
   * @returns {Model}
   */
  static getModel(name) {
    if(typeof name !== "string")
      throw new InvalidFormat('name');

    if(typeof __collections[name] === "undefined")
      throw new Error(name + ' is missing in collections');

    return __collections[name];
  }

  /**
   * @entry setConnection
   * @type Method
   *
   * Set connection to db after instanciation
   *
   * @param {Object} connection
   */
  setConnection(connection) {
    this.connection = connection;
    this.db = this.connection[this.tableName];
  }

  /**
   * @entry dbFormat
   * @type Method
   *
   * Format JS data to DB format before write instructions
   *
   * @param {Function} callback
   * @constraint callback must be type of function
   * @constraint the callback must return an object with data setted
   */
  dbFormat(callback) {
    if(typeof callback !== "function")
      throw new InvalidFormat(callback);

    this.toDB = callback;
  }

  /**
   * @entry jsFormat
   * @type Method
   *
   * Format DB data to JS format after read instructions
   *
   * @param {Function} callback
   * * @constraint callback must be type of function
   * @constraint the callback must return an object with data setted
   */
  jsFormat(callback) {
    if (typeof callback !== "function")
      throw new InvalidFormat(callback);

    this.toJS = callback;
  }

  /**
   * @entry preHook
   * @type Method
   *
   * Bind a hook before a db call
   *
   * @param {String} hookName insert|find|update|remove
   * @param {Function} callback
   * @constraint hookName must exist in waited hooks (insert, find, update, remove)
   * @constraint callback must be type of function
   * @constraint callback must have a parameter next and this parameter must be called to continue execution
   */
  preHook(hookName, callback) {
    if(typeof this.pre[hookName] === "undefined")
      throw new Error('Unknown hook');

    if(typeof callback !== "function")
      throw new InvalidFormat('callback');

    this.pre[hookName] = callback;
    this.pre[hookName] = this.pre[hookName].bind(this);
  }

  /**
   * @entry postHook
   * @type Method
   *
   * Bind a hook after a db call
   *
   * @param {String} hookName insert|find|update|remove
   * @param {Function} callback
   * @constraint hookName must exist in waited hooks (insert, find, update, remove)
   * @constraint callback must be type of function
   * @constraint callback must have a parameter next and this parameter must be called to continue execution
   */
  postHook(hookName, callback) {
    if(typeof this.post[hookName] === "undefined")
      throw new Error('Unknown hook');

    if(typeof callback !== "function")
      throw new InvalidFormat('callback');

    this.post[hookName] = callback;
    this.post[hookName] = this.post[hookName].bind(this);
  }

  /**
   * @entry insert
   * @type Method
   *
   * Insert data in our table
   *
   * @param {Object} data
   * @returns {Promise}
   * @constraint data must be type of object
   * @throws {InvalidFormat|CannotBeEmpty}
   */
  insert(data) {
    if(typeof data !== "object")
      throw new InvalidFormat('data');

    if (Object.keys(data).length < 1)
      throw new CannotBeEmpty('data');

    if(!!this.toDB)
      data = this.toDB(data);

    return new Promise((resolve, reject) => {
      if(!!this.pre.insert) {
        this.pre.insert(resolve, data);
      }
      else {
        resolve(data);
      }
    })
    .then(data => {
      return new Promise((resolve, reject) => {
        this.db.insert(data)
          .then((res) => {
            if(!!this.toJS)
              res = this.toJS(res);

            if(!!this.post.insert)
              this.post.insert(res);

            resolve(res);
          })
          .catch(err => {
            reject(err);
          })
      });
    });
  }

  /**
   * @entry update
   * @type Method
   *
   * Update data in our table
   *
   * @param {Number} id
   * @param {Object} data
   * @returns {Promise}
   * @constraint id must be type of number
   * @constraint data must be type of object
   * @throws {InvalidFormat|CannotBeEmpty}
   */
  update(id, data) {
    if (typeof id !== "number")
      throw new InvalidFormat('id');

    if (typeof data !== "object")
      throw new InvalidFormat('data');

    if (Object.keys(data).length < 1)
      throw new CannotBeEmpty('data');

    if (!!this.toDB)
      data = this.toDB(data);

    return new Promise((resolve, reject) => {
      if (!!this.pre.update) {
        this.pre.update(resolve, data);
      }
      else {
        resolve(data);
      }
    })
    .then(data =>  {
      return new Promise((resolve, reject) => {
        this.db.update({ id }, data)
          .then((res) => {
          if (!!this.toJS)
            res.map(r => this.toJS(r));

          if (!!this.post.update)
            this.post.update(res);

          resolve(res);
        })
        .catch(err => {
          reject(err);
        })
      });
    });
  }

  /**
   * @entry remove
   * @type Method
   *
   * Remove a row in our table
   *
   * @param {Number} id
   * @constraint id must be type of number
   * @returns {Promise}
   * @throws {InvalidFormat}
   */
  remove(id) {
    if (typeof id !== "number")
      throw new InvalidFormat('id');

    return new Promise((resolve, reject) => {
      if (!!this.pre.remove) {
        this.pre.remove(resolve);
      }
      else {
        resolve();
      }
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        this.db.destroy({ id })
          .then((res) => {
            if (!!this.toJS)
              res.map(r => this.toJS(r));

            if (!!this.post.remove)
              this.post.remove(res);

            resolve(res);
          })
          .catch(err => {
            reject(err);
          })
      });
    });
  }

  /**
   * @entry flush
   * @type Method
   *
   * Remove the entire table
   *
   * @returns {Promise}
   */
  flush() {
    return new Promise((resolve, reject) => {
      if (!!this.pre.flush) {
        this.pre.flush(resolve);
      }
      else {
        resolve();
      }
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        this.connection.run('TRUNCATE ' + this.tableName)
          .then((res) => {
            if (!!this.post.flush)
              this.post.flush(res);

            resolve(res);
          })
          .catch(err => {
            reject(err);
          })
      });
    });
  }

  /**
   * @entry find
   * @type Method
   *
   * Retreive items from our database
   *
   * @param {Object} conditions
   * @param {Object} options
   * @returns {Promise}
   */
  find(conditions, options) {
    if(typeof conditions !== "object")
      conditions = {};

    if(typeof options !== "object")
      options = {};

    return new Promise((resolve, reject) => {
      if (!!this.pre.find) {
        this.pre.find(resolve);
      }
      else {
        resolve();
      }
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        this.db.find(conditions, options)
          .then((res) => {
            if (!!this.toJS)
              res.map(r => this.toJS(r));

            if (!!this.post.find)
              this.post.find(res);

            resolve(res);
          })
          .catch(err => {
            reject(err);
          })
      });
    });
  }
}
