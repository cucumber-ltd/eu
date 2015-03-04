Eu is a wrapper around [request](https://github.com/mikeal/request) which can cache
`HTTP GET` requests based on response headers - just like a browser does.

It is used to lower latency when consuming data from HTTP/REST APIs that have proper caching
headers.

"Eu" means "gotten" in French.

This library is heavily inspired from Kevin Swiber's [request-caching](https://github.com/kevinswiber/request-caching).

## Features

* Multiple cache stores:
  * Redis (built-in)
  * In-memory based on [LRU](https://github.com/isaacs/node-lru-cache) (built-in)
  * Medea (3rd party [eu-medea-store](https://github.com/medea/eu-medea-store) plugin by Kevin Swiber)
* Supports both [public and private caching](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9.1).
* Takes advantage of the `ETag` response header by using the `If-None-Match` request header.
* Takes advantage of the `Last-Modified` response header by using the `If-Modified-Since` request header.
* Cache TTL is based on the `Expires` response header or `max-age` value in `Cache-Control`, but can be overridden.
* Highly customisable with sensible defaults.

## Usage

Usage is similar to `request.get`. The main difference is that you have
to create an `Eu` instance:

```javascript
var Eu = require('eu');
var eu = new Eu(cache); // See below for details about how to create a cache

eu.get('http://some.url', function(err, res, body) {
});

// Or pass in request options:
eu.get('http://some.url', {json: true}, function(err, res, body) {
});

```

A cache uses a _store_ to store cached responses:

### In-memory store

```javascript
var LRU = require('lru-cache');
var store = new Eu.MemoryStore(new LRU());
var cache = new Eu.Cache(store);
```

### Redis store

```javascript
var redis = require('redis').createClient();
var store = new Eu.RedisStore(redis);
var cache = new Eu.Cache(store);
```

You can also create a `NullCache`, which does nothing and doesn't require a store:

### Null cache

```javascript
var cache = new Eu.NullCache();
```

### Cache key name spacing

You should always provide a `prefix` which prefixes the key with the name of
your app (or API). When you invoke `Cache.flush`, it will *only* flush the keys
starting with that prefix. If you don't specify a prefix, you'll flush the *entire* cache.

```javascript
var prefix = 'yourapp:';
var cache = new Eu.Cache(store, prefix);

cache.flush(cb); // only the 'yourapp:*' keys get flushed
```

### Private caching

Some HTTP responses should be cached privately - i.e. they shouldn't be available for other users.
This is the case when the server responds with `Cache-Control: private`.

To handle this you should construct the `Cache` with a `privateSuffix` String argument.
This suffix will be appended to the key when caching a private response.

```javascript
var prefix = 'yourapp:';
var unique = req.user.id; // or req.cookies['connect.sid']
var privateSuffix = ':private:' + unique;
var cache = new Eu.Cache(store, prefix, privateSuffix);
```

You will get an error if no `privateSuffix` was provided when caching a private response.

For servers that don't reply with a `Cache-Control: private` header, you can force the request to be cached privately:

```javascript
cache.get(url, { private: true }, function (err, val) {
  ...
});
```

Eu will always look in the public cache first, and then in the private cache if there was no
hit in the public cache.

### Cache entry expiry time

Every time a response is cached, it is cached with an expiry time. This is a timestamp indicating
how long the cache entry is valid for. (This is not the same as TTL - Time to Live. See next section).

When Eu finds an entry in the cache it will consult this timestamp to decide whether the
entry is still valid - i.e. is the expiry time in the future.

If it's valid, the response is returned immediately. If not, a HTTP request will be issued,
setting the `If-None-Match` request header to the value of the cached `ETag` value,
and the `If-Modified-Since` request header to the value of the cached `Last-Modified` value.

If the server responds with `304 Not Modified` the cached response will be returned even
though it is expired (the server has confirmed that even though it is expired, it hasn't changed).

By default the expiry time is determined by either the `Cache-Control max-age` or `Expires` response
header. If neither of these headers are set, or if you want to cache more aggressively than
what they indicate, you can override this in the options passed to `eu.get`:

```javascript
function expiryTimeMillis() {
  return 8640000000000000; // cache forever
}
cache.get(url, { expiryTimeMillis: expiryTimeMillis }, function (err, val) {
  ...
});
```

### TTL

By default, Eu will store entries in the cache with the TTL (Time to Live) equal to the cache
expiry time (see above).

If the expiry time is undefined, the response will be cached forever, or until the cache discards it, using
whatever expiry algorithm it uses, such as LIFO or FIFO.

You can override the default TTL by supplying your own `ttl` function:

```javascript
function myTtl(ttl) {
  return ttl * 1000; // cache it longer than the server told us to.
}

var cache = new Eu.Cache(store, null, null, myTtl);
```

## Debugging

Just set `DEBUG=eu` in your shell to see debug info.

For extra verbose output (print request and response headers) set `DEBUG=eu,eu:*`
