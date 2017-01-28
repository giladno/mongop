'use strict';
const Promise = require('bluebird');
const mongojs = require('mongojs');
const Collection = require('./collection.js');

function Database(conn_url, collections){
    this._db = mongojs.apply(null, arguments);
    (collections||[]).forEach(name=>{
        this[name] = new Collection(this._db.collection(name));
    });
    this.ObjectId = this.ObjectID = this._db.ObjectId;
};

Database.prototype.index = Promise.coroutine(function*(collections){
    return yield Promise.all(Object.keys(collections).reduce((indexes, name)=>{
        indexes = indexes.concat((collections[name].unique||[]).map(key=>this[name].ensureIndex(key.split(',')
            .reduce((o, k)=>Object.assign(o, {[k.trim()]: 1}), {}), {unique: true})));
        return indexes.concat((collections[name].index||[]).map(key=>this[name].ensureIndex(key.split(',')
            .reduce((o, k)=>Object.assign(o, {[k.trim().replace(/~/, '')]: k.match(/~/) ? 'text' : 1}), {}))));
    }, []));
});

Database.prototype.bulk = Promise.coroutine(function*(col, opt, cb){
    if (typeof opt=='function')
    {
        cb = opt;
        opt = {};
    }
    opt.operations = opt.operations||500;
    let bulk, i = 0, tasks = [];
    yield Promise.resolve(cb(()=>{
        if (i++>=opt.operations)
        {
            tasks.push(bulk.execute());
            i = 0;
            bulk = null;
        }
        bulk = bulk||this[col][opt.ordered ? 'initializeOrderedBulkOp' :
            'initializeUnorderedBulkOp']();
        return bulk;
    }));
    if (bulk)
        tasks.push(bulk.execute());
    return yield Promise.all(tasks);
});

const prototype = require('mongojs/lib/database.js').prototype;
Object.keys(prototype).forEach(func=>{
    if ({toString: true}[func])
    {
        return Database.prototype[func] = function(){
            return prototype[func].call(this._db);
        };
    }
    if ({collection: true}[func])
    {
        return Database.prototype[func] = function(name){
            new Collection(this._db.collection(name));
        };
    }
    Database.prototype[func] = function(){
        return Promise.promisify(prototype[func]).apply(this._db, arguments);
    };
});

module.exports = Database;
