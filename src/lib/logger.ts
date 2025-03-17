import * as fs from 'fs';
import type { TransformableInfo } from 'logform';
import * as path from 'path';
import * as winston from 'winston';

const customFormat = winston.format.printf(
	(info: TransformableInfo): string => {
		const { level, message, timestamp } = info;
		return `${timestamp} | ${level} | ${message}`;
	},
);

const logDir = './logs';
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			level: 'debug',
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.splat(),
				winston.format.timestamp({ format: 'HH:mm:ss' }),
				customFormat,
			),
		}),
		new winston.transports.File({
			filename: path.join(
				logDir,
				`${new Date().toISOString().split('T')[0]}.log`,
			),
			level: 'silly',
			format: winston.format.combine(
				winston.format.splat(),
				winston.format.timestamp({ format: 'HH:mm:ss' }),
				customFormat,
			),
		}),
	],
});
