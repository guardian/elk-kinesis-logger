const ELKKinesisLogger = require('../src/elk-kinesis-logger');

const options = {
  stage: process.env.STAGE,
  stack: process.env.STACK,
  app: 'elk-kinesis-logger',
  streamName: process.env.STREAM_NAME
};

const logger = new ELKKinesisLogger(options)
  .withRole(process.env.ROLE_ARN)
  .open();

logger.log('oh hello there');

// set a custom `app` for this log line to appear under different app in ELK
logger.log('something bad happened', {
  app: 'another-elk-kinesis-logger'
});

logger.close().then(writtenLogs => {
  // eslint-disable-next-line no-console
  console.log(writtenLogs);
});
