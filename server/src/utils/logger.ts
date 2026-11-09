export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private format(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    let metaString = '';
    if (meta) {
      if (meta instanceof Error) {
        metaString = ` - ${meta.message} (code: ${(meta as any).errorCode || (meta as any).code || 'N/A'})`;
      } else {
        metaString = ` ${JSON.stringify(meta)}`;
      }
    }
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  info(message: string, meta?: any): void {
    console.log(this.format(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.format(LogLevel.WARN, message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.format(LogLevel.ERROR, message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();

