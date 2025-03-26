import { input, select } from '@inquirer/prompts';

import { SETTINGS } from '@/constants/settings';
import { TOKENS } from '@/constants/tokens';
import { Checker, Wallet } from '@/core';
import { Nft } from '@/core/nft';
import { logger } from '@/lib/logger';
import {
	addPrivateKeys,
	randomFloat,
	randomInt,
	sleep,
	writePrivateKeys,
} from '@/lib/utils';

export async function checkDuplicates(keys: string[]) {
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

export async function showMenu(wallets: Wallet[]) {
	await new Checker(wallets).run();

	const module = await select({
		message: 'Select module:',
		choices: [
			{ value: 'multi-sender', name: '💰 Multi Sender' },
			{ value: 'claim-nfts', name: '🎁 Claim NFTs' },
			{ value: 'token-collector', name: '💥 Token Collector' },
			{ value: 'generate-wallets', name: '👛 Generate Wallets' },
			{ value: 'checker', name: '📊 Checker' },
			{ value: 'exit', name: '❌ Exit' },
		],
	});

	if (module === 'multi-sender') await multiSender(wallets);
	else if (module === 'claim-nfts') await claimNfts(wallets);
	else if (module === 'token-collector') await tokenCollector(wallets);
	else if (module === 'generate-wallets') await generateWallets();
	else if (module === 'checker') await new Checker(wallets).run();
	else if (module === 'exit') process.exit(0);
}

async function multiSender(wallets: Wallet[]) {
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
				await sleep(randomInt(...SETTINGS.SLEEP_BETWEEN_WALLETS));
		} catch (e) {
			logger.error(`${senderWallet.info} ${e}`);
		}
	}
}

async function claimNfts(wallets: Wallet[]) {
	const mode = await select({
		message: 'Select mode:',
		choices: [
			{ value: 'approve', name: 'Only Approve' },
			{ value: 'claim', name: 'Only Claim' },
			{ value: 'all', name: 'Approve & Claim' },
		],
	});

	let receiver = '';
	if (mode !== 'approve') {
		receiver = await input({
			message: 'Enter receiver address:',
		});
	}

	for (const wallet of wallets) {
		try {
			if (mode === 'approve')
				await wallet.approve(TOKENS.ASTR, TOKENS.NFT.address);
			else await new Nft(wallet).claimNfts(SETTINGS.CLAIM_NFT_AMOUNT, receiver);
			if (wallet.address !== wallets.at(-1)?.address)
				await sleep(
					randomFloat(...SETTINGS.SLEEP_BETWEEN_WALLETS),
					wallet.info,
				);
		} catch (e) {
			logger.error(`${wallet.info} ${e}`);
		}
	}
}

async function tokenCollector(wallets: Wallet[]) {
	const token = (await select({
		message: 'Select token:',
		choices: [
			{ value: 'ETH', name: 'ETH' },
			{ value: 'ASTR', name: 'ASTR' },
		],
	})) as 'ETH' | 'ASTR';

	const receiver = await input({
		message: 'Enter receiver address:',
	});

	for (const wallet of wallets.filter(wallet => wallet.address !== receiver)) {
		try {
			if (token === 'ETH') {
				const balance = await wallet.getEthBalance();
				if (balance.amount > SETTINGS.COLLECTOR_MIN_ETH_AMOUNT)
					await wallet.transferAllEth(receiver);
			} else if (token === 'ASTR') {
				const balance = await wallet.getTokenBalance(TOKENS.ASTR);
				if (balance.amount > SETTINGS.COLLECTOR_MIN_ASTR_AMOUNT)
					await wallet.transferAllToken(TOKENS.ASTR, receiver);
			}
			if (wallet.address !== wallets.at(-1)?.address)
				await sleep(
					randomFloat(...SETTINGS.SLEEP_BETWEEN_WALLETS),
					wallet.info,
				);
		} catch (e) {
			logger.error(`${wallet.info} ${e}`);
		}
	}
}

async function generateWallets() {
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
	logger.info(`Successfully generated ${count} wallets`);
	process.exit(0);
}
