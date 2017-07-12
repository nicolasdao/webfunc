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
    "Access-Control-Allow-Headers": "Content-Type, Origin",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "1296000"
  }
}
```

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
