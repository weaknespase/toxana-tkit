/**
 * Coroutine library based on ES6 generators.
 * Array edition - for use with destructuring
 *
 * Example:
 *  function * coroutine(co, arg1, arg2){
 *      var [err, text] = yield fs.readFile("./config.js", "utf8", co);
 *  }
 *
 * co(coroutine, "hello", "world");
 *
 * Chaining also is possible:
 * co(coroutine, "hello", "world").run(finish);
 */
"use strict"

function Coroutine() {
    this.queue = [];
    this.current = null;
    this.scheduled = false;
}
Coroutine.prototype.run = function coRun(generator, ...args) {
    this.queue.push([generator, args]);
    if (!this.current && !this.scheduled) {
        process.nextTick(this.__run.bind(this));
        this.scheduled = true;
    }
    return this;
}
Coroutine.prototype.__run = function coRunInternal() {
    this.scheduled = false;
    this.current = this.queue.shift();
    if (this.current) {
        this.current[1].unshift(this.__callback.bind(this));
        this.current = this.current[0].apply(null, this.current[1]);
        let m = this.current.next();
        if (m.done) {
            process.nextTick(this.__run.bind(this));
        }
    }
}
Coroutine.prototype.__callback = function coCallback(...args) {
    var result = this.current.next(args);
    if (result.done) {
        process.nextTick(this.__run.bind(this));
    }
}

/**
 * Creates new coroutine based on specified generator.
 * @param {function:{next:function}} generator coroutine code
 * @param {any} ...args arguments to pass at generator creation
 */
module.exports = function co(generator, ...args) {
    var co = new Coroutine();
    co.run(generator, ...args);
    return co;
}