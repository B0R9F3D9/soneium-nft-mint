import Table from 'cli-table3';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

import { TOKENS } from '@/constants/tokens';
import type { Wallet } from '@/core/wallet';
import type { IChecker } from '@/types/checker';
import type { IToken } from '@/types/token';

export class Checker {
	private readonly headers: string[] = [
		'#',
		'Address',
		'ETH Balance',
		'ASTR Balance',
		'NFT',
	];

	constructor(public wallets: Wallet[]) {}

	async getTokenBalance(wallet: Wallet, token: IToken) {
		const balance = await wallet.getTokenBalance(token);
		return balance.logAmount;
	}

	async checkWallet(wallet: Wallet): Promise<IChecker> {
		const [ethBalance, astrBalance, nftBalance] = await Promise.all([
			wallet.getEthBalance(),
			this.getTokenBalance(wallet, TOKENS.ASTR),
			this.getTokenBalance(wallet, TOKENS.NFT),
		]);
		return {
			index: wallet.index,
			address: wallet.address,
			ethBalance: ethBalance.logAmount,
			astrBalance,
			nftBalance,
		};
	}

	private printTable(results: IChecker[]) {
		const table = new Table({
			head: this.headers,
			chars: {
				top: '─',
				'top-mid': '┬',
				'top-left': '╭',
				'top-right': '╮',
				bottom: '─',
				'bottom-mid': '┴',
				'bottom-left': '╰',
				'bottom-right': '╯',
				left: '│',
				'left-mid': '├',
				mid: '─',
				'mid-mid': '┼',
				right: '│',
				'right-mid': '┤',
				middle: '│',
			},
		});

		const addressCount = new Map<string, number>();
		results.forEach(r =>
			addressCount.set(r.address, (addressCount.get(r.address) || 0) + 1),
		);
		results.forEach(r =>
			table.push([
				r.index,
				addressCount.get(r.address)! > 1
					? `\x1b[31m${r.address}\x1b[0m`
					: r.address,
				r.ethBalance,
				r.astrBalance,
				r.nftBalance,
			]),
		);
		console.log(table.toString());
	}

	private saveResults(results: IChecker[]) {
		const dir = './checker';
		if (!existsSync(dir)) mkdirSync(dir);

		const headers = this.headers.join(',');
		const rows = results.map(r => Object.values(r).join(',')).join('\n');

		const timestamp = new Date().toLocaleString().replace(/[/,: ]/g, '-');
		writeFileSync(`${dir}/${timestamp}.csv`, headers + '\n' + rows);
	}

	public async run() {
		const results = await Promise.all(
			this.wallets.map(wallet => this.checkWallet(wallet)),
		);
		this.printTable(results);
		this.saveResults(results);
	}
}
