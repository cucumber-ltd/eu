var Eu = require('../..');

var stores = [];

var LRU = require('lru-cache');
stores.push(new Eu.MemoryStore(new LRU()));

if (!process.env.NO_REDIS) {
  var redis = require('redis').createClient();
  stores.push(new Eu.RedisStore(redis));
}

module.exports = stores;

