# ELK Kinesis Logger
Send logs to an ELK stack via an AWS Kinesis stream.

The ELK stack should be using the [Kinesis Input Plugin](https://github.com/logstash-plugins/logstash-input-kinesis).

Uses `STSAssumeRole` to authenticate to Kinesis.

## Why
The main use case is for AWS Lambdas. When you `console.log` within a Lambda, they go into CloudWatch Logs.
Whilst CloudWatch Logs is good, an ELK stack is better!

Using this module, we can easily get logs into an ELK stack.

## Installation
```bash
npm install elk-kinesis-logger
```

## Usage
Import the module:
```js
const ELKKinesisLogger = require('elk-kinesis-logger');
```

Create a new logger:
```js
const logger = new ELKKinesisLogger({
  stage: 'PROD',
  stack: 'my-stack',
  app: 'my-app',
  roleArn: 'arn:aws:iam::000000000000:role/my-role',
  streamName: 'my-stream'
});
```

Open the logger:
```js
logger.open().then(() => {
    
});
```

Write a log message:
```js
logger.log('something happened');
```

Ensure all logs have written by closing the logger:
```js
logger.close().then(() => {
    
});
```

### Complete example
```js
const ELKKinesisLogger = require('elk-kinesis-logger');

const logger = new ELKKinesisLogger({
  stage: 'PROD',
  stack: 'my-stack',
  app: 'my-app',
  roleArn: 'arn:aws:iam::000000000000:role/my-role',
  streamName: 'my-stream'
});

logger.open().then(() => {
  const value = 5 * 5;
  
  logger.log(`the value is ${value}`);
  
  return logger.close();
}).then((writtenLogs) => {
  // other work
});
```

### Further examples
See [the examples](./examples).

## Contributing
- clone the repo
- update the code
- write a test
- `npm test`
- commit

## Publishing
- `npm publish`
