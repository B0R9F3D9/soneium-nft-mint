import { input, select, Separator } from '@inquirer/prompts';

import { CONFIG } from '@/config';
import { Checker, type Wallet } from '@/core';
import { Nft } from '@/core/nft';

import { randomFloat } from './utils';

async function multiSender(wallets: Wallet[]) {
	if (wallets.length === 1) throw new Error('Add at least two wallets');

	const token: 'ETH' | 'ASTR' = await select({
		message: 'Select token:',
		choices: [
			{ value: 'ETH', name: '1️⃣ ETH' },
			{ value: 'ASTR', name: '2️⃣ ASTR' },
		],
	});

	const senderWallets = await selectWallets(wallets);
	if (senderWallets.length > 1) throw new Error('Select only one wallet');
	const senderWallet = senderWallets[0];
	const walletsToSend = await selectWallets(
		wallets.filter(wallet => wallet.address !== senderWallet.address),
	);

	const minAmount = await input({
		message: `Enter min amount of ${token}:`,
		validate: value => Number(value) > 0,
	});
	const maxAmount = await input({
		message: `Enter max amount of ${token}:`,
		validate: value => Number(value) > Number(minAmount),
	});

	for (const wallet of walletsToSend) {
		const amount = randomFloat(Number(minAmount), Number(maxAmount));
		if (token === 'ETH')
			await senderWallet.transferEth(wallet.address, amount * 10 ** 18);
		if (token === 'ASTR')
			await senderWallet.transferToken(
				CONFIG.ASTR_ADDRESS,
				wallet.address,
				amount,
			);
	}
}

async function claimNfts(wallets: Wallet[]) {
	const receiver = await input({
		message: 'Enter receiver address:',
	});
	const count = await input({
		message: 'Enter number of NFTs to claim (min: 1, max: 2):',
		validate: value => {
			const num = Number(value);
			return num >= 1 && num <= 2;
		},
	});
	await Promise.all(
		wallets.map(wallet => new Nft(wallet).claimNfts(Number(count), receiver)),
	);
}

export async function showMenu(wallets: Wallet[]): Promise<boolean> {
	const module = await select({
		message: 'Select module:',
		choices: [
			{ value: 'multisender', name: '💰 MultiSender' },
			{ value: 'claim-nfts', name: '🎁 Claim NFTs' },
			{ value: 'checker', name: '📊 Checker' },
			new Separator(),
			{ value: 'back', name: '🔙 Back to wallet selection' },
			{ value: 'exit', name: '❌ Exit' },
		],
	});

	if (module === 'multisender') await multiSender(wallets);
	else if (module === 'claim-nfts') await claimNfts(wallets);
	else if (module === 'checker') await new Checker(wallets).run();
	else if (module === 'back') return true;
	else if (module === 'exit') process.exit(0);
	return false;
}

export async function selectWallets(wallets: Wallet[]): Promise<Wallet[]> {
	async function getUserInput(prompt: string): Promise<string> {
		return new Promise(resolve => {
			process.stdout.write(prompt);
			process.stdin.once('data', data => resolve(data.toString().trim()));
		});
	}

	function parseSelection(input: string, wallets: Wallet[]): Wallet[] {
		if (input === 'all' || input === '') return wallets;
		if (input.includes(','))
			return input.split(',').map(i => wallets[parseInt(i) - 1]);
		if (input.includes('-')) {
			const [start, end] = input.split('-').map(Number);
			return wallets.slice(start - 1, end);
		}
		return [wallets[parseInt(input) - 1]];
	}

	if (CONFIG.USE_CHECKER) await new Checker(wallets).run();
	if (wallets.length === 1) return wallets;

	console.log(
		'Select wallet or wallets:\n1 — first\n1,2,3 — multiple\n1-3 — range\nall — all (or Enter)\n',
	);
	const input = await getUserInput('Enter choice: ');
	return parseSelection(input, wallets);
}
