'use strict';
const mongojs = require('mongojs');
const Collection = require('./collection.js');

module.exports = function Database(conn_url, collections){
    this._db = mongojs.apply(null, arguments);
    (collections||[]).forEach(name=>{
        this[name] = new Collection(this._db.collection(name));
    });
    this.ObjectId = this.ObjectID = this._db.ObjectId;
};

const prototype = require('mongojs/lib/database.js').prototype;
Object.keys(prototype).forEach(func=>{
    if (func=='toString')
    {
        return Database.prototype[func] = function(){
            return prototype[func].call(this._db);
        };
    }
    if (func=='collection')
    {
        return Database.prototype[func] = function(name){
            new Collection(this._db.collection(name));
        };
    }
    Database.prototype[func] = function(){
        const args = [].slice.call(arguments);
        return new Promise((resolve, reject)=>{
            args.push((err, res)=>{
                if (err)
                    return reject(err);
                resolve(res);
            });
            prototype[func].apply(this._db, args);
        });
    };
});
