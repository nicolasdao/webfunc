<a href="https://neap.co" target="_blank"><img src="https://neap.co/img/neap_black_small_logo.png" alt="Neap Pty Ltd logo" title="Neap" align="right" height="50" width="120"/></a>

# WebFunc - The Mini Web Server For Google Cloud Functions
## Intro
Add easy CORS support with a _**webconfig.json**_ file and simplify creation & deployment of Google Cloud Functions projects.

## Install
```
npm install webfunc -g
```
## How To Use It
```
webfunc init
```
This will ask some basic questions and will initialize a HelloWorld Web App ready to be hosted on Google Cloud.

To deploy it locally (using @google-cloud/functions-emulator)
```
webfunc deploy
```

To deploy it to a Google Cloud Account (that you must have presumably configured during the ```webfunc init``` step)
```
webfunc deploy build
```

## Configuring Your Mini Web Server - webconfig.json
#### CORS
This is the main 'raison d'être' of this project. Out-of-the box, Google Cloud Functions does not support easy configuration for CORS when triggered through HTTP (at least as of July 2017). Webfunc provides an easy to configure CORS through its _**webconfig.json**_ file. 

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
Let's imagine that 3 different environments have been setup on a Google Cloud Account, the webfunc can easily deploy to any of those environment if they have been configured in the project's _**webconfig.json**_ file:

```js
{
  "env": {
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

To deploy to a specific environment(prod for example):
```
webfunc deploy prod
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
