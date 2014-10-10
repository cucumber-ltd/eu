/**
 * Creates a new in-memory LRU backed storage.
 *
 * @param lru an LRU instance, created by var LRU = require('lru'); lru = new LRU();
 */
module.exports = function MemoryStore(lru) {
  this.set = function (key, value, ttlMillis, cb) {
    lru.set(key, value);
    // Max timeout value in JavaScript is 2^31-1
    var timeout = Math.min(0x7FFFFFFF, ttlMillis);
    setTimeout(function () {
      lru.del(key);
    }, timeout);
    cb();
  };

  this.get = function (key, cb) {
    cb(null, lru.get(key));
  };

  this.flush = function (prefix, cb) {
    var deleted = 0;
    lru.forEach(function (value, key) {
      var startsWithPrefix = key.indexOf(prefix) == 0
      if (startsWithPrefix) {
        lru.del(key);
        deleted++;
      }
    })
    cb(null, deleted);
  };

  this.flushAll = function (cb) {
    lru.reset();
    cb();
  }
};
