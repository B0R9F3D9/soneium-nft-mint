import { input, select } from '@inquirer/prompts';

import { SETTINGS } from '@/constants/settings';
import { TOKENS } from '@/constants/tokens';
import type { Wallet } from '@/core';
import { Nft } from '@/core/nft';
import { logger } from '@/lib/logger';
import { randomFloat, runInBatches, sleep } from '@/lib/utils';

export async function claimNfts(wallets: Wallet[]) {
	const mode = await select({
		message: 'Select mode:',
		choices: [
			{ value: 'approve', name: 'Only Approve' },
			{ value: 'all', name: 'Approve & Claim' },
		],
	});

	const receiver =
		mode === 'approve'
			? ''
			: await input({ message: 'Enter receiver address:' });

	const processWallet = async (wallet: Wallet) => {
		try {
			if (mode === 'approve') {
				await wallet.approve(TOKENS.ASTR, TOKENS.NFT.address);
			} else {
				await new Nft(wallet).claim(SETTINGS.CLAIM_NFT_AMOUNT, receiver);
			}
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
