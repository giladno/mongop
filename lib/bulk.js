'use strict';

module.exports = function Bulk(bulk){
    this._bulk = bulk;
};

const prototype = require('mongojs/lib/bulk.js').prototype;
Object.keys(prototype).forEach(func=>{
    if (func=='execute')
    {
        return Bulk.prototype[func] = function(){
            return new Promise((resolve, reject)=>{
                prototype[func].call(this._bulk, (err, res)=>{
                    if (err)
                        return reject(err);
                    resolve(res);
                });
            });
        };
    }
    Bulk.prototype[func] = function(){
        return prototype[func].apply(this._bulk, arguments);
    };
});
Bulk.prototype.find = function(){
    return this._bulk.find.apply(this._bulk, arguments);
};
