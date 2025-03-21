import Table from 'cli-table3';
import { existsSync } from 'fs';

import { CONFIG } from '@/config';
import type { Wallet } from '@/core/wallet';
import type { IChecker } from '@/types/checker';

import { mkdir, writeFile } from 'fs/promises';

export class Checker {
	private readonly headers: string[] = [
		'#',
		'Address',
		'ETH Balance',
		'ASTR Balance',
		'NFT Balance',
	];

	constructor(public wallets: Wallet[]) {}

	async checkWallet(wallet: Wallet): Promise<IChecker> {
		const ethBalance = await wallet.getEthBalance();
		const astrBalance = await wallet.getTokenBalance(CONFIG.ASTR_ADDRESS);
		const nftBalance = await wallet.getTokenBalance(CONFIG.NFT_ADDRESS);
		return {
			index: wallet.index,
			address: wallet.address,
			ethBalance: (ethBalance / 1e18).toFixed(6),
			astrBalance: (astrBalance / 1e18).toFixed(1),
			nftBalance: nftBalance.toFixed(0),
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

		results.forEach(r => {
			table.push(Object.values(r));
		});
		console.log(table.toString());
	}

	private async saveResults(results: IChecker[]) {
		const dir = './checker';
		if (!existsSync(dir)) await mkdir(dir);

		const headers = this.headers.join(',');
		const rows = results.map(r => Object.values(r).join(',')).join('\n');

		const timestamp = new Date().toLocaleString().replace(/[/,: ]/g, '-');
		await writeFile(`${dir}/${timestamp}.csv`, headers + '\n' + rows);
	}

	public async run() {
		const results = await Promise.all(
			this.wallets.map(wallet => this.checkWallet(wallet)),
		);
		this.printTable(results);
		await this.saveResults(results);
	}
}
