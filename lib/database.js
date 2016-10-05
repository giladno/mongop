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

Database.prototype.index = function(collections){
    return Promise.all(Object.keys(collections).reduce((indexes, name)=>{
        indexes = indexes.concat((collections[name].unique||[]).map(key=>{
            return this[name].ensureIndex(key.split(',').reduce((o, k)=>{
                o[k.trim()] = 1;
                return o;
            }, {}), {unique: true});
        }));
        return indexes.concat((collections[name].index||[]).map(key=>{
            return this[name].ensureIndex(key.split(',').reduce((o, k)=>{
                o[k.trim().replace(/~/, '')] = k.match(/~/) ? 'text' : 1;
                return o;
            }, {}));
        }));
    }, []))
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

module.exports = Database;
