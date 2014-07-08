var assert = require('assert');
var http = require('http');
var Eu = require('..');
var stores = require('./helpers/test_stores');

var port = 9090;

stores.forEach(function (store) {
  var paulsCache = new Eu.Cache(store, 'prefix:', ':private:paul');
  var lisasCache = new Eu.Cache(store, 'prefix:', ':private:lisa');

  describe('Eu with ' + store.constructor.name, function () {
    beforeEach(store.flushAll);

    it('caches publicly for Cache-Control: max-age=300', function (cb) {
      http.createServer(function (req, res) {
        var date = new Date().toUTCString();
        res.writeHead(200, { 'Date': date, 'Cache-Control': 'max-age=300' });
        res.end('Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, function (err, res) {
          if (err) return cb(err);
          lisasCache.get('http://localhost:' + port, function (err, val) {
            if (err) return cb(err);
            assert.equal(val.response.body, 'Cachifiable!');
            cb();
          });
        });
      });
    });

    it('caches privately for Cache-Control: private, max-age=300', function (cb) {
      http.createServer(function (req, res) {
        var date = new Date().toUTCString();
        res.writeHead(200, { 'Date': date, 'Cache-Control': 'private, max-age=300' });
        res.end('Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, {}, function (err, res) {
          if (err) return cb(err);
          paulsCache.get('http://localhost:' + port, function (err, val) {
            if (err) return cb(err);
            assert.equal(val.response.body, 'Cachifiable!');
            lisasCache.get('http://localhost:' + port, function (err, val) {
              if (err) return cb(err);
              assert.equal(val, undefined);
              cb();
            });
          });
        });
      });
    });

    it('caches privately with option private: true', function (cb) {
      http.createServer(function (req, res) {
        var date = new Date().toUTCString();
        res.writeHead(200, { 'Date': date, 'Cache-Control': 'max-age=300' });
        res.end('Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, { private: true }, function (err, res) {
          if (err) return cb(err);
          lisasCache.get('http://localhost:' + port, function (err, val) {
            if (err) return cb(err);
            assert.equal(val, undefined);
            cb();
          });
        });
      });
    });

    it('serves from cache when within max-age', function (cb) {
      var s = http.createServer(function (req, res) {
        var date = new Date();
        res.writeHead(200, { 'Date': date.toUTCString(), 'Cache-Control': 'max-age=300' });
        res.end('Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, function (err, res) {
          if (err) return cb(err);
          s.close(function (err) {
            if (err) return cb(err);
            eu.get('http://localhost:' + port, {}, function (err, res, body) {
              if (err) return cb(err);
              assert.equal(body, 'Cachifiable!');
              cb();
            });
          });
        });
      });
    });

    it('caches when Expires header is set', function (cb) {
      http.createServer(function (req, res) {
        var date = new Date();
        var expires = new Date(date.getSeconds() + 30);
        res.writeHead(200, { 'Date': date.toUTCString(), 'Expires': expires.toUTCString() });
        res.end('Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, {}, function (err, res) {
          if (err) return cb(err);
          paulsCache.get('http://localhost:' + port, function (err, val) {
            if (err) return cb(err);
            assert.equal(val.response.body, 'Cachifiable!');
            cb();
          });
        });
      });
    });

    it("doesn't cache Cache-Control: no-cache", function (cb) {
      http.createServer(function (req, res) {
        var date = new Date();
        res.writeHead(200, { 'Date': date.toUTCString(), 'Cache-Control': 'no-cache' });
        res.end('Not Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, {}, function (err, res) {
          if (err) return cb(err);
          paulsCache.get('http://localhost:' + port, function (err, val) {
            if (err) return cb(err);
            assert.equal(val, null);
            cb();
          });
        });
      });
    });

    it("doesn't cache when response code is not 2xx", function (cb) {
      http.createServer(function (req, res) {
        var date = new Date();
        var expires = new Date(date.getSeconds() + 30);
        res.writeHead(404, { 'Date': date.toUTCString(), 'Expires': expires.toUTCString() });
        res.end('Not Cachifiable!');
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, {}, function (err, res) {
          if (err) return cb(err);
          paulsCache.get('http://localhost:' + port, function (err, val) {
            if (err) return cb(err);
            assert.equal(val, null);
            cb();
          });
        });
      });
    });

    it('re-requests with If-None-Match when Etag is in response', function (cb) {
      var three_o_four = false;
      http.createServer(function (req, res) {
        if (req.headers['if-none-match'] == 'the-etag') {
          three_o_four = true;
          res.writeHead(304);
          res.end();
        } else {
          var date = new Date();
          var expires = new Date(date.getSeconds() - 1);

          res.writeHead(200, { 'Date': date.toUTCString(), 'Expires': expires.toUTCString(), 'ETag': 'the-etag' });
          res.end('Cachifiable!');
        }
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, {}, function (err, res, body) {
          if (err) return cb(err);
          assert.equal(three_o_four, false);
          eu.get('http://localhost:' + port, {}, function (err, res, body) {
            if (err) return cb(err);
            assert(three_o_four);
            assert.equal(body, 'Cachifiable!');
            cb();
          });
        });
      });
    });

    it('re-requests with If-Modified-Since when Last-Modified is in response', function (cb) {
      var last_modified = new Date();
      var three_o_four = false;
      http.createServer(function (req, res) {
        var if_modified_since = req.headers['if-modified-since'] ? new Date(req.headers['if-modified-since']) : null;
        if (if_modified_since && if_modified_since.getTime() <= last_modified.getTime()) {
          three_o_four = true;
          res.writeHead(304);
          res.end();
        } else {
          var date = new Date();
          var expires = new Date(date.getSeconds() - 1);

          res.writeHead(200, { 'Date': date.toUTCString(), 'Expires': expires.toUTCString(), 'Last-Modified': last_modified.toUTCString() });
          res.end('Cachifiable!');
        }
      }).listen(++port, function () {
        var eu = new Eu(paulsCache);
        eu.get('http://localhost:' + port, {}, function (err, res, body) {
          if (err) return cb(err);
          assert.equal(three_o_four, false);
          eu.get('http://localhost:' + port, {}, function (err, res, body) {
            if (err) return cb(err);
            assert(three_o_four);
            assert.equal(body, 'Cachifiable!');
            cb();
          });
        });
      });
    });
  });

});
