import { existsSync } from 'fs';

import { Wallet } from '@/core';
import { checkDuplicates, showMenu } from '@/core/menu';
import { logger } from '@/lib/logger';

import { readPrivateKeys } from './lib/utils';

(async () => {
	logger.info('-'.repeat(50));
	console.clear();

	if (!existsSync('./data/keys.txt'))
		return logger.error('Fill in the keys list!');
	if (!existsSync('./data/settings.json'))
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
})();
