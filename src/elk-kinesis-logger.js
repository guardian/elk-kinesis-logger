const AWS = require('aws-sdk');

class ELKKinesisLogger {
  constructor({ stage, stack, app, streamName, verbose = true }) {
    this.stage = stage;
    this.stack = stack;
    this.app = app;
    this.streamName = streamName;
    this.verbose = verbose;
  }

  withRole(roleArn) {
    this.roleArn = roleArn;
    return this;
  }

  get _name() {
    return this.constructor.name;
  }

  _openWithoutRole() {
    return Promise.resolve(new AWS.Kinesis());
  }

  _openWithRole() {
    const sts = new AWS.STS();

    const options = {
      RoleArn: this.roleArn,
      RoleSessionName: this.app
    };

    return sts.assumeRole(options).promise().then(data => {
      return new AWS.Kinesis({
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken
      });
    });
  }

  open() {
    const openPromise = this.roleArn
      ? this._openWithRole()
      : this._openWithoutRole();

    return openPromise.then(kinesis => {
      this.kinesis = kinesis;
      this._logLines = [];
      return this;
    });
  }

  close() {
    this._consoleLog(`ensuring ${this._logLines.length} log lines are written`);
    return Promise.all(this._logLines);
  }

  log(message, extraDetail) {
    this._ensureOpened();
    this._logLines.push(
      this._putRecord({ level: 'INFO', message, extraDetail })
    );
    return this;
  }

  error(message, extraDetail) {
    this._ensureOpened();
    this._logLines.push(
      this._putRecord({ level: 'ERROR', message, extraDetail })
    );
    return this;
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

  _putRecord({ level, message, extraDetail = {} }) {
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
        { level, message },
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
