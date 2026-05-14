import pino from 'pino';

const isProduction = Bun.env.NODE_ENV === 'production';

export const logger = pino({
    level: Bun.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    ...(isProduction
        ? {}
        : {
              msgPrefix: '[EmitSignal] ',
              redact: { paths: ['password', 'verificationToken'] },
              transport: {
                  options: {
                      colorize: true,
                      ignore: 'pid,hostname',
                      translateTime: 'HH:MM:ss.l',
                  },
                  target: 'pino-pretty',
              },
          }),
});
