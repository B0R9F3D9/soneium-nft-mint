import { input, select } from '@inquirer/prompts';

import { SETTINGS } from '@/constants/settings';
import { TOKENS } from '@/constants/tokens';
import type { Wallet } from '@/core';
import { logger } from '@/lib/logger';
import { randomFloat, runInBatches, sleep } from '@/lib/utils';

export async function tokenCollector(wallets: Wallet[]) {
	const token = (await select({
		message: 'Select token:',
		choices: [
			{ value: 'ETH', name: 'ETH' },
			{ value: 'ASTR', name: 'ASTR' },
			{ value: 'BOTH', name: 'ASTR & ETH' },
		],
	})) as 'ETH' | 'ASTR' | 'BOTH';

	const receiver = await input({
		message: 'Enter receiver address:',
	});

	const processWallet = async (wallet: Wallet) => {
		try {
			if (token === 'ASTR' || token === 'BOTH') {
				const astrBalance = await wallet.getTokenBalance(TOKENS.ASTR);
				if (astrBalance.amount > SETTINGS.COLLECTOR_MIN_ASTR_AMOUNT) {
					await wallet.transferAllToken(TOKENS.ASTR, receiver);
				}
			}
			if (token === 'ETH' || token === 'BOTH') {
				const ethBalance = await wallet.getEthBalance();
				if (ethBalance.amount > SETTINGS.COLLECTOR_MIN_ETH_AMOUNT) {
					await wallet.transferAllEth(receiver);
				}
			}
		} catch (error) {
			logger.error(`${wallet.info} ${error}`);
		}
	};

	const filteredWallets = wallets.filter(wallet => wallet.address !== receiver);

	if (SETTINGS.MODE === 'batch') {
		await runInBatches(filteredWallets, processWallet);
	} else {
		for (const [index, wallet] of filteredWallets.entries()) {
			await processWallet(wallet);
			if (index < filteredWallets.length - 1) {
				await sleep(randomFloat(...SETTINGS.SLEEP_TIME), wallet.info);
			}
		}
	}
}
