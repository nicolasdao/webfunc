<div style="
    min-width: 200px;
    min-height: 30px;
    border: 1px solid #ff6060;
    border-radius: 5px;
    background-color: #ffb6b6;
"><p style="
    margin: 3px 0px 0px 10px;
    color: #d83125;
"><strong>WARNING</strong>: This project is no longer supported. If you still plan on using this project, be aware that it does not support Zeit Now >= 2.0. We are currently working on a replacement project that we hope to release very soon. Thank you for your support. The Neap Team</p></div>

# WebFunc &middot;  [![NPM](https://img.shields.io/npm/v/webfunc.svg?style=flat)](https://www.npmjs.com/package/webfunc) [![Tests](https://travis-ci.org/nicolasdao/webfunc.svg?branch=master)](https://travis-ci.org/nicolasdao/webfunc) [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) [![Neap](https://neap.co/img/made_by_neap.svg)](#this-is-what-we-re-up-to)
__*Universal Serverless Web Framework*__. Write code for serverless similar to [Express](https://expressjs.com/) once, deploy everywhere (thanks to the awesome [Zeit Now-CLI](https://zeit.co/now)). This also include creating functions that can get triggered by [Google Cloud PubSub topics](https://cloud.google.com/pubsub/docs/overview). Targeted platforms:
- [__*Zeit Now*__](https://zeit.co/now) (using express under the hood)
- [__*Google Cloud Functions*__](https://cloud.google.com/functions/) (incl. reacting to [__*Pub/Sub events*__](reacting-to-google-pubsub-topics) or __*Storage changes*__)
- [__*AWS Lambdas*__](https://aws.amazon.com/lambda)
- [__*Azure Functions*__](https://azure.microsoft.com/en-us/services/functions/) (COMING SOON...)

```js
const { app } = require('webfunc')

app.get('/users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username}`))

eval(app.listen('app', 4000))
```  

__*[Webfunc](https://github.com/nicolasdao/webfunc) supports [Express middleware](#compatible-with-all-express-middleware)*__. 

Forget any external dependencies to run your serverless app locally. Run `node index.js` and that's it. 

Out-of-the-box features include:
- [_Routing_](#basic)
- [_CORS_](#cors)
- [_Body & Route Variables Parsing_](#multiple-endpoints)
- [_Environment Variables Per Deployment_](#managing-environment-variables-per-deployment) 
- [_Middleware (incl. Express)_](#compatible-with-all-express-middleware)

# Table of Contents

> * [Install](#install) 
> * [How To Use It](#how-to-use-it) 
>   - [Basic - Build Once Deploy Everywhere](#basic---build-once-deploy-everywhere)
>   - [Passing Parameters To Your HTTP Endpoint](#passing-parameters-to-your-http-endpoint)
>   - [Webfunc Properties On The Request Object](#webfunc-properties-on-the-request-object)
>   - [Deploying To Google Functions or AWS](#deploying-to-google-functions-or-aws)
> * [Examples](#examples) 
>   - [Creating A REST API](#creating-a-rest-api)
>   - [Compatible With All Express Middleware](#compatible-with-all-express-middleware)
>   - [Managing Environment Variables Per Deployment](#managing-environment-variables-per-deployment)
>   - [Intercepting The res.send() Method](#intercepting-the-res.send-method)
>   - [Reacting To Google PubSub Topics](#reacting-to-google-pubsub-topics)
>   - [Authentication](#authentication) 
>   - [Uploading Files & Images](#uploading-files--images)
>   - [GraphQL](#graphql)
> * [Configuration](#configuration)
>   - [CORS](#cors) 
>   - [Disabling Body Or Route Parsing](#disabling-body-or-route-parsing)
>   - [Customizing The req.params Property](#customizing-the-reqparams-property)
> * [Tips & Tricks](#tips--tricks)
>   - [Dev - Easy Hot Reloading](#dev---easy-hot-reloading)
>   - [Dev - Better Deployments With now-flow](#dev---better-deployments-with-now-flow)
> * [FAQ](#faq)
> * [Annexes](#annexes)
>   - [A.1. CORS Refresher](#a1-cors-refresher)
>   - [A.2. CORS Basic Errors](#a2-cors-basic-errors)
> * [Contributing](#contributing)
> * [About Neap](#this-is-what-we-re-up-to)
> * [License](#license)


# Install
## Prerequisites
> To run your function outside of your local machine, you will need to install Zeit Now.
> The lastest stable version of now that works is @9.0.0. We're currently working on fixing the issues with more recent versions of now.

```
npm install now@9.0.0 -g
```
## Install Webfunc

```
npm install webfunc --save
```

# How To Use It
## Basic - Build Once Deploy Everywhere
> To deploy your app to any serverless solution, first make sure you have installed [_Zeit Now_](https://zeit.co/now) globally:
```
npm install now -g
```

__*1. Create an index.js:*__

```js
const { app } = require('webfunc')

app.get('/users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username}`))

eval(app.listen('app', 4000))
```  
>More details on why `eval` is used under [What does webfunc use eval() to start the server?](#what-does-webfunc-use-eval-to-start-the-server) in the [FAQ](#faq).

__*2. Add a "start" script in your package.json*__
```js
  "scripts": {
    "start": "node index.js"
  }
```

__*3.A. Deploy locally without any other dependencies*__
```
npm start
```

__*3.B. Deploy to Zeit Now*__
```
now
```

__*3.C. Deploy to Google Cloud Function*__

Add a __*now.json*__ file similar to the following:
```js
{
  "gcp": {
    "memory": 128,
    "functionName": "webfunctest",
    "timeout": "100s"
  },
  "environment":{
    "active": "staging",
    "default":{
      "hostingType": "localhost"
    },
    "staging":{
      "hostingType": "gcp"
    }
  }
}
```
Run this command:
```
now gcp
```

The `environment.active = "staging"` indicates that the configuration for your app is inside the `environment.staging` property. There, you can see `"hostingType": "gcp"`. Webfunc uses the `hostingType` property to define how to serve your app (this is indeed different from platform to platform. Trying to deploy a `"hostingType": "gcp"` to Zeit Now will fail). 

>NOTE: Weird timeout convention
> Notice that the timeout used in for gcp is in seconds not millisends. Also, you have to specify the unit at the end: `"timeout": "100s"`.

__*3.D. Deploy to Google Cloud Function For Pub/Sub or Storage Based Triggers or Deploy to AWS Lambda*__

You will need to enhance the _now-CLI_ capabilities by adding a dev dependency called [__*now-flow.js*__](#dev---better-deployments-with-now-flow). An example if available in section [Google Pub/Sub Topic & Storage Trigger Based Functions](#google-pubsub-topic--storage-trigger-based-functions).

>HIGHLY RECOMMENDED - USE __*now-flow.js*__ TO MANAGE YOUR DEPLOYMENTS  
>Without [__*now-flow.js*__](#dev---better-deployments-with-now-flow), you won't be able to deploy to AWS or to GCP using a Pub/Sub topic trigger. _now-flow.js_ is not just about adding other deployment options to _webfunc_. It also tremendously helps to [managing environment variables per deployment](#managing-environment-variables-per-deployment)).

## Passing Parameters To Your HTTP Endpoint
Whether your passing parameters in the URL route, the querystring, or the HTTP body, webfunc will parse those arguments and store them into as a JSON in the `req.params` property. Here is an example of a GET to the following URL: _https://yourapp.com/users/frank?lastname=fitzerald_

```js
app.get('/users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username} ${req.params.lastname}`))
```

## Webfunc Properties On The request Object
The first operation made by webfunc when it receives a request is to add 3 properties on the __*request*__ object:
* `__receivedTime`: Number that milliseconds since epoc when the request reaches the server.
* `__transactionId`: String representing a unique identifier (e.g. useful for tracing purposes).
* `__ellapsedMillis`: Function with no arguments returning the number of milliseconds ellapsed since `__receivedTime`.

## Deploying To Google Functions or AWS
> IMPORTANT: Before deploying to Google Functions (GCP), YOU'LL HAVE TO ENABLE BILLING under the specific project hosting your function. Simply browse to your account ([https://console.cloud.google.com/](https://console.cloud.google.com/)), click on the _Cloud Functions_, and then click on _Enable Billing_.

You will need to enhance the _now-CLI_ capabilities by adding a dev dependency called [__*now-flow.js*__](#dev---better-deployments-with-now-flow). An example if available in section [Google Pub/Sub Topic & Storage Trigger Based Functions](#google-pubsub-topic--storage-trigger-based-functions).

Before deploying to GCP or AWS, you'll have to login first using:

```
now gcp login
```

or

```
now aws login
```

After using one of the above command, you'll be prompt to select a project within your GCP or AWS account. Once selected, your function will be deployed withing that project. 

To change to another project, re-rerun the commands above.

>HIGHLY RECOMMENDED - USE __*now-flow.js*__ TO MANAGE YOUR DEPLOYMENTS  
>Without [__*now-flow.js*__](#dev---better-deployments-with-now-flow), you won't be able to deploy to AWS or to GCP using a Pub/Sub topic trigger. _now-flow.js_ is not just about adding other deployment options to _webfunc_. It also tremendously helps to [managing environment variables per deployment](#managing-environment-variables-per-deployment)).


# Examples
## Creating A REST API
>A REST api is cool but GraphQL is even cooler. Check out how you can create a [GraphQL api](#graphql) in less than 2 minutes [__*here*__](#graphql).
### Single Endpoint
_index.js:_

```js
const { app } = require('webfunc')

app.get('/users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username}`))

eval(app.listen('app', 4000))
```  

To run this code locally, simply run in your terminal:
```
node index.js
```

> To speed up your development, use [_hot reloading_](#dev---easy-hot-reloading) as explained in the [Tips & Tricks](#tips--tricks) section below.

### Multiple Endpoints
```js
const { app } = require('webfunc')

// 1. Simple GET method. 
app.get('/users/:username', (req, res) => 
  res.status(200).send(`Hello ${req.params.username}`))

// 2. GET method with more variables in the route. The conventions are the same as
//    the 'path-to-regex' module (https://github.com/pillarjs/path-to-regexp).
app.get('/users/:username/account/:accountId', (req, res) => 
  res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`))

// 3. Support for multiple routes pointing to the same action.
app.get(['/companies/:companyName', '/organizations/:orgName'], (req, res) => 
  res.status(200).send(req.params.companyName ? `Hello company ${req.params.companyName}` : `Hello organization ${req.params.orgName}`))

// 4. Supports all http verbs: GET, POST, PUT, DELETE, HEAD, OPTIONS.
app.post('/login', (req, res, params={}) => {
  if (req.params.username == 'nic' && req.params.password == '123')
    res.status(200).send(`Welcome ${req.params.username}.`)
  else
    res.status(401).send('Invalid username or password.')
})

// 5. Supports route for any http verb.
app.all('/', (req, res) => res.status(200).send('Welcome to this awesome API!'))

eval(app.listen('app', 4000))
``` 

Notice that in all the cases above, the `req.params` argument contains any parameters that are either passed in the route or in the payload. This scenario is so common that webfunc automatically supports that feature. No need to install any middleware like [body-parser](https://github.com/expressjs/body-parser). Webfunc can even automatically parse __*multipart/form-data*__ content type usually used to upload files (e.g. images, documents, ...). More details under [Uploading Images](#uploading-files--images) in the [Use Cases](#use-cases) section.

Based on certain requirements, it might be necessary to disable this behavior. To do so, please refer to [Disabling Body Or Route Parsing](#disabling-body-or-route-parsing) under the [Configuration](#configuration) section.

## Compatible With All Express Middleware
That's probably one of the biggest advantage of using webfunc. [Express](https://expressjs.com/) offers countless of open-sourced [middleware](https://expressjs.com/en/resources/middleware.html) that would not be as easily usable in a FaaS environment without webfunc. You can for example use the code you're to write in Express to write functions that react to a Google Cloud Pub/Sub topic.

Next, we'll demonstrate 4 different basic scenarios:
1. [Using An Express Middleware Globally](#using-an-express-middleware-globally)
2. [Using An Express Middleware On a Specific Endpoint Only](#using-an-express-middleware-on-a-specific-endpoint-only)
3. [Creating Your Own Middleware](#creating-your-own-middleware)
4. [Chaining Multiple Middleware On a Specific Endpoint](#chaining-multiple-middleware-on-a-specific-endpoint)

### Using An Express Middleware Globally
```js
const { app } = require('webfunc')
const responseTime = require('response-time')

app.use(responseTime())

app.get('/users/:username', (req, res) => 
  res.status(200).send(`Hello ${req.params.username}`))

app.get('/users/:username/account/:accountId', (req, res) => 
  res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`))

eval(app.listen('app', 4000))
```

The snippet above demonstrate how to use the Express middleware [response-time](https://github.com/expressjs/response-time). This middleware measures the time it takes for your server to process a request. It will add a new response header called __X-Response-Time__. In this example, all APIs will be affected. 

### Using An Express Middleware On a Specific Endpoint Only
Similar to Express, webfunc allows to target APIs specifically:

```js
const { app } = require('webfunc')
const responseTime = require('response-time')

app.get('/users/:username', responseTime(), (req, res) => 
  res.status(200).send(`Hello ${req.params.username}`))

app.get('/users/:username/account/:accountId', (req, res) => 
  res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`))

eval(app.listen('app', 4000))
```

In the snippet above, the _response-time_ will only affect the first API.

### Creating Your Own Middleware
Obviously, you can also create your own middleware the exact same way you would have done it with Express, which means you'll also be able to use it with Express:

```js
const { app } = require('webfunc')

const authenticate = (req, res, next) => {
  if (!req.headers['Authorization'])
    res.status(401).send(`Missing 'Authorization' header.`)
  next()
}

app.use(authenticate)

app.get('/users/:username', (req, res) => 
  res.status(200).send(`Hello ${req.params.username}`))

app.get('/users/:username/account/:accountId', (req, res) => 
  res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`))

eval(app.listen('app', 4000))
```

### Chaining Multiple Middleware On a Specific Endpoint
For more complex scenario, you may need to chain multiple middleware differently depending on the endpoint:

```js
const { app } = require('webfunc')

const doSomething = (req, res, next) => {
  // Notice that it might be wise to take some precaution and not override the 'req.params'
  // property, which might have been used a previous middleware.
  if (!req.params || typeof(req.params) != 'object')
    req.params = {}
  Object.assign(req.params, { part_1: 'nice' })
  next()
}

const doSomethingElse = (req, res, next) => {
  if (!req.params || typeof(req.params) != 'object')
    req.params = {}
  Object.assign(req.params, { part_2: 'to see you' })
  next()
}

// One way to chain:
app.get('/users/:username', doSomething, doSomethingElse, (req, res) => 
  res.status(200).send(`Hello ${req.params.username}, ${req.params.part_1} ${req.params.part_2}`))

// Another way to chain:
const middleware = [doSomething, doSomethingElse]

app.get('/', ...middleware.concat((req, res) => 
  res.status(200).send(`Hello ${req.params.part_1} ${req.params.part_2}`)))

eval(app.listen('app', 4000))
```

## Managing Environment Variables Per Deployment
The following code allows to access the current active environment's variables:

```js
const { appConfig } = require('webfunc')
console.log(appConfig.myCustomVar) // > "Hello Default"
```
_**appConfig**_ is the configuration inside the _**now.json**_ under the _**active environment**_ (the _active environment_ is the value of the `environment.active` property).

Here is an example of a typical _now.json_ file:

```js
{
  "environment": {
    "active": "default",
    "default": {
      "hostingType": "localhost",
      "myCustomVar": "Hello Default"
    },
    "staging": {
      "hostingType": "gcp",
      "myCustomVar": "Hello Staging"
    },
    "production": {
      "hostingType": "now",
      "myCustomVar": "Hello Prod"
    }
  }
}
```

As you can see, the example above demonstrates 3 different types of environment setups: `"default"`, `"staging"`, `"prod"`. You can obviouly define as many as you want, and add whatever you need under those environments. Since the value of the `environment.active` is `"default"` in this example, the value of the _**appConfig**_ object is:
```js
{
  "hostingType": "localhost",
  "myCustomVar": "Hello Default"
}
```
## Intercepting The res.send() Method
Webfunc adds support for listeners on the following 3 response events:
- __*sending*__ a response.
- __*setting the headers*__ of a response.
- __*setting the status*__ of a response. 

```js
const { app } = require('webfunc')

app.on('send', (req, res, val) => console.log(val))
app.on('headers', (req, res, ...args) => console.log(args))
app.on('status', (req, res, val) => console.log(val))

app.get('/users/:username', (req, res) => {
  res.set('x-special', 'magic header')
  res.status(200).send(`Hello ${req.params.username}`)
})

eval(app.listen('app', 4000))
```

## Reacting To Google PubSub Topics

One of the goals of Webfunc was to provide a uniform API for building serverless functions. Serverless functions can react to more than HTTP requests, and in this section, we will demonstrate how to build and deploy a Google Cloud Function that can react to messages published to a Google PubSub topic. This section is broken down in 3 parts:
1. [Intro](#intro) - Here we will show how to test a function locally, deploy it to Google Cloud, and then manually test it by publishing a message on a topic.
2. [Minimum Message Requirement](#minimum-message-requirement) - In this section, we will briefly explain the requirement for the messages that can be published so that the function can react to them.
3. [Programmatically Publish To Google PubSub](#programmatically-publish-to-google-pubsub) - Though this is not really relevant to Webfunc, it is still something we expect any coder will eventually do, so we thought that a little help might be useful.

#### Intro

>PREREQUISITES:
>
>__CREATING A GOOGLE CLOUD PUBSUB TOPIC__
>
>Before you can start deploying a webfunc function to Google Cloud that can react to a Google PubSub topic, you will have to do the following:
>1. Create a Google Cloud Account or logging to your Google Cloud console ([https://console.cloud.google.com](https://console.cloud.google.com)). Don't worry, it is free!
>2. Create a new project, or select an existing one.
>3. Enable billing on both Google Cloud Function and Google Cloud PubSub (simply click on those items in the menu and if the billing has not been turned on, then a pop up will appear with a simple button "enable billing". Those services are free unless you exceed the free quota).
>4. Browse to Google PubSub and create your first topic called 'hello-webfunc'.
>
>__INSTALL NOW-FLOW FOR EASIER DEPLOYMENTS TO GOOGLE CLOUD__
>
>[__*now-flow*__](https://github.com/nicolasdao/now-flow) automates your Zeit Now deployments and will decrease the configuration setup. Simply run `npm install now-flow --save-dev`.

Because Express has become such a familiar tool, our team decided to embrace its API conventions, even for functions reacting to events other than HTTP requests. If you're interested in seeing an example of how you would build a normal function using the standard Google API, please refer to [this documentation](https://cloud.google.com/functions/docs/tutorials/pubsub). The other reason we found it was very useful to use an Express convention for building any function is testability. Indeed, because Webfunc treats any event as a web request, it is very easy to test your function locally using a standard HTTP POST containing the event payload. We will demonstrate this by creating a simple email notification function that reacts to messages dropped on the Google Cloud PubSub topic we created in the prerequiste steps:

1. Configure [now](https://zeit.co/now) to use the Google project we defined in the prerequisite steps: `now gcp login` (once you're logged in, you'll be asked to choose a project in your CLI. Choose the project we created in the prerequisite steps)
2. Create a new npm project: `npm init`
3. Install _nodemailer_ to send a dummy email: `npm install nodemailer --save`
4. Create a new `index.js` as follow:
  ```js
  const { app } = require('webfunc')
  const nodemailer = require('nodemailer');

  app.post('/sayhi', (req, res) => {
    // STEP 1. Get payload
    const { to, subject, message } = req.params

    // STEP 2. Send email
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    nodemailer.createTestAccount((err, account) => {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user, // generated ethereal user
          pass: account.pass // generated ethereal password
        }
      })

      // setup email data with unicode symbols
      let mailOptions = {
        from: '"Webfunc 👻" <webfunc-example@googlepubsub.com>', // sender address
        to: to,
        subject: subject,
        html: message
      }

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error)
          res.status(500).send(error)
        }
        else {
          const msg = `Message sent: ${info.messageId}\nPreview URL: ${nodemailer.getTestMessageUrl(info)}`
          console.log(msg)
          res.status(200).send(msg)
        }
      })
    })
  })

  eval(app.listen('app', 4000))
  ```

>IMPORTANT: When it comes to create a webfunc function reacting to events other than HTTP requests, only POST  methods are allowed.

5. Start the server locally to start testing this code: `node index.js`
6. Test this code locally: 
  ```
  curl -X POST -H 'Content-Type: application/json' -d '{"to":"hello@webfunc.co","subject":"PubSub with Webfunc", "message": "<b>PubSub with Webfunc is easy mate!!!</b>"}' http://localhost:4000/sayhi
  ```
   
  This will return a message similar to:
  ```
  Message sent: <6846cab2-a1fc-6310-cbba-d85159acf1cd@googlepubsub.com>
  Preview URL: https://ethereal.email/message/WpuwmIPHUAoowF06WpufewfwpxLDDPAAAAAYyFpXXAobCBPcRN5IvxKV0
  ```

  Copy/paster the Preview URL in your browser to visualise your test email.


What the above achieved is nothing different from what we've been demonstrating previously. Let's deploy this code to a Google Cloud Function that should be responding to messages published to the topic we created in the prerequisite steps above:

1. Create a new `now.json` file as follow:
  ```js
  {
    "environment": {
      "active": "default",
      "default": {
        "hostingType": "localhost"
      },
      "prod": {
        "hostingType": "gcp",
        "gcp": {
          "functionName": "webfunc-pubsub",
          "memory": 128,
          "trigger": {
            "type": "cloud.pubsub",
            "topic": "hello-webfunc"
          }
        }
      }
    }
  }
  ```

  This config file defines a production environment `prod` that contains the details of the Google Cloud Function we want to deploy as well as the PubSub topic we want it to react to (i.e. `hello-webfunc` created in the prerequisite steps).

2. Add a deployment script in the `package.json` as follow:
  ```js
  "scripts": {
    "deploy": "nowflow prod"
  }
  ```

3. Deploy your function: `npm run deploy`

  >WARNING: There seems to be a bug the first time you deploy. A `failed deployment` error might happen when in reality the deployment was successful. Double-check that your function has been created in your [Google Function console](https://console.cloud.google.com/functions).

4. Publish a message to the `hello-webfunc` topic to see if this function reacts to it:
  - Go to the [Google PubSub console](https://console.cloud.google.com/cloudpubsub).
  - Select the `hello-webfunc` topic.
  - Click on the __PUBLISH MESSAGE__ button.
  - Add the following 4 key/value pairs and then press __Publish__:

  | Key      | Value                                         | 
  | :------- |:--------------------------------------------- | 
  | to       | whatever@gmail.com                            |
  | subject  | Testing Webfunc PubSub                        |
  | message  | `<h1>Hi there</h1><p>Webfunc is awesome!</p>` |
  | pathname | sayhi                                         |

  >IMPORTANT - Notice that we need to add a new field called `pathname`. This is what allows to target a specific endpoint (in this case `app.post('/sayhi', (req, res) => { ... })`).

5. Verify that this worked by checking the Google Function log. There, you should see the `Preview URL` and then browse there to verify that everything is working fine.

#### Minimum Message Requirement

As we demonstrated in the example above, the structure of the published message can be anything __BUT IT MUST AT LEAST CONTAIN A *pathname* property. That `pathname` property__ is required to allow webfunc to identify which endpoint it needs to route that message to. 

#### Programmatically Publish To Google PubSub

1. Get a JSON file containing a private key that allows to publish to the Google PubSub topic:
  - Log to your Google Cloud project.
  - Browse to the Service Accounts section under _IAM & admin/Service accounts_.
  - Click on the __CREATE SERVICE ACCOUNT__ button. There give it a name, select the role _PubSub/PubSub Publisher_ and then tick the _Furnish a new private key_ (select JSON format) checkbox before clicking the CREATE button. 
  - Save that json file under your project and let's rename it `secrets.json` for the sake of this example.

2. Install _@google-cloud/pubsub_: `npm install @google-cloud/pubsub --save`
3. Create a new `publish.js` as follow:
  ```js
  const path = require('path')

  const GOOGLE_PROJECT = 'your-google-project-name'
  const TOPIC_NAME = 'hello-webfunc'
  const SECRETS_PATH = path.join(process.cwd(), './secrets.json')

  const pubsub = require('@google-cloud/pubsub')({
    projectId: GOOGLE_PROJECT,
    keyFilename: SECRETS_PATH
  })

  const topic = pubsub.topic(TOPIC_NAME)
  const publisher = topic.publisher()
  const emptyBuffer = Buffer.from('')

  const publish = (data={}) => new Promise((onSuccess, onFailure) => publisher.publish(emptyBuffer, data, (err, res) => err ? onFailure(err) : onSuccess(res)))

  publish({
    to: 'hello@webfunc.com',
    subject: 'Webfunc ♥ Google PubSub',
    message: '<h1>Love Story</h1><b>Webfunc and Google PubSub rock together.</b>',
    pathname: 'sayhi'
  })
  .then(() => console.log(`Great!!! Message sent!`))
  .catch(err => console.error(`Dammit! Somthing went wrong:\n${err.message}\n${err.stack}`))
  ```

4. Excute this code: `node publish.js`

## Authentication 
Authentication using webfunc is left to you. That being said, here is a quick example on how that could work using the awesome [passport](http://passportjs.org/) package. The following piece of code for Google Cloud Functions exposes a _signin_ POST endpoint that expects an email and a password and that returns a JWT token. Passing that JWT token in the _Authorization_ header using the _bearer_ scheme will allow access to the _/_ endpoint.

```js
const { app } = require('webfunc')
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

const authenticate = () => (req, res, next) => passport.authenticate('jwt', (err, user) => {
  if (user) {
    // Notice that it might be wise to take some precaution and not override the 'req.params'
    // property, which might have been used a previous middleware.
    if (!req.params || typeof(req.params) != 'object')
      req.params = {}
    Object.assign(req.params, { user })
    next()
  }
  else
    res.status(401).send(`You must be logged in to access this endpoint!`)
})(req, res)

// This api does not require authentication. It is used to acquire the bearer token.
app.post('/signin', (req, res) => {
  if (req.params.email == 'hello@webfunc.co' && req.params.password == 'supersecuredpassword') {
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

// This api requires authentication. You must pass a header names "Authorization"
app.get('/', authenticate(), (req, res) => res.status(200).send(`Welcome ${req.params.user.username}!`))

eval(app.listen('app', 4000))
```

To test that piece of code:

__*1. Login:*__
```
curl -X POST -H 'Content-Type: application/json' -d '{"email":"hello@webfunc.co","password":"supersecuredpassword"}' http://localhost:4000/signin
```
Extract the token received from this POST request and use it in the following GET request's header:

__*2. Access the secured _/_ endpoint:*__
```
curl -v -H "Authorization: Bearer your-jwt-token" http://localhost:4000
```

## Uploading Files & Images

As mentioned before, webfunc's default behavior is to [automatically extract the payload as well as the route variables](#multiple-endpoints) into a json object. This includes the request with a __*multipart/form-data*__ content type. In that case, an object similar to the following will be stored under `req.params.yourVariableName`:
```js
{
  filename: "filename.ext",
  mimetype: "image/png",
  value: <Buffer>
}
```

where
- `filename` is a string representing the name of the uploaded file.
- `mimetype` is a string representing the mimetype of the uploaded file (e.g. 'image/png').
- `value` is a Buffer representing the uploaded file itself.

Here is a code snippet that shows how to store the uploaded file locally:

```js
const { app } = require('webfunc')
const path = require('path')
const fs = require('fs')

const save = (filePath, data) => new Promise((onSuccess, onFailure) => fs.writeFile(filePath, data, err => {
  if (err) {
    console.error(err)
    onFailure(err)
  }
  else
    onSuccess()
}))

app.post('/upload', (req, res) => 
  save(path.join(process.cwd(), req.params.myimage.filename), req.params.myimage.value)
  .then(() => res.status(200).send('Upload successfull'))
  .catch(err => res.status(500).send(err.message))
)

eval(app.listen('app', 4000))
```

You can test this code locally by using [Postman](https://www.getpostman.com/) as follow:

<img src="https://raw.githubusercontent.com/nicolasdao/webfunc/master/docs/mutltipart.png" alt="Neap Pty Ltd logo" title="Neap" />


## GraphQL

Deploying a GraphQL api as well as a GraphiQL Web UI to document and test that api has never been easier. GraphQL is beyond the topic of this document. You can learn all about it on the official webpage. 

To create your own GraphQL api in a few minutes using webfunc, simply run those commands:
```
git clone https://github.com/nicolasdao/graphql-universal-server.git
cd graphql-universal-server
npm install
npm start
```

This will locally host the following:

- [http://localhost:4000](http://localhost:4000): This is the GraphQL endpoint that your client can start querying.
- [http://localhost:4000/graphiql](http://localhost:4000/graphiql): This is the GraphiQL Web UI that you can use to test and query your GraphQL server. 

More details about modifying this project for your own project [here](https://github.com/nicolasdao/graphql-universal-server).

The index.js of that project looks like this:

```js
const { app } = require('webfunc')
const { graphqlHandler } = require('graphql-serverless')
const { transpileSchema } = require('graphql-s2s').graphqls2s
const { makeExecutableSchema } = require('graphql-tools')
const { glue } = require('schemaglue')

const { schema, resolver } = glue('./src/graphql')

const executableSchema = makeExecutableSchema({
  typeDefs: transpileSchema(schema),
  resolvers: resolver
})

const graphqlOptions = {
  schema: executableSchema,
  graphiql: true,
  endpointURL: '/graphiql',
  context: {} // add whatever global context is relevant to you app
}

// The GraphQL api
app.all(['/', '/graphiql'], graphqlHandler(graphqlOptions))

eval(app.listen('app', 4000))
```

# Configuration
## CORS
>More details about those headers in the [Annexes](#annexes) section under [A.1. CORS Refresher](#a1-cors-refresher).

Similar to body parsing, CORS (i.e. [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)) is a feature that is so often required that webfunc also supports it out-of-the box. That means that in most cases, the [Express CORS](https://github.com/expressjs/cors) middleware will not be necessary. 

```js
const { app, cors } = require('webfunc')

// AJAX requests allowed from any domain.
const globalAccess = cors()

// No AJAX requests allowed except from domain than 'https://example.com'.
const restrictedAccess = cors({
  methods: ['GET'],
  allowedHeaders: ['Authorization', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  origins: ['https://example.com']
})

app.get('/products/:id', globalAccess, (req, res) => res.status(200).send(`This is product ${req.params.id}`))
// The 'OPTIONS' verb is required to allow preflight requests. Indeed, request with headers like 'Authorization' are not considered
// simple requests (ref. https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). The browser will then do what's called a 
// preflight request using the 'OPTIONS' http method to acquire more data on the server. If the server fails to respond to 
// that 'OPTIONS' request, the browser will abort the request.
app.options('/users/:username', restrictedAccess)
app.get('/users/:username', restrictedAccess, (req, res) => res.status(200).send(`Hello ${req.params.username}`))

eval(app.listen('app', 4000))
```

>CORS is a classic source of headache. Though webfunc allows to easily configure any project, it will not prevent you to badly configure a project, and therefore loose a huge amount of time. For that reason, a series of common mistakes have been documented in the [Annexes](#annexes) section under [A.2. CORS Basic Errors](#a2-cors-basic-errors).

## Disabling Body Or Route Parsing
Webfunc's default behavior is to parse both the payload and any variables found in the route into a JSON object (see [previous example](#multiple-endpoints)). Based on certain requirements, it might be necessary to disable that behavior (e.g. trying to read the payload again in your app might not work after webfunc has parsed it). 

To disable completely or partially that behavior, add a `"params"` property in the __*now.json*__ configuration file in the root of your application as follow: 

_Example of a now.json config that disable the payload parsing only:_
```js
{
  "params": { mode: "route" }
}
```

That _mode_ property accepts 4 modes:
- __*all*__: (default) Both the payload and the route variables are extracted.
- __*route*__: Only the variables from the route are extracted. The payload is completely ignored.
- __*body*__: Only the payload is parsed. The route variables are completely ignored.
- __*none*__: Neither the payload nor the route variables are extracted.

If the _params_ property or the _mode_ are not defined in the _now.json_, then the default mode is _all_.

## Customizing The req.params Property
If the `params` property conflicts with some middleware or other 3rd party systems, you can change that property name. Just configure the __*now.json*__ as follow:
```js
{
  "params": { propName: "somethingElse" }
}
```
The configuration above with replace `req.params` to `req.somethingElse`. 

# Tips & Tricks
## Dev - Easy Hot Reloading
While developing on your localhost, we recommend using hot re
loading to help you automatically restart your node process after each change. [_node-dev_](https://github.com/fgnass/node-dev) is a lightweight development tools that watches the minimum amount of files in your project and automatically restart the node process each time a file has changed. 
```
npm install node-dev --save-dev
```
Change your __*start*__ script in your _package.json_ from `"start": "node index.js"` to:
```js
  "scripts": {
    "start": "node-dev index.js"
  }
```
Then simply start your server as follow:
```
npm start
```

## Dev - Better Deployments With now-flow
### Overview - Deploy To AWS, Add Google Pub/Sub Topic Trigger Based Functions & Automate Deployments
As we've see it above, a __*now.json*__ configuration becomes quickly necessary. Almost all projects will end up needing multiple environment configurations (i.e. prod, staging, ...) and  environment variables specific to them (more info in section [Managing Environment Variables Per Deployment](#managing-environment-variables-per-deployment)). Though it is really straightforward to configure the now.json file, it can be annoying as well as error-prone to modify it prior to each deployment (e.g. deploying to the `staging` environment requires to set up the `"active"` property to `"staging"`. Another classic example is to deploy to multiple _gcp_ environments. In that case, you will have to update the `"gcp"` property prior to each deployment). Beside, as of version 9.2.5., __*now-CLI*__ still experiences bugs while deploying to AWS and simply can't deploy Google Functions that can be triggered by Pub/Sub topics.

For all the reason above, we developed [__*now-flow*__](https://github.com/nicolasdao/now-flow). It is a simple dev dependency that you should add to your project. It controls the _now-CLI_ while enhancing its capabilities. Simply define all your configurations specific to each environment inside your usual __now.json__, and let NowFlow do the rest. 

No more deployment then aliasing steps. No more worries that some environment variables have been properly deployed to the right environment. 

> More details about __*now-flow*__ [here](https://github.com/nicolasdao/now-flow).

### How To Use It
#### HTTPS Endpoints

__Install it first in your project:__
```
npm install now-flow --save-dev
```
__Then configure your *now.json* for each of your environment:__
```js
{
  "environment": {
    "active": "default",
    "default": {
      "hostingType": "localhost",
      "db": {
        "user": "postgres",
        "password": "bla_staging_bla_staging"
      }
    },
    "staging": {
      "hostingType": "gcp",
      "db": {
        "user": "postgres",
        "password": "bla_staging_bla_staging"
      },
      "gcp": {
        "functionName": "yourapp-test",
        "memory": 128
      }
    },
    "uat": {
      "hostingType": "aws",
      "db": {
        "user": "postgres",
        "password": "bla_staging_bla_staging"
      },
      "aws": {
        "memory": 128,
        "region": "ap-southeast-2"
      }
    },
    "prod": {
      "hostingType": "now",
      "db": {
        "user": "postgres",
        "password": "bla_prod_bla_prod"
      },
      "scripts": {
        "start": "NODE_ENV=production node index.js"
      },
      "alias": "yourapp-prod"
    }
  }
}
```
__Add new deployment scripts in your *package.json*:__
```js
"scripts": {
  "deploy:staging": "nowflow staging",
  "deploy:uat": "nowflow uat",
  "deploy:prod": "nowflow prod",
}
```

Now you can deploy to `gcp`, `aws` or `now` using the exact same code:

_Deploying to __gcp__ (make sure you have run `now gcp login` at least once before):_
```
npm run deploy:staging
```
_Deploying to __aws__ (make sure you have run `now aws login` at least once before):_
```
npm run deploy:uat
```
_Deploying to __now__ (make sure you have run `now login` at least once before):_
```
npm run deploy:prod
```

#### Google Pub/Sub Topic & Storage Trigger Based Functions
Simply add configurations similar to the following into the __*now.json*__:
```js
{
  "environment": {
    "active": "default",
    "default": {
      "hostingType": "localhost"
    },
    "example1": {
      "hostingType": "gcp",
      "gcp": {
        "functionName": "yourapp-test",
        "memory": 128,
        "trigger": {
          "type": "cloud.pubsub",
          "topic": "your-google-topic-name"
        }
      }
    },
    "example2": {
      "hostingType": "gcp",
      "gcp": {
        "functionName": "yourapp-test",
        "memory": 128,
        "trigger": {
          "type": "cloud.storage",
          "bucket": "your-google-bucket-name"
        }
      }
    }
  }
}
```
Similar to the previous example, update your _package.json_ as follow:
```js
"scripts": {
  "deploy:example1": "nowflow example1",
  "deploy:example2": "nowflow example2"
}
```

Then deploy using the same commands as in the previous section (e.g. `npm run deploy:example1`).

As promised, the code you will write in your __*index.js*__ will be the same code you are used to writing for express apps:
```js
const { app } = require('webfunc')

app.post((req, res) => {
  console.log(req)
  console.log(`Hello ${req.params.firstName}`)
})

eval(app.listen('app', 4000))
``` 

As for any webfunc app, the parameters passed the request will be in the `req.params` object. 

>IMPORTANT - ONLY USE 'post' OR 'all' METHODS FOR PUB/SUB AND STORAGE BASED FUNCTIONS

# FAQ
## What does webfunc use eval() to start the server?
You should have noticed that all the snippets above end up with `eval(app.listen('app', 4000))`. The main issue webfunc tackles is to serve endpoints using a uniform API regardless of the serverless hosting platform. This is indeed a challenge as different platforms use different convention. [Zeit Now](https://zeit.co/now) uses a standard [Express](https://expressjs.com/) server, which means that the api to start the server is similar to `app.listen()`. However, with FaaS ([Google Cloud Functions](https://cloud.google.com/functions/), [AWS Lambdas](https://aws.amazon.com/lambda), ...), there is no server to be started. The server lifecycle is automatically managed by the 3rd party. The only piece of code you need to write is a handler function similar to `exports.handler = (req, res) => res.status(200).send('Hello world')`. In order to manage those 2 main scenarios, webfunc generate the code to be run as a string, and evaluate it using `eval()`. You can easily inspect the code as follow:

```js
const { app } = require('webfunc')

app.get('/users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username}`))

const code = app.listen('app', 4000)
console.log(eval(code))
eval(code)
```  

To observe the difference between a hosting type `"now"` and `"gcp"`, update the __*now.json*__ file as follow:
```js
{
  "environment": {
    "active": "default",
    "default": {
      "hostingType": "gcp"
    }
  }
}
```

Then run:
```
node index.js
```

## Can I Use Webfunc In a Non-Serverless Environment?
Absolutely! If you don't specify a string as the first argument of the `listen` api, then it will work as an Express server:
```js
const { app } = require('webfunc')

app.get('/users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username}`))

app.listen(4000)
```

Then run:
```
node index.js
```

# Annexes
## A.1. CORS Refresher
_COMING SOON..._

## A.2. CORS Basic Errors
_**WithCredentials & CORS**_
The following configuration is forbidden:
```js
const { cors } = require('webfunc')

const restrictedAccess = cors({
  origins: ['*'],
  credentials: true
})
```

You cannot allow anybody to access a resource(`"Access-Control-Allow-Origin": "*"`) while at the same time allowing anybody to share cookies(`"Access-Control-Allow-Credentials": "true"`). This would be a huge security breach (i.e. [CSRF attach](https://en.wikipedia.org/wiki/Cross-site_request_forgery)). 

For that reason, this configuration, though it allow your resource to be called from the same origin, would fail once your API is called from a different origin. A error similar to the following would be thrown by the browser:
`The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`

__*Solutions*__

If you do need to share cookies, you will have to explicitely list the origins that are allowed to do so:
```js
const { cors } = require('webfunc')

const restrictedAccess = cors({
  origins: ['http://your-allowed-origin.com'],
  credentials: true
})
```

If you do need to allow access to anybody, then do not allow requests to send cookies:
```js
const { cors } = require('webfunc')

const restrictedAccess = cors({
  origins: ['*'],
  allowedHeaders: ['Authorization'],
  credentials: false
})
```

If you do need to pass authentication token, you will have to pass it using a special header(e.g. Authorization), or pass it in the query string if you want to avoid preflight queries (preflight queries happens in cross-origin requests when special headers are being used). However, passing credentials in the query string are considered a bad practice. 

# Contributing
```
npm test
```

# This Is What We re Up To
We are Neap, an Australian Technology consultancy powering the startup ecosystem in Sydney. We simply love building Tech and also meeting new people, so don't hesitate to connect with us at [https://neap.co](https://neap.co).

Our other open-sourced projects:
#### Web Framework & Deployment Tools
* [__*webfunc*__](https://github.com/nicolasdao/webfunc): Write code for serverless similar to Express once, deploy everywhere. 
* [__*now-flow*__](https://github.com/nicolasdao/now-flow): Automate your Zeit Now Deployments.

#### GraphQL
* [__*graphql-serverless*__](https://github.com/nicolasdao/graphql-serverless): GraphQL (incl. a GraphiQL interface) middleware for [webfunc](https://github.com/nicolasdao/webfunc).
* [__*schemaglue*__](https://github.com/nicolasdao/schemaglue): Naturally breaks down your monolithic graphql schema into bits and pieces and then glue them back together.
* [__*graphql-s2s*__](https://github.com/nicolasdao/graphql-s2s): Add GraphQL Schema support for type inheritance, generic typing, metadata decoration. Transpile the enriched GraphQL string schema into the standard string schema understood by graphql.js and the Apollo server client.
* [__*graphql-authorize*__](https://github.com/nicolasdao/graphql-authorize.git): Authorization middleware for [graphql-serverless](https://github.com/nicolasdao/graphql-serverless). Add inline authorization straight into your GraphQl schema to restrict access to certain fields based on your user's rights.

#### React & React Native
* [__*react-native-game-engine*__](https://github.com/bberak/react-native-game-engine): A lightweight game engine for react native.
* [__*react-native-game-engine-handbook*__](https://github.com/bberak/react-native-game-engine-handbook): A React Native app showcasing some examples using react-native-game-engine.

#### Tools
* [__*aws-cloudwatch-logger*__](https://github.com/nicolasdao/aws-cloudwatch-logger): Promise based logger for AWS CloudWatch LogStream.

# License
Copyright (c) 2018, Neap Pty Ltd.
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

<p align="center"><a href="https://neap.co" target="_blank"><img src="https://neap.co/img/neap_color_horizontal.png" alt="Neap Pty Ltd logo" title="Neap" height="89" width="200"/></a></p>
