var request = require('request');
var debug = require('debug')('eu');
var FOREVER_MILLIS = 8640000000000000;

module.exports = function Eu(cache) {
  if(cache === undefined) throw new Error('cache cannot be undefined');

  this.get = function (uri, options, callback) {
    if (typeof uri === 'undefined') throw new Error('undefined is not a valid uri or options object.');
    if (typeof options === 'function' && !callback) {
      callback = options;
      options = {};
    }

    debug('%s get', uri);
    cache.get(uri, function (err, value) {
      if (err) return callback(err);

      debug('%s cache %s', uri, value ? 'hit' : 'miss');

      if (value && new Date().getTime() <= value.expiryTimeMillis) {
        debug('%s cache hit, not expired. no request needed. (expiry: %s)', uri, new Date(value.expiryTimeMillis));
        return callback(null, value.response, value.response.body);
      }

      if (options.headers === undefined) options.headers = {};

      if (value && 'etag' in value.response.headers) {
        debug('%s setting header If-None-Match = %s', uri, value.response.headers['etag']);
        options.headers['If-None-Match'] = value.response.headers['etag'];
      }
      if (value && 'last-modified' in value.response.headers) {
        debug('%s setting header If-Modified-Since = %s', uri, value.response.headers['last-modified']);
        options.headers['If-Modified-Since'] = value.response.headers['last-modified'];
      }

      request(uri, options, function (err, res, body) {
        if (err) return callback(err, res, body);
        if (res.statusCode == 304) {
          debug('%s 304 Not Modified. Returning cached response.', uri);
          // 304 means it's OK to use the cached value.
          return callback(null, value.response, value.response.body);
        }
        if (res.statusCode >= 300) {
          debug('%s %s (not caching)', uri, res.statusCode);
          // Only cache 2xx responses
          return callback(null, res, body);
        }

        var isCacheable = false;
        var expiryTimeMillis = FOREVER_MILLIS;
        var private = false;
        if ('cache-control' in res.headers) {
          // In case of Cache-Control: no-cache, cacheable should remain false.
          var val = res.headers['cache-control'].replace(/\s/, '').split(',');
          var cacheControl = {};
          val.forEach(function (dir) {
            var arr = dir.split('=');
            if (arr.length == 1) arr.push(true);
            cacheControl[arr[0]] = arr[1];
          });
          private = cacheControl.private || options.private;
          if (cacheControl['max-age']) {
            isCacheable = true;
            var date = new Date(res.headers['date']);
            var seconds = +cacheControl['max-age'];
            expiryTimeMillis = date.getTime() + 1000 * seconds;
          }
        }
        if ('expires' in res.headers) {
          isCacheable = true;
          var expires = new Date(res.headers['expires']);
          expiryTimeMillis = expires.getTime();
        }
        if ('etag' in res.headers) {
          isCacheable = true;
        }
        if ('last-modified' in res.headers) {
          isCacheable = true;
        }

        if (isCacheable) {
          debug('%s writing response to cache with expiry %s', uri, new Date(expiryTimeMillis));
          var ttlMillis = Math.max(expiryTimeMillis - Date.now(), 0);
          var cachedResponse = { response: cachedResponseProperties(res), expiryTimeMillis: expiryTimeMillis };

          cache.set(uri, private, cachedResponse, ttlMillis, function (err) {
            callback(err, res, body);
          });
        } else {
          debug('%s not cacheable - no caching headers in response', uri);
          callback(null, res, body);
        }
      });
    });

    function cachedResponseProperties(res) {
      return {
        statusCode: res.statusCode,
        headers: res.headers,
        body: res.body
      }
    }
  };
};
