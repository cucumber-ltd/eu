# [v1.3.2](https://github.com/cucumber-ltd/eu/compare/v1.3.1...v1.3.2) (2015-03-05)

* Fix splitting of cache-control header value ([#6](https://github.com/cucumber-ltd/eu/pull/6))

# [v1.3.1](https://github.com/cucumber-ltd/eu/compare/v1.2.2...v1.3.1) (2015-02-03)

* Better debugging of request/response headers
* Allow overriding of cache entry expiry time
* Link to [eu-medea-store](https://github.com/medea/eu-medea-store) ([#4](https://github.com/cucumber-ltd/eu/issues/4))

# [v1.2.2](https://github.com/cucumber-ltd/eu/compare/v1.2.1...v1.2.2) (2014-07-08)

* Update deps

# [v1.2.1](https://github.com/cucumber-ltd/eu/compare/v1.2.0...v1.2.1) (2014-07-08)

* Add debugging
* Fix caching bug: only set expiry date when explicitly sent by the server

# [v1.2.0](https://github.com/cucumber-ltd/eu/compare/v1.1.1...v1.2.0) (2014-07-08)

* Add option to force private caching

# [v1.1.1](https://github.com/cucumber-ltd/eu/compare/v1.1.0...v1.1.1) (2014-05-30)

* Make sure "Cache-Control: no-cache" isn't cached ([#1](https://github.com/cucumber-ltd/eu/pull/1) Jari Bakken)
* Make it possible to run tests without redis using `NO_REDIS=1 npm test` ([#2](https://github.com/cucumber-ltd/eu/pull/2) Jari Bakken)

# 1.1.0 (Cucumber Limited internal release)
