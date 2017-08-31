<a href="https://neap.co" target="_blank"><img src="https://neap.co/img/neap_black_small_logo.png" alt="Neap Pty Ltd logo" title="Neap" align="right" height="50" width="120"/></a>

# WebFunc
## Lightweight Serverless Web Framework
[![NPM][1]][2] [![Tests][3]][4]

[1]: https://img.shields.io/npm/v/webfunc.svg?style=flat
[2]: https://www.npmjs.com/package/webfunc
[3]: https://travis-ci.org/nicolasdao/webfunc.svg?branch=master
[4]: https://travis-ci.org/nicolasdao/webfunc
## Intro
Add CORS support and routing to Google Cloud Functions projects.

## Install
```
npm install webfunc --save
```

## How To Use It

In its simplest form, a Google Cloud Functions project looks like this:
```js
exports.yourapp = (req, res) => {
  res.status(200).send('Hello World')
}
```

Simply update it as follow:
```js
const { serveHttp } = require('webfunc')

exports.yourapp = serveHttp((req, res) => {
  res.status(200).send('Hello World')
})
```

And if you want to add more routes:

```js
const { serveHttp, app } = require('webfunc')

exports.yourapp = serveHttp([
  app.get('/', (req, res) => res.status(200).send('Hello World')),
  app.get('/users/{userId}', (req, res, params) => res.status(200).send(`Hello user ${params.userId}`)),
  app.get('/users/{userId}/document/{docName}', (req, res, params) => res.status(200).send(`Hello user ${params.userId}. I like your document ${params.docName}`)),
])
```

Easy isn't it!?

To configure CORS, add a new _**appconfig.json**_ file and configure it as explained in the next section.

The fastest way to get started with webfunc is to use [_**gimpy**_](https://github.com/nicolasdao/gimpy). Gimpy can create Google Cloud Functions projects and deploy them both locally and on your Google Cloud Account (providing that you have already installed the gcloud SDK, the gcloud beta component, and Google Function Emulator). Example:

```
gimp new webapp-serverless helloWorld
cd helloWorld
npm install
gimp deploy
```

## Configuring CORS as well as Multiple Environment Variables - appconfig.json
#### CORS
This is the main 'raison d'être' of this project. Out-of-the box, Google Cloud Functions does not support easy configuration for CORS when triggered through HTTP (at least as of July 2017). Webfunc fills that gap using configurations defined in a _**appconfig.json**_ file. 

```js
{
  "headers": {
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Max-Age": "1296000"
  }
}
```
More details about those headers in the [Annexes](#annexes) section under [A.1. CORS Refresher](#a1-cors-refresher).

> CORS is a classic source of headache. Though webfunc allows to easily configure any Google Cloud Functions project, it will not prevent anybody to badly configure a project, and therefore loose a huge amount of time. For that reason, a series of common mistakes have been documented in the [Annexes](#annexes) section under [A.2. CORS Basic Errors](#a2-cors-basic-errors).

#### Adding Multiple Deployment Environments
Let's imagine that 3 different environments have been setup on a Google Cloud Account. Obvioulsy, all of those environments have probably different configurations. As of today (July 2017), Google Cloud Functions does not support environment variables. WebFunc allows you to deal with the issue by supporting an _**env**_ property in the _**appconfig.json**_ file:

```js
{
  "env": {
    "active": "default",
    "default": {
      "functionName": "helloneap",
      "trigger": "--trigger-http",
      "entryPoint": "helloNeap",
      "googleProject": "DevEnv",
      "bucket": "devenvbucket"
    },
    "build": {
      "functionName": "helloneap",
      "trigger": "--trigger-http",
      "entryPoint": "helloNeap",
      "googleProject": "DevEnv",
      "bucket": "devenvbucket"
    },
    "staging": {
      "functionName": "helloneap",
      "trigger": "--trigger-http",
      "entryPoint": "helloNeap",
      "googleProject": "StagingEnv",
      "bucket": "stagingenvbucket"
    },
    "prod": {
      "functionName": "helloneap",
      "trigger": "--trigger-http",
      "entryPoint": "helloNeap",
      "googleProject": "ProdEnv",
      "bucket": "prodenvbucket"
    }
  }
}
```

As you can see, the example above demonstrates 4 different types of enviornment setups: _default_, _build_, _staging_, _prod_. You can obviouly define as many as you want, and add whatever you need under those environments. 

Also, notice the _**active**_ property. It's purpose is to behave as a sort of environment variable that let's your code figure out which environment is currently active. The code below demonstrates how to programmatically access the current environment:

```js
const { getActiveEnv } = require('webfunc')
const activeEnv = getActiveEnv()
```
Using the previous _appconfig.json_, if the _active_ property is set to _default_, then the value of _getActiveEnv_ will be the following JSON object:
```js
{
  "functionName": "helloneap",
  "trigger": "--trigger-http",
  "entryPoint": "helloNeap",
  "googleProject": "DevEnv",
  "bucket": "devenvbucket"
}
```

If you change the value of the _**active**_ property to _prod_, then the _getActiveEnv_ method will return:

```js
{
  "functionName": "helloneap",
  "trigger": "--trigger-http",
  "entryPoint": "helloNeap",
  "googleProject": "ProdEnv",
  "bucket": "prodenvbucket"
}
```
> NOTE: _**getActiveEnv**_ accepts one optional boolean called 'memoize'. By default it is set to true. That means that calling it multiple times will not incure more read resources. 

## Authentication 
Authentication using webfunc is left to you. That being said, here is a quick example on how that could work using the awesome [passport](http://passportjs.org/) package. The following piece of code for Google Cloud Functions exposes a _signin_ POST endpoint that expects an email and a password and that returns a JWT token. Passing that JWT token in the _Authorization_ header using the _bearer_ scheme will allow access to the _/_ endpoint.

```js
const { serveHttp, app } = require('webfunc')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const { ExtractJwt, Strategy } = require("passport-jwt")

const SECRETKEY = 'your-super-secret-key'
const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('bearer'),
	secretOrKey: SECRETKEY
}

passport.use(new Strategy(jwtOptions, (decryptedToken, next) => {
	// do more verification based on your requirements.
	return next(null, decryptedToken)
}))

/**
 * Responds to any HTTP request.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.jwtTest = serveHttp([

	app.get('/', (req, res) => passport.authenticate('jwt', (err, user) => {
		if (user)
			res.status(200).send(`Welcome ${user.username}!`)
		else
			res.status(401).send(`You must be logged in to access this endpoint!`)
	})(req, res)),

	app.post('/signin', (req, res, params) => {
		if (params.email == 'hello@webfunc.co' && params.password == 'supersecuredpassword') {
			const user = {
				id: 1,
				roles: [{
					name: 'Admin',
					company: 'neap pty ltd'
				}],
				username: 'neapnic',
				email: 'hello@webfunc.co'
			}
			res.status(200).send({ message: 'Successfully logged in', token: jwt.sign(user, SECRETKEY) })
		}
		else
			res.status(401).send(`Username or password invalid!`)	
	})
])
```

This piece of code is also accessible via the _**jwt-passport-example**_ gimpy template. Simply install [_**gimpy**_](https://github.com/nicolasdao/gimpy) globally, and then run the following:

```
gimp new jwt-passport-example jwtTest
cd jwtTest
npm install
gimp deploy
```

To test that piece of code:

Login:
```
curl -X POST -H 'Content-Type: application/json' -d '{"email":"hello@webfunc.co","password":"supersecuredpassword"}' http://localhost:8010/your-google-project/us-central1/jwtTest/signin
```
Extract the token received from this POST request and use it in the following GET request's header:

Access the secured _/_ endpoint:
```
curl -v -H "Authorization: Bearer your-jwt-token" http://localhost:8010/your-google-project/us-central1/jwtTest
```

## Annexes
#### A.1. CORS Refresher
_COMING SOON..._

#### A.2. CORS Basic Errors
_**WithCredentials & CORS**_
The following configuration is forbidden:
```js
{
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true"
  }
}
```

You cannot allow anybody to access a resource("Access-Control-Allow-Origin": "*") while at the same time allowing anybody to share cookies("Access-Control-Allow-Credentials": "true"). This would be a huge security breach (i.e. [CSRF attach](https://en.wikipedia.org/wiki/Cross-site_request_forgery)). 

For that reason, this configuration, though it allow your resource to be called from the same origin, would fail once your API is called from a different origin. A error similar to the following would be thrown by the browser:
```
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

__*Solutions*__

If you do need to share cookies, you will have to be explicitely specific about the origins that are allowed to do so:
```js
{
  "headers": {
    "Access-Control-Allow-Origin": "http://your-allowed-origin.com",
    "Access-Control-Allow-Credentials": "true"
  }
}
```

If you do need to allow access to anybody, then do not allow requests to send cookies:
```js
{
  "headers": {
    "Access-Control-Allow-Headers": "Authorization",
    "Access-Control-Allow-Origin": "*",
  }
}
```
If you do need to pass authentication token, you will have to pass it using a special header(e.g. Authorization), or pass it in the query string if you want to avoid preflight queries (preflight queries happens in cross-origin requests when special headers are being used). However, passing credentials in the query string are considered a bad practice. 

## Contributing
```
npm test
```

## This Is What We re Up To
We are Neap, an Australian Technology consultancy powering the startup ecosystem in Sydney. We simply love building Tech and also meeting new people, so don't hesitate to connect with us at [https://neap.co](https://neap.co).

## License
Copyright (c) 2017, Neap Pty Ltd.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Neap Pty Ltd nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL NEAP PTY LTD BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
