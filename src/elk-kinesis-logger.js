const AWS = require('aws-sdk');

class ELKKinesisLogger {
  constructor({stage, stack, app, roleArn, streamName, verbose = true}) {
    this.stage = stage;
    this.stack = stack;
    this.app = app;
    this.roleArn = roleArn;
    this.streamName = streamName;
    this.verbose = verbose;
  }

  get _name() {
    return this.constructor.name;
  }

  open() {
    return new Promise((resolve, reject) => {
      const sts = new AWS.STS();

      const options = {
        RoleArn: this.roleArn,
        RoleSessionName: this.app
      };

      sts.assumeRole(options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          this.kinesis = new AWS.Kinesis({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });

          this._logLines = [];

          resolve(this);
        }
      });
    });
  }

  close() {
    this._consoleLog(`ensuring ${this._logLines.length} log lines are written`);
    return Promise.all(this._logLines);
  }

  log(message, extraDetail) {
    this._ensureOpened();
    this._logLines.push(this._putRecord({level: 'INFO', message, extraDetail}));
  }

  error(message, extraDetail) {
    this._ensureOpened();
    this._logLines.push(
      this._putRecord({level: 'ERROR', message, extraDetail})
    );
  }

  _ensureOpened() {
    if (!this._logLines) {
      throw `${this._name} has not been opened. Be sure to call .open() first.`;
    }
  }

  _consoleLog(message) {
    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(
        `${new Date().toISOString()} [INFO] from ${this._name} - ${message}`
      );
    }
  }

  _putRecord({level, message, extraDetail = {}}) {
    return new Promise((resolve, reject) => {
      const coreLogMessage = {
        stack: this.stack,
        stage: this.stage,
        app: this.app,
        timestamp: new Date()
      };

      const fullMsg = Object.assign(
        {},
        coreLogMessage,
        {level, message},
        extraDetail
      );

      this._consoleLog(`writing to kinesis: ${JSON.stringify(fullMsg)}`);

      const options = {
        StreamName: this.streamName,
        PartitionKey: 'logs',
        Data: JSON.stringify(fullMsg)
      };

      this.kinesis.putRecord(options, err => {
        if (err) {
          reject(err);
        } else {
          resolve(fullMsg);
        }
      });
    });
  }
}

module.exports = ELKKinesisLogger;
