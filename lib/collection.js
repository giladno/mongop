'use strict';
const Promise = require('bluebird');

function Collection(col){
    this._col = col;
};

const prototype = require('mongojs/lib/collection.js').prototype;
Object.keys(prototype).forEach(func=>{
    if (func=='toString')
    {
        return Collection.prototype[func] = function(){
            return prototype[func].call(this._col);
        };
    }
    if (func=='find' || func=='aggregate')
    {
        return Collection.prototype[func] = function(){
            return new Cursor(prototype[func].apply(this._col, arguments));
        };
    }
    if (func=='initializeOrderedBulkOp' || func=='initializeUnorderedBulkOp')
    {
        return Collection.prototype[func] = function(){
            return new Bulk(prototype[func].call(this._col));
        };
    }
    Collection.prototype[func] = function(){
        const args = [].slice.call(arguments);
        return new Promise((resolve, reject)=>{
            args.push((err, res)=>{
                if (err)
                    return reject(err);
                resolve(res);
            });
            prototype[func].apply(this._col, args);
        });
    };
});

module.exports = Collection;
