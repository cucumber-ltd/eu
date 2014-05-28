Eu is a wrapper around [request](https://github.com/mikeal/request) which can cache
`HTTP GET` requests based on response headers - just like a browser does.

It's useful for consuming data, especially from HTTP/REST APIs with proper caching
headers set.

"Eu" means "gotten" in French.

This library is heavily inspired from Kevin Swiber's [request-caching](https://github.com/kevinswiber/request-caching).

## Features

* Redis or In-memory (LRU) storage. Easy to build new storage backends.
* Supports both [public and private caching](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9.1).
* Takes advantage of the `ETag` response header by using the `If-None-Match` request header.
* Takes advantage of the `Last-Modified` response header by using the `If-Modified-Since` request header.
* Cache TTL is based on the `Expires` response header or `max-age` value in `Cache-Control`, but can be overridden.
* Highly customizeable with sensible defaults.

## Usage

Usage is similar to `request.get`. The main difference is that you have
to create an `Eu` instance:

```javascript
var eu = new Eu(cache); // See below for details about how to create a cache

eu.get('http://some.url', function(err, res, body) {
});

// Or pass in request options:
eu.get('http://some.url', {json: true}, function(err, res, body) {
});

```

When you create a cache you can choose between 2 stores:

### In-memory cache

```javascript
var LRU = require('lru-cache');
var store = new Eu.MemoryStore(new LRU());
var cache = new Eu.Cache(store);
```

### Redis cache

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

### Cache key namespacing

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
var unique = req.currentUser._id; // or req.cookies['connect.sid']
var privateSuffix = 'private:' + unique;
var cache = new Eu.Cache(store, prefix, privateSuffix);
```

You will get an error if no `privateSuffix` was provided when caching a private response.

### TTL

By default, Eu will store entries in the cache with the TTL specified in the HTTP
response (`max-age` or `expires` header).

If the response doesn't specify a TTL, the response will be cached forever.

You can override this by supplying your own `ttl` function:

```javascript
var store = new Eu.RedisStore(redis);

function myTtl(ttl) {
  return ttl * 1000; // cache it longer than the server told us to.
}

var cache = new Eu.Cache(store, null, null, myTtl);
```

## How it works

* All cacheable responses are cached, even if they are expired.
* The TTL for a cached entry uses the TTL from the response, but can be overridden.
* If a cached response is not expired, returns it.
* If a cached response is expired, issue request with `If-None-Match` value from cached response's `ETag`.
  * If response is 304 (Not Modified), returned cached response.
* Cacheable responses marked as private are cached with a private cache key.
* Cache lookups look in public cache first, and then in the private cache.
