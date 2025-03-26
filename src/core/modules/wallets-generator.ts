import { input } from '@inquirer/prompts';

import { Wallet } from '@/core';
import { logger } from '@/lib/logger';
import { addPrivateKeys } from '@/lib/utils';

export async function walletsGenerator() {
	const count = await input({
		message: 'Enter number of wallets to generate:',
		validate: value => Number(value) > 0,
	}).then(Number);

	const wallets = await Promise.all(
		Array(count)
			.fill(null)
			.map(() => Wallet.generate()),
	);

	addPrivateKeys(wallets.map(wallet => wallet.privateKey));
	logger.info(`Successfully generated and saved ${count} wallets`);
	process.exit(0);
}
