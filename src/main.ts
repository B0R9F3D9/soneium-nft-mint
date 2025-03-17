import fs from 'fs';

import { Wallet } from '@/core';
import { logger } from '@/lib/logger';
import { selectWallets, showMenu } from '@/lib/menu';

(async () => {
	logger.info('-'.repeat(50));
	console.clear();

	const KEYS = fs
		.readFileSync('./data/keys.txt', 'utf-8')
		.split('\n')
		.map(key => key.trim())
		.filter(Boolean);
	let wallets = KEYS.map((key, i) => new Wallet(i + 1, key));
	if (!wallets.length) {
		return logger.error('Fill in the keys list!');
	}
	wallets = await selectWallets(wallets);

	while (true) {
		try {
			if (await showMenu(wallets)) wallets = await selectWallets(wallets);
		} catch (error) {
			return logger.error(
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}
})();
