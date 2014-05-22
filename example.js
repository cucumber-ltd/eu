var http = require('http');
var request = require('request');
var Eu = require('.');
var LRU = require('lru-cache');
var store = new Eu.MemoryStore(new LRU());
var cache = new Eu.Cache(store);

http.createServer(function(req, res) {
  var date = new Date();
  res.writeHead(200, { 'Date': date.toUTCString(), 'Cache-Control': 'max-age=5' });
  console.log("Server hit!");
  res.end('Hello ' + date);
}).listen(3000, function(err) {

  var eu = new Eu(cache, request);
  setInterval(function() {
    eu.get('http://localhost:3000', function(err, res, body) {
      console.log("Client: " + body);
    });
  }, 2000);

});
