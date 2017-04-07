const AWS = require('aws-sdk-mock');
const assert = require('assert');
const MockDate = require('mockdate');
const ELKKinesisLogger = require('../src/elk-kinesis-logger');

describe('ELKKinesisLogger', () => {
  const config = {
    stage: 'TEST',
    stack: 'elk-kinesis-logger',
    app: 'elk-kinesis-logger-tests',
    roleArn: 'test-role',
    streamName: 'test-stream',
    verbose: false
  };

  const logMsg = 'testing testing, is this thing on?';

  const date = new Date(2017, 0, 1);

  before(() => {
    MockDate.set(date);

    AWS.mock('STS', 'assumeRole', (params, callback) => {
      callback(null, {
        Credentials: {
          AccessKeyId: 'secretID',
          SecretAccessKey: 'secretKey',
          SessionToken: 'secretToken'
        }
      });
    });

    AWS.mock('Kinesis', 'putRecord', (params, callback) => {
      callback(null, {});
    });
  });

  after(() => {
    MockDate.reset();
    AWS.restore();
  });

  it('should raise an error if not opened', () => {
    const logger = new ELKKinesisLogger(config);

    try {
      logger.log('test');
    } catch (actual) {
      assert.equal(
        actual,
        'ELKKinesisLogger has not been opened. Be sure to call .open() first.'
      );
    }
  });

  it('should write a simple log to kinesis', done => {
    const logger = new ELKKinesisLogger(config);

    logger.open().then(() => {
      logger.log(logMsg);

      logger
        .close()
        .then(actual => {
          const expected = [
            {
              stack: 'elk-kinesis-logger',
              stage: 'TEST',
              app: 'elk-kinesis-logger-tests',
              timestamp: date,
              level: 'INFO',
              message: logMsg
            }
          ];

          const kinesisMsg = {
            StreamName: config.streamName,
            PartitionKey: 'logs',
            Data: JSON.stringify(expected[0])
          };

          assert.equal(true, logger.kinesis.putRecord.calledOnce);
          assert.equal(true, logger.kinesis.putRecord.calledWith(kinesisMsg));
          assert.deepEqual(actual, expected);
          done();
        })
        .catch(err => done(new Error(err)));
    });
  });

  it('should write a log with extra detail to kinesis', done => {
    const logger = new ELKKinesisLogger(config);

    logger.open().then(() => {
      const extraDetail = {
        foo: 'bar'
      };

      logger.log(logMsg, extraDetail);

      logger
        .close()
        .then(actual => {
          const expected = [
            {
              stack: 'elk-kinesis-logger',
              stage: 'TEST',
              app: 'elk-kinesis-logger-tests',
              timestamp: date,
              level: 'INFO',
              message: logMsg,
              foo: 'bar'
            }
          ];

          const kinesisMsg = {
            StreamName: config.streamName,
            PartitionKey: 'logs',
            Data: JSON.stringify(expected[0])
          };

          assert.equal(true, logger.kinesis.putRecord.calledOnce);
          assert.equal(true, logger.kinesis.putRecord.calledWith(kinesisMsg));

          assert.deepEqual(actual, expected);
          done();
        })
        .catch(err => done(new Error(err)));
    });
  });

  it('should write multiple logs', done => {
    const logger = new ELKKinesisLogger(config);

    logger.open().then(() => {
      logger.log('first message');
      logger.log('second message');

      logger
        .close()
        .then(actual => {
          const expected = [
            {
              stack: 'elk-kinesis-logger',
              stage: 'TEST',
              app: 'elk-kinesis-logger-tests',
              timestamp: date,
              level: 'INFO',
              message: 'first message'
            },
            {
              stack: 'elk-kinesis-logger',
              stage: 'TEST',
              app: 'elk-kinesis-logger-tests',
              timestamp: date,
              level: 'INFO',
              message: 'second message'
            }
          ];

          expected
            .map(ex => {
              return {
                StreamName: config.streamName,
                PartitionKey: 'logs',
                Data: JSON.stringify(ex)
              };
            })
            .forEach(kinesisMsg => {
              assert.equal(
                true,
                logger.kinesis.putRecord.calledWith(kinesisMsg)
              );
            });

          assert.equal(true, logger.kinesis.putRecord.calledTwice);

          assert.deepEqual(actual, expected);
          done();
        })
        .catch(err => done(new Error(err)));
    });
  });

  it('should write logs of multiple levels', done => {
    const logger = new ELKKinesisLogger(config);

    logger.open().then(() => {
      logger.log('first message');
      logger.error('second message');

      logger
        .close()
        .then(actual => {
          const expected = [
            {
              stack: 'elk-kinesis-logger',
              stage: 'TEST',
              app: 'elk-kinesis-logger-tests',
              timestamp: date,
              level: 'INFO',
              message: 'first message'
            },
            {
              stack: 'elk-kinesis-logger',
              stage: 'TEST',
              app: 'elk-kinesis-logger-tests',
              timestamp: date,
              level: 'ERROR',
              message: 'second message'
            }
          ];

          expected
            .map(ex => {
              return {
                StreamName: config.streamName,
                PartitionKey: 'logs',
                Data: JSON.stringify(ex)
              };
            })
            .forEach(kinesisMsg => {
              assert.equal(
                true,
                logger.kinesis.putRecord.calledWith(kinesisMsg)
              );
            });

          assert.equal(true, logger.kinesis.putRecord.calledTwice);

          assert.deepEqual(actual, expected);
          done();
        })
        .catch(err => done(new Error(err)));
    });
  });
});