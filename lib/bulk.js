'use strict';
const Promise = require('bluebird');

function Bulk(bulk){
    this._bulk = bulk;
};

const prototype = require('mongojs/lib/bulk.js').prototype;
Object.keys(prototype).forEach(func=>{
    if (func=='execute')
    {
        return Bulk.prototype[func] = function(){
            return Promise.promisify(prototype[func], {context: this._bulk})();
        };
    }
    Bulk.prototype[func] = function(){
        return prototype[func].apply(this._bulk, arguments);
    };
});
Bulk.prototype.find = function(){
    return this._bulk.find.apply(this._bulk, arguments);
};

module.exports = Bulk;
