declare namespace ELKKinesisLogger {
  export interface ELKKinesisLoggerConstructorOptions { 
    stage: string, stack: string, app: string, streamName: string, verbose: boolean = true 
  }
}

declare class ELKKinesisLogger<ExtraDetail = Object> {
  constructor(options: ELKKinesisLoggerConstructorOptions)
  
  withRole(role: string): ELKKinesisLogger
  withProfile(profile: string): ELKKinesisLogger
  withRegion(region: string): ELKKinesisLogger

  log(message: string, extraDetail: ExtraDetail): ELKKinesisLogger
  error(message: string, extraDetail: ExtraDetail): ELKKinesisLogger

  open(): ELKKinesisLogger
  close(): Promise<({ stage: string, stack: string, app: string, timestamp: Date; level: 'INFO' | 'ERROR'; message: string } & ExtraDetail)[]>
}

export = ELKKinesisLogger

