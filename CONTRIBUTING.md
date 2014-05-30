# Contributing to EU

## Bugs/pull requests

We're happy to take pull requests.
We won't fix bugs for you unless you send a pull request.

## Run tests

    npm install
    npm test

If you want to skip the tests using redis:

    NO_REDIS=1 npm test

## Make a release

* Update version and date in `History.md`
* Commit and push everything. Then:

    npm version NEW_VERSION
    npm publish
    git push && git push --tags
