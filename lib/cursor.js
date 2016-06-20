'use strict';

function Cursor(cur){
    this._cur = cur;
};

const prototype = require('mongojs/lib/cursor.js').prototype;
Object.keys(prototype).forEach(func=>{
    if (func=='forEach' || func=='destroy')
    {
        return Cursor.prototype[func] = function(){
            return prototype[func].apply(this._cur, arguments);
        };
    }
    if (func=='batchSize' || func=='hint' || func=='limit' || func=='maxTimeMS' ||
        func=='max' || func=='min' || func=='skip' || func=='snapshot' || func=='sort')
    {
        return Cursor.prototype[func] = function(){
            prototype[func].apply(this._cur, arguments);
            return this;
        };
    }
    if (func=='toArray')
    {
        return Cursor.prototype[func] = function(){
            if (this._promise)
                return this._promise;
            return this._promise = new Promise((resolve, reject)=>{
                prototype[func].call(this._cur, (err, res)=>{
                    if (err)
                        return reject(err);
                    resolve(res);
                });
            });
        };
    }
    Cursor.prototype[func] = function(){
        const args = [].slice.call(arguments);
        return new Promise((resolve, reject)=>{
            args.push((err, res)=>{
                if (err)
                    return reject(err);
                resolve(res);
            });
            prototype[func].apply(this._cur, args);
        });
    };
});
Cursor.prototype.then = function(){
    const promise = this.toArray();
    return promise.then.apply(promise, arguments);
};
Cursor.prototype.catch = function(){
    const promise = this.toArray();
    return promise.catch.apply(promise, arguments);
};

module.exports = Cursor;
