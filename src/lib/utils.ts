import { readFileSync, writeFileSync } from 'fs';
import type Web3 from 'web3';

import { CONFIG } from '@/constants/config';
import { SETTINGS } from '@/constants/settings';

import { logger } from './logger';

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function sleep(s: number, info?: string) {
	if (s <= 0) return;
	const message = info
		? `${info} Sleeping for ${s.toFixed(2)} seconds...`
		: `Sleeping for ${s.toFixed(2)} seconds...`;
	logger.info(message);
	return new Promise(resolve => setTimeout(resolve, s * 1000));
}

export function isValidAddress(address: string, web3: Web3): boolean {
	try {
		web3.utils.toChecksumAddress(address);
		return true;
	} catch {
		return false;
	}
}

export function readPrivateKeys(): string[] {
	return readFileSync(CONFIG.KEYS_PATH, 'utf-8')
		.split('\n')
		.filter(line => line.trim());
}

export function writePrivateKeys(keys: string[]) {
	writeFileSync(CONFIG.KEYS_PATH, keys.join('\n'));
}

export function addPrivateKeys(newKeys: string[]) {
	writePrivateKeys([...readPrivateKeys(), ...newKeys]);
}

export async function runInBatches<T>(
	items: T[],
	callback: (item: T) => Promise<void>,
) {
	const batches = Array(Math.ceil(items.length / SETTINGS.BATCH_SIZE))
		.fill(null)
		.map((_, i) =>
			items.slice(i * SETTINGS.BATCH_SIZE, (i + 1) * SETTINGS.BATCH_SIZE),
		);

	for (let i = 0; i < batches.length; i++) {
		await Promise.all(batches[i].map(callback));
		if (i < batches.length - 1) {
			await sleep(randomFloat(...SETTINGS.SLEEP_TIME));
		}
	}
}
