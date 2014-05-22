module.exports = function NullCache() {
  this.get = function (key, cb) {
    cb();
  };

  this.set = function (key, private, value, ttlMillis, cb) {
    cb();
  }
};