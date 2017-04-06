const AWS = require('aws-sdk');

class Logger {
  constructor(
    {stage, stack, app, roleArn, streamName, sendLogsToKinesis = true},
  ) {
    this.stage = stage;
    this.stack = stack;
    this.app = app;
    this.roleArn = roleArn;
    this.streamName = streamName;
    this.sendLogsToKinesis = sendLogsToKinesis;
    this._logLines = [];
  }

  open() {
    return new Promise((resolve, reject) => {
      if (!this.sendLogsToKinesis) {
        resolve(this);
      } else {
        const sts = new AWS.STS();

        const roleRequest = sts.assumeRole({
          RoleArn: this.roleArn,
          RoleSessionName: this.app,
        });

        roleRequest.send((err, data) => {
          if (err) {
            reject(err);
          } else {
            this.kinesis = new AWS.Kinesis({
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken,
            });

            resolve(this);
          }
        });
      }
    });
  }

  close() {
    // eslint-disable-next-line no-console
    console.log(`Ensuring ${this._logLines.length} log lines are written`);

    return Promise.all(this._logLines);
  }

  log(message, extraDetail) {
    this._logLines.push(this._putRecord({level: 'INFO', message, extraDetail}));
  }

  error(message, extraDetail) {
    this._logLines.push(
      this._putRecord({level: 'ERROR', message, extraDetail}),
    );
  }

  _putRecord({level, message, extraDetail = {}}) {
    return new Promise((resolve, reject) => {
      const coreLogMessage = {
        stack: this.stack,
        stage: this.stage,
        app: this.app,
        timestamp: new Date(),
      };

      const fullLogMessage = Object.assign(
        {},
        coreLogMessage,
        {level, message},
        extraDetail,
      );

      // eslint-disable-next-line no-console
      console.log(
        `${fullLogMessage.timestamp} ${fullLogMessage.level} ${fullLogMessage.message} ${fullLogMessage.extraDetail}`,
      );

      if (!this.sendLogsToKinesis) {
        resolve(fullLogMessage);
      } else {
        const putRecordsRequest = this.kinesis.putRecord({
          StreamName: this.streamName,
          PartitionKey: 'logs',
          Data: JSON.stringify(fullLogMessage),
        });

        putRecordsRequest.send(err => {
          if (err) {
            reject(err);
          } else {
            resolve(fullLogMessage);
          }
        });
      }
    });
  }
}

module.exports = Logger;
