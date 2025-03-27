import { select } from '@inquirer/prompts';
import { existsSync } from 'fs';

import { showMenu, Wallet } from '@/core';
import { logger } from '@/lib/logger';
import { readPrivateKeys, writePrivateKeys } from '@/lib/utils';

import { CONFIG } from './constants/config';

async function checkDuplicates(keys: string[]) {
	const uniqKeys = new Set(keys);
	if (uniqKeys.size < keys.length) {
		logger.info(`Keys list contains ${keys.length - uniqKeys.size} duplicates`);
		const answer = await select({
			message: `Do you want to remove them?`,
			choices: [
				{ value: 'yes', name: 'Yes' },
				{ value: 'no', name: 'No' },
			],
		});
		if (answer === 'yes') {
			writePrivateKeys(Array.from(uniqKeys));
			logger.info('Duplicates removed. Please restart the script.');
			process.exit(0);
		}
	}
}

async function main() {
	logger.info('-'.repeat(50));
	console.clear();

	if (!existsSync(CONFIG.KEYS_PATH))
		return logger.error('Fill in the keys list!');
	if (!existsSync(CONFIG.SETTINGS_PATH))
		return logger.error('Fill in the settings file!');

	const KEYS = readPrivateKeys();
	await checkDuplicates(KEYS);
	const wallets = KEYS.map((key, i) => new Wallet(i + 1, key));
	if (!wallets.length) {
		return logger.error('Fill in the keys list!');
	}

	while (true) {
		try {
			await showMenu(wallets);
		} catch (error) {
			return logger.error(
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}
}

main();
