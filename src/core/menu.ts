import { select } from '@inquirer/prompts';

import { Checker, type Wallet } from '@/core';
import {
	claimNfts,
	multiSender,
	tokenCollector,
	walletsGenerator,
} from '@/core/modules';

export async function showMenu(wallets: Wallet[]) {
	await new Checker(wallets).run();

	const module = await select({
		message: 'Select module:',
		choices: [
			{ value: 'multi-sender', name: '💰 Multi Sender' },
			{ value: 'claim-nfts', name: '🎁 Claim NFTs' },
			{ value: 'token-collector', name: '💥 Token Collector' },
			{ value: 'wallets-generator', name: '👛 Generate Wallets' },
			{ value: 'checker', name: '📊 Checker' },
			{ value: 'exit', name: '❌ Exit' },
		],
	});

	if (module === 'multi-sender') await multiSender(wallets);
	else if (module === 'claim-nfts') await claimNfts(wallets);
	else if (module === 'token-collector') await tokenCollector(wallets);
	else if (module === 'wallets-generator') await walletsGenerator();
	else if (module === 'checker') await new Checker(wallets).run();
	else if (module === 'exit') process.exit(0);
}
