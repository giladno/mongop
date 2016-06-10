'use strict';
const Database = require('./lib/database.js');

module.exports = (conn_url, collections, opts)=>new Database(conn_url, collections, opts);
