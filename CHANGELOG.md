# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.11.1-alpha.1"></a>
## [0.11.1-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.11.1-alpha.0...v0.11.1-alpha.1) (2018-01-07)


### Bug Fixes

* Multipart content type request does not parse the field value when no mymetype is specified. It should default to 'application/text' ([0a0cc76](https://github.com/nicolasdao/webfunc/commit/0a0cc76))



<a name="0.11.1-alpha.0"></a>
## [0.11.1-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.11.0...v0.11.1-alpha.0) (2018-01-04)



<a name="0.11.0"></a>
# [0.11.0](https://github.com/nicolasdao/webfunc/compare/v0.10.0...v0.11.0) (2018-01-04)



<a name="0.10.0"></a>
# [0.10.0](https://github.com/nicolasdao/webfunc/compare/v0.10.0-alpha.5...v0.10.0) (2018-01-04)


### Bug Fixes

* Conflict between webfunc and now-cli in the now.json for the 'env' property. To fix tat conflict, we have renamed 'env' to 'environment' ([e3b6a37](https://github.com/nicolasdao/webfunc/commit/e3b6a37))



<a name="0.10.0-alpha.5"></a>
# [0.10.0-alpha.5](https://github.com/nicolasdao/webfunc/compare/v0.10.0-alpha.4...v0.10.0-alpha.5) (2018-01-04)



<a name="0.10.0-alpha.4"></a>
# [0.10.0-alpha.4](https://github.com/nicolasdao/webfunc/compare/v0.10.0-alpha.3...v0.10.0-alpha.4) (2018-01-03)


### Bug Fixes

* Merge issue ([939a6b5](https://github.com/nicolasdao/webfunc/commit/939a6b5))



<a name="0.10.0-alpha.3"></a>
# [0.10.0-alpha.3](https://github.com/nicolasdao/webfunc/compare/v0.10.0-alpha.2...v0.10.0-alpha.3) (2018-01-03)


### Bug Fixes

* Creating a handler that returns a 500 straight away throw an exception similar to 'cannot set headers after they have been set...' ([cd8f19d](https://github.com/nicolasdao/webfunc/commit/cd8f19d))



<a name="0.10.0-alpha.2"></a>
# [0.10.0-alpha.2](https://github.com/nicolasdao/webfunc/compare/v0.10.0-alpha.1...v0.10.0-alpha.2) (2017-12-30)


### Bug Fixes

* Prevent the active environment to be set up in the start script of the package.json. Replace that with the now.json's env.active property or default to 'default' ([6fe6809](https://github.com/nicolasdao/webfunc/commit/6fe6809))



<a name="0.10.0-alpha.1"></a>
# [0.10.0-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.10.0-alpha.0...v0.10.0-alpha.1) (2017-12-29)


### Bug Fixes

* Add more logs during error management for better debugging ([066b9e8](https://github.com/nicolasdao/webfunc/commit/066b9e8))



<a name="0.10.0-alpha.0"></a>
# [0.10.0-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.9.1-alpha.1...v0.10.0-alpha.0) (2017-12-29)


### Features

* Add more granular support to control the way the default params extraction works. Can now turn it off partially + Add more unit tests ([6ed5de0](https://github.com/nicolasdao/webfunc/commit/6ed5de0))



<a name="0.9.1-alpha.1"></a>
## [0.9.1-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.9.1-alpha.0...v0.9.1-alpha.1) (2017-12-29)


### Bug Fixes

* Explicitly setting the 'extractParams' to true in the now.json does not enable the automatic params extraction ([365e445](https://github.com/nicolasdao/webfunc/commit/365e445))
* Missing 'path' dependency ([0a7769e](https://github.com/nicolasdao/webfunc/commit/0a7769e))



<a name="0.9.1-alpha.0"></a>
## [0.9.1-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.9.0...v0.9.1-alpha.0) (2017-12-29)



<a name="0.9.0"></a>
# [0.9.0](https://github.com/nicolasdao/webfunc/compare/v0.8.0...v0.9.0) (2017-12-29)



<a name="0.8.0"></a>
# [0.8.0](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.17...v0.8.0) (2017-12-29)



<a name="0.8.0-alpha.17"></a>
# [0.8.0-alpha.17](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.16...v0.8.0-alpha.17) (2017-12-29)



<a name="0.8.0-alpha.16"></a>
# [0.8.0-alpha.16](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.15...v0.8.0-alpha.16) (2017-12-28)


### Bug Fixes

* the 'req' object does not have any 'body' property thought its payload has been added to the 'params' object ([ad7ad25](https://github.com/nicolasdao/webfunc/commit/ad7ad25))



<a name="0.8.0-alpha.15"></a>
# [0.8.0-alpha.15](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.14...v0.8.0-alpha.15) (2017-12-27)


### Features

* Allow to disable payload and query string extraction ([2b19f56](https://github.com/nicolasdao/webfunc/commit/2b19f56))



<a name="0.8.0-alpha.14"></a>
# [0.8.0-alpha.14](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.13...v0.8.0-alpha.14) (2017-12-27)



<a name="0.8.0-alpha.13"></a>
# [0.8.0-alpha.13](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.12...v0.8.0-alpha.13) (2017-12-27)


### Features

* Add out of the box support for multipart and file upload ([dd9e919](https://github.com/nicolasdao/webfunc/commit/dd9e919))



<a name="0.8.0-alpha.12"></a>
# [0.8.0-alpha.12](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.11...v0.8.0-alpha.12) (2017-12-25)


### Bug Fixes

* Cannot pass body in POST methods ([cf08437](https://github.com/nicolasdao/webfunc/commit/cf08437))



<a name="0.8.0-alpha.11"></a>
# [0.8.0-alpha.11](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.10...v0.8.0-alpha.11) (2017-12-25)


### Bug Fixes

* Add support for body parsing for Body parsing does not work when hosted on an express environment ([a1a17ae](https://github.com/nicolasdao/webfunc/commit/a1a17ae))



<a name="0.8.0-alpha.10"></a>
# [0.8.0-alpha.10](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.9...v0.8.0-alpha.10) (2017-12-20)


### Bug Fixes

* NODE_ENV is not being set properly in GCP ([87a0eb1](https://github.com/nicolasdao/webfunc/commit/87a0eb1))



<a name="0.8.0-alpha.9"></a>
# [0.8.0-alpha.9](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.8...v0.8.0-alpha.9) (2017-12-20)


### Bug Fixes

* webfunc overrides existing environment variables in the process.env ([b61d3c0](https://github.com/nicolasdao/webfunc/commit/b61d3c0))



<a name="0.8.0-alpha.8"></a>
# [0.8.0-alpha.8](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.7...v0.8.0-alpha.8) (2017-12-20)


### Features

* Add FaaS support for environment variables defined withing the package.json start script ([aba223b](https://github.com/nicolasdao/webfunc/commit/aba223b))



<a name="0.8.0-alpha.7"></a>
# [0.8.0-alpha.7](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.6...v0.8.0-alpha.7) (2017-12-20)


### Bug Fixes

* Project without any 'now.json' are failing ([1f6354b](https://github.com/nicolasdao/webfunc/commit/1f6354b))



<a name="0.8.0-alpha.6"></a>
# [0.8.0-alpha.6](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.5...v0.8.0-alpha.6) (2017-12-18)


### Bug Fixes

* Replace the __transactionId with a real unique id rather than a date ([aedd524](https://github.com/nicolasdao/webfunc/commit/aedd524))



<a name="0.8.0-alpha.5"></a>
# [0.8.0-alpha.5](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.4...v0.8.0-alpha.5) (2017-12-18)


### Bug Fixes

* Amend info message when hosting is not localhost ([752a5e7](https://github.com/nicolasdao/webfunc/commit/752a5e7))



<a name="0.8.0-alpha.4"></a>
# [0.8.0-alpha.4](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.3...v0.8.0-alpha.4) (2017-12-18)


### Bug Fixes

* Replace the use of the WEBFUNC_ENV with the more standard NODE_ENV env variable ([e828ce6](https://github.com/nicolasdao/webfunc/commit/e828ce6))



<a name="0.8.0-alpha.3"></a>
# [0.8.0-alpha.3](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.2...v0.8.0-alpha.3) (2017-12-18)


### Features

* Add support for a WEBFUNC_ENV process variable that can control which environment is active ([95eee51](https://github.com/nicolasdao/webfunc/commit/95eee51))



<a name="0.8.0-alpha.2"></a>
# [0.8.0-alpha.2](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.1...v0.8.0-alpha.2) (2017-12-15)


### Features

* Add 'preProcess' and 'postProcess' hooks + provide better error management ([41be2ad](https://github.com/nicolasdao/webfunc/commit/41be2ad))



<a name="0.8.0-alpha.1"></a>
# [0.8.0-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.8.0-alpha.0...v0.8.0-alpha.1) (2017-12-13)


### Bug Fixes

* impossible to reach '/' ([fe36cd6](https://github.com/nicolasdao/webfunc/commit/fe36cd6))



<a name="0.8.0-alpha.0"></a>
# [0.8.0-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.7.1-alpha.0...v0.8.0-alpha.0) (2017-12-12)


### Bug Fixes

* Clean code to comply to latest express convention to throw error + add new 'serve' api which is just the same as 'serveHttp'. We did that to make the API more agnostic to http requests ([da4a632](https://github.com/nicolasdao/webfunc/commit/da4a632))


### Features

* Add support for multiple route for same type of response ([1395c88](https://github.com/nicolasdao/webfunc/commit/1395c88))



<a name="0.7.1-alpha.0"></a>
## [0.7.1-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.7.0...v0.7.1-alpha.0) (2017-12-12)



<a name="0.7.0"></a>
# [0.7.0](https://github.com/nicolasdao/webfunc/compare/v0.6.0...v0.7.0) (2017-12-12)



<a name="0.6.0"></a>
# [0.6.0](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.12...v0.6.0) (2017-12-12)


### Bug Fixes

* Remove useless dependencies ([9d91736](https://github.com/nicolasdao/webfunc/commit/9d91736))


### Features

* Add release minor in the scripts ([4f7a364](https://github.com/nicolasdao/webfunc/commit/4f7a364))



<a name="0.6.0-alpha.12"></a>
# [0.6.0-alpha.12](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.11...v0.6.0-alpha.12) (2017-12-12)


### Bug Fixes

* Replace routing with the express standard ([f411e26](https://github.com/nicolasdao/webfunc/commit/f411e26))



<a name="0.6.0-alpha.11"></a>
# [0.6.0-alpha.11](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.10...v0.6.0-alpha.11) (2017-12-11)


### Bug Fixes

* Make sure the injected function name doesn't conflict with restricted function names ([4feb1eb](https://github.com/nicolasdao/webfunc/commit/4feb1eb))



<a name="0.6.0-alpha.10"></a>
# [0.6.0-alpha.10](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.9...v0.6.0-alpha.10) (2017-12-11)


### Bug Fixes

* Improve the universal approach to start the server or the function ([e67d085](https://github.com/nicolasdao/webfunc/commit/e67d085))



<a name="0.6.0-alpha.9"></a>
# [0.6.0-alpha.9](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.8...v0.6.0-alpha.9) (2017-12-11)


### Bug Fixes

* Add support for previous version of express that do not support res.status. res.send and res.set ([58a0fa0](https://github.com/nicolasdao/webfunc/commit/58a0fa0))


### Features

* Make Zeit now the default way to deploy + add new method 'serveHttpUniversal' ([cda11ae](https://github.com/nicolasdao/webfunc/commit/cda11ae))



<a name="0.6.0-alpha.8"></a>
# [0.6.0-alpha.8](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.7...v0.6.0-alpha.8) (2017-11-06)



<a name="0.6.0-alpha.7"></a>
# [0.6.0-alpha.7](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.6...v0.6.0-alpha.7) (2017-11-06)


### Bug Fixes

* bug related to case sensitive routing ([314659e](https://github.com/nicolasdao/webfunc/commit/314659e))



<a name="0.6.0-alpha.6"></a>
# [0.6.0-alpha.6](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.5...v0.6.0-alpha.6) (2017-08-31)



<a name="0.6.0-alpha.5"></a>
# [0.6.0-alpha.5](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.4...v0.6.0-alpha.5) (2017-08-31)


### Bug Fixes

* Rename API 'app.route' to 'app.resolve' which makes more sense ([556efce](https://github.com/nicolasdao/webfunc/commit/556efce))



<a name="0.6.0-alpha.4"></a>
# [0.6.0-alpha.4](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.3...v0.6.0-alpha.4) (2017-08-30)


### Bug Fixes

* support for undefined routing path. This should allow any query to any path ([c5bc21d](https://github.com/nicolasdao/webfunc/commit/c5bc21d))



<a name="0.6.0-alpha.3"></a>
# [0.6.0-alpha.3](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.2...v0.6.0-alpha.3) (2017-08-30)


### Bug Fixes

* fail to return upon 404 error in the webfunc.js file ([0b6d8ba](https://github.com/nicolasdao/webfunc/commit/0b6d8ba))



<a name="0.6.0-alpha.2"></a>
# [0.6.0-alpha.2](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.1...v0.6.0-alpha.2) (2017-08-30)


### Bug Fixes

* consistent and more intuitive response for the serveHttp function ([80e6d8d](https://github.com/nicolasdao/webfunc/commit/80e6d8d))



<a name="0.6.0-alpha.1"></a>
# [0.6.0-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.6.0-alpha.0...v0.6.0-alpha.1) (2017-08-29)


### Bug Fixes

* Remove the unecessary check an a required value for the 'next' function in the 'app.route' argument ([ca60cf1](https://github.com/nicolasdao/webfunc/commit/ca60cf1))



<a name="0.6.0-alpha.0"></a>
# [0.6.0-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.5.1-alpha.0...v0.6.0-alpha.0) (2017-08-29)


### Bug Fixes

* linting issue ([bd098a9](https://github.com/nicolasdao/webfunc/commit/bd098a9))


### Features

* Add additinal 'route' argument in the 'process' method the HttpHandler class ([2d95799](https://github.com/nicolasdao/webfunc/commit/2d95799))



<a name="0.5.1-alpha.0"></a>
## [0.5.1-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.4.0...v0.5.1-alpha.0) (2017-08-29)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.11...v0.4.0) (2017-08-29)


### Bug Fixes

* API syntax ([ba089c4](https://github.com/nicolasdao/webfunc/commit/ba089c4))



<a name="0.4.0-alpha.11"></a>
# [0.4.0-alpha.11](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.10...v0.4.0-alpha.11) (2017-08-28)


### Bug Fixes

* Bad signature style in the httpNext function argument of the HttpHandler class ([0a5cefd](https://github.com/nicolasdao/webfunc/commit/0a5cefd))



<a name="0.4.0-alpha.10"></a>
# [0.4.0-alpha.10](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.9...v0.4.0-alpha.10) (2017-08-27)


### Features

* Add support for Http Handlers ([c4ac75f](https://github.com/nicolasdao/webfunc/commit/c4ac75f))



<a name="0.4.0-alpha.9"></a>
# [0.4.0-alpha.9](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.8...v0.4.0-alpha.9) (2017-08-27)



<a name="0.4.0-alpha.8"></a>
# [0.4.0-alpha.8](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.7...v0.4.0-alpha.8) (2017-08-14)



<a name="0.4.0-alpha.7"></a>
# [0.4.0-alpha.7](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.6...v0.4.0-alpha.7) (2017-08-14)



<a name="0.4.0-alpha.6"></a>
# [0.4.0-alpha.6](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.5...v0.4.0-alpha.6) (2017-08-10)


### Bug Fixes

* Http errors that were crashing the server ([0d0015a](https://github.com/nicolasdao/webfunc/commit/0d0015a))



<a name="0.4.0-alpha.5"></a>
# [0.4.0-alpha.5](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.4...v0.4.0-alpha.5) (2017-08-10)


### Features

* Add support for custom route on the default 'serveHttp' signature + add tests ([0aa8609](https://github.com/nicolasdao/webfunc/commit/0aa8609))



<a name="0.4.0-alpha.4"></a>
# [0.4.0-alpha.4](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.3...v0.4.0-alpha.4) (2017-08-10)


### Features

* Add support to programatically target the hosting ([084599c](https://github.com/nicolasdao/webfunc/commit/084599c))



<a name="0.4.0-alpha.3"></a>
# [0.4.0-alpha.3](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.2...v0.4.0-alpha.3) (2017-08-10)



<a name="0.4.0-alpha.2"></a>
# [0.4.0-alpha.2](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.1...v0.4.0-alpha.2) (2017-08-09)



<a name="0.4.0-alpha.1"></a>
# [0.4.0-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.4.0-alpha.0...v0.4.0-alpha.1) (2017-08-09)


### Bug Fixes

* Lint ([8187754](https://github.com/nicolasdao/webfunc/commit/8187754))


### Features

* Add support for firebase hosting ([8b6b12d](https://github.com/nicolasdao/webfunc/commit/8b6b12d))



<a name="0.4.0-alpha.0"></a>
# [0.4.0-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.3.1-alpha.1...v0.4.0-alpha.0) (2017-08-07)


### Features

* Add support for extraction of body parameters in HTTP request ([b26c9cc](https://github.com/nicolasdao/webfunc/commit/b26c9cc))



<a name="0.3.1-alpha.1"></a>
## [0.3.1-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.3.1-alpha.0...v0.3.1-alpha.1) (2017-08-04)


### Bug Fixes

* Routing bug ([89e120a](https://github.com/nicolasdao/webfunc/commit/89e120a))



<a name="0.3.1-alpha.0"></a>
## [0.3.1-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.3.0...v0.3.1-alpha.0) (2017-08-04)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/nicolasdao/webfunc/compare/v0.2.1-alpha.0...v0.3.0) (2017-08-04)


### Bug Fixes

* Clean project ([8945a18](https://github.com/nicolasdao/webfunc/commit/8945a18))


### Features

* Add new routing feature ([bc01602](https://github.com/nicolasdao/webfunc/commit/bc01602))



<a name="0.2.1-alpha.0"></a>
## [0.2.1-alpha.0](https://github.com/nicolasdao/webfunc/compare/v0.2.0...v0.2.1-alpha.0) (2017-08-02)



<a name="0.2.0"></a>
# [0.2.0](https://github.com/nicolasdao/webfunc/compare/v0.1.0...v0.2.0) (2017-08-02)



<a name="0.1.0"></a>
# [0.1.0](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.15...v0.1.0) (2017-08-02)



<a name="0.1.0-alpha.15"></a>
# [0.1.0-alpha.15](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.14...v0.1.0-alpha.15) (2017-08-02)


### Bug Fixes

* Clean project. Refactor the console part into the gimpy project ([2e98cd0](https://github.com/nicolasdao/webfunc/commit/2e98cd0))



<a name="0.1.0-alpha.14"></a>
# [0.1.0-alpha.14](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.13...v0.1.0-alpha.14) (2017-07-20)


### Bug Fixes

* getActiveEnv ([67d387b](https://github.com/nicolasdao/webfunc/commit/67d387b))



<a name="0.1.0-alpha.13"></a>
# [0.1.0-alpha.13](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.12...v0.1.0-alpha.13) (2017-07-20)


### Features

* Add getActiveEnv function ([07f0718](https://github.com/nicolasdao/webfunc/commit/07f0718))



<a name="0.1.0-alpha.12"></a>
# [0.1.0-alpha.12](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.11...v0.1.0-alpha.12) (2017-07-19)


### Features

* Allow to set up glocal environment variable in the webconfig.json file at deployment time ([ff0e897](https://github.com/nicolasdao/webfunc/commit/ff0e897))



<a name="0.1.0-alpha.11"></a>
# [0.1.0-alpha.11](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.10...v0.1.0-alpha.11) (2017-07-18)


### Bug Fixes

* Remove hardcoded value from the index.js ([cc5b11f](https://github.com/nicolasdao/webfunc/commit/cc5b11f))



<a name="0.1.0-alpha.10"></a>
# [0.1.0-alpha.10](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.9...v0.1.0-alpha.10) (2017-07-18)


### Features

* Integrate 'schemaglue' in the graphql template ([35d7745](https://github.com/nicolasdao/webfunc/commit/35d7745))



<a name="0.1.0-alpha.9"></a>
# [0.1.0-alpha.9](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.8...v0.1.0-alpha.9) (2017-07-18)



<a name="0.1.0-alpha.8"></a>
# [0.1.0-alpha.8](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.7...v0.1.0-alpha.8) (2017-07-18)


### Features

* Improve the format of the questions ([d830281](https://github.com/nicolasdao/webfunc/commit/d830281))



<a name="0.1.0-alpha.7"></a>
# [0.1.0-alpha.7](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.6...v0.1.0-alpha.7) (2017-07-17)


### Features

* Add new template called GraphQL ([0b7d14f](https://github.com/nicolasdao/webfunc/commit/0b7d14f))



<a name="0.1.0-alpha.6"></a>
# [0.1.0-alpha.6](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.5...v0.1.0-alpha.6) (2017-07-15)


### Bug Fixes

* Type in the HTTP verb ([349552d](https://github.com/nicolasdao/webfunc/commit/349552d))



<a name="0.1.0-alpha.5"></a>
# [0.1.0-alpha.5](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.4...v0.1.0-alpha.5) (2017-07-14)



<a name="0.1.0-alpha.4"></a>
# [0.1.0-alpha.4](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.3...v0.1.0-alpha.4) (2017-07-14)



<a name="0.1.0-alpha.3"></a>
# [0.1.0-alpha.3](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.2...v0.1.0-alpha.3) (2017-07-14)


### Bug Fixes

* Issues related to typos in the templates folder + issue related to badly determining when to start the emulator ([192f51e](https://github.com/nicolasdao/webfunc/commit/192f51e))



<a name="0.1.0-alpha.2"></a>
# [0.1.0-alpha.2](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.1...v0.1.0-alpha.2) (2017-07-14)


### Bug Fixes

* Fix various issues found during unit testing + add more unit testing + add travis config + update doumentation ([f1af727](https://github.com/nicolasdao/webfunc/commit/f1af727))



<a name="0.1.0-alpha.1"></a>
# [0.1.0-alpha.1](https://github.com/nicolasdao/webfunc/compare/v0.1.0-alpha.0...v0.1.0-alpha.1) (2017-07-13)


### Features

* Add the mini server + add unit testing ([1e997eb](https://github.com/nicolasdao/webfunc/commit/1e997eb))



<a name="0.1.0-alpha.0"></a>
# 0.1.0-alpha.0 (2017-07-12)


### Bug Fixes

* Add missing module ncp ([30135d0](https://github.com/nicolasdao/webfunc/commit/30135d0))
* Install missing module 'replace' ([e399696](https://github.com/nicolasdao/webfunc/commit/e399696))
* Issue related to bad import syntax ([e9f0436](https://github.com/nicolasdao/webfunc/commit/e9f0436))


### Features

* Add the deploy command feature ([9f553c2](https://github.com/nicolasdao/webfunc/commit/9f553c2))
* First commit ([8a65743](https://github.com/nicolasdao/webfunc/commit/8a65743))
