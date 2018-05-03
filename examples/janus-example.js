const ELKKinesisLogger = require('../src/elk-kinesis-logger');

const stage = process.env.STAGE || 'DEV';
const isDev = stage === 'DEV';

const options = {
  stage: stage,
  stack: process.env.STACK,
  app: 'elk-kinesis-logger',
  streamName: process.env.STREAM_NAME
};

const logger = new ELKKinesisLogger(options);

if (isDev) {
  logger.withProfile(process.env.PROFILE).open();
} else {
  logger.withRole(process.env.ROLE_ARN).open();
}

logger.log('oh hello there');

logger.close().then(writtenLogs => {
  // eslint-disable-next-line no-console
  console.log(writtenLogs);
});
