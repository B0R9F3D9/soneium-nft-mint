import { SETTINGS } from '@/constants/settings';
import type { Wallet } from '@/core';
import { logger } from '@/lib/logger';
import { randomFloat, runInBatches, sleep } from '@/lib/utils';

export async function unbug(wallets: Wallet[]) {
	const processWallet = async (wallet: Wallet) => {
		try {
			await wallet.transferEth(
				wallet.address,
				randomFloat(0.000001, 0.00001),
			);
		} catch (error) {
			logger.error(`${wallet.info} ${error}`);
		}
	};

	if (SETTINGS.MODE === 'batch') {
		await runInBatches(wallets, processWallet);
	} else {
		for (const [index, wallet] of wallets.entries()) {
			await processWallet(wallet);
			if (index < wallets.length - 1) {
				await sleep(randomFloat(...SETTINGS.SLEEP_TIME), wallet.info);
			}
		}
	}
}
