import { pino, TransportTargetOptions } from 'pino';

const development = process.env.NODE_ENV === 'development';
const logtailToken = process.env.LOGTAIL_API_TOKEN || '';

const transportTargets: TransportTargetOptions[] = [];

if (development) {
  transportTargets.push(
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
    {
      target: 'pino/file',
      options: {
        destination: 'logs/log.txt',
        mkdir: true,
      },
    }
  );
} else {
  transportTargets.push({
    target: '@logtail/pino',
    options: {
      sourceToken: logtailToken,
    },
  });
}

const transport = pino.transport({
  targets: transportTargets,
});

export default pino(transport);
