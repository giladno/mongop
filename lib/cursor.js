'use strict';
const Promise = require('bluebird');

function Cursor(cur){
    this._cur = cur;
};

const prototype = require('mongojs/lib/cursor.js').prototype;
Object.keys(prototype).forEach(func=>{
    if ({forEach: true, destroy: true}[func])
    {
        return Cursor.prototype[func] = function(){
            return prototype[func].apply(this._cur, arguments);
        };
    }
    if ({batchSize: true, hint: true, limit: true, maxTimeMS: true, max: true,
        min: true, skip: true, snapshot: true, sort: true}[func])
    {
        return Cursor.prototype[func] = function(){
            prototype[func].apply(this._cur, arguments);
            return this;
        };
    }
    if ({toArray: true}[func])
    {
        return Cursor.prototype[func] = function(){
            if (this._promise)
                return this._promise;
            return this._promise = Promise.promisify(prototype[func], {context: this._cur})();
        };
    }
    Cursor.prototype[func] = function(){
        return Promise.promisify(prototype[func]).apply(this._cur, arguments);
    };
});
Cursor.prototype.stream = function(){ return this._cur; };
Cursor.prototype.then = function(){
    const promise = this.toArray();
    return promise.then.apply(promise, arguments);
};
Cursor.prototype.catch = function(){
    const promise = this.toArray();
    return promise.catch.apply(promise, arguments);
};

module.exports = Cursor;
