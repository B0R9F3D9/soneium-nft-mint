import { input, select } from '@inquirer/prompts';

import { SETTINGS } from '@/constants/settings';
import { TOKENS } from '@/constants/tokens';
import type { Wallet } from '@/core';
import { logger } from '@/lib/logger';
import { randomFloat, randomInt, sleep } from '@/lib/utils';

export async function multiSender(wallets: Wallet[]) {
	if (wallets.length === 1) throw new Error('Add at least two wallets');

	const token = (await select({
		message: 'Select token:',
		choices: [
			{ value: 'ETH', name: 'ETH' },
			{ value: 'ASTR', name: 'ASTR' },
		],
	})) as 'ETH' | 'ASTR';

	const senderWalletIndex = await input({
		message: 'Enter sender wallet index:',
		validate: value => Number(value) > 0 && Number(value) <= wallets.length,
	}).then(value => Number(value) - 1);

	const senderWallet = wallets[senderWalletIndex];
	const receivers = wallets.filter(
		wallet => wallet.address !== senderWallet.address,
	);

	for (const receiver of receivers) {
		try {
			if (token === 'ETH')
				await senderWallet.transferEth(
					receiver.address,
					randomFloat(...SETTINGS.MULTISEND_ETH_AMOUNT),
				);
			else if (token === 'ASTR')
				await senderWallet.transferToken(
					TOKENS.ASTR,
					receiver.address,
					randomFloat(...SETTINGS.MULTISEND_ASTR_AMOUNT),
				);
			if (receiver.address !== receivers.at(-1)?.address)
				await sleep(randomInt(...SETTINGS.SLEEP_TIME));
		} catch (e) {
			logger.error(`${senderWallet.info} ${e}`);
		}
	}
}
