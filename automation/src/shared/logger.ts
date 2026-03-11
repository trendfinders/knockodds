type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, job: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, job, message, ...(data ? { data } : {}) };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function createLogger(job: string) {
  return {
    info: (message: string, data?: any) => log('info', job, message, data),
    warn: (message: string, data?: any) => log('warn', job, message, data),
    error: (message: string, data?: any) => log('error', job, message, data),
    debug: (message: string, data?: any) => log('debug', job, message, data),
  };
}
