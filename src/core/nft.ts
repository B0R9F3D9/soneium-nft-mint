import axios from 'axios';

import { NFT_ABI } from '@/abi/nft';
import { CONFIG } from '@/config';
import type { Wallet } from '@/core/wallet';
import { logger } from '@/lib/logger';
import { isValidAddress } from '@/lib/utils';
import type { NftResponse } from '@/types/nft';

export class Nft {
	private wallet: Wallet;

	constructor(wallet: Wallet) {
		this.wallet = wallet;
	}

	async getNfts() {
		const response = await axios.get<NftResponse>(
			`https://soneium.blockscout.com/api/v2/addresses/${this.wallet.address}/nft`,
			{ params: { type: 'ERC-721' } },
		);

		if (response.status !== 200) throw new Error('Failed to get NFTs');

		return response.data.items
			.filter(item => item.token.address === CONFIG.NFT_ADDRESS)
			.map(item => Number(item.id));
	}

	async sendNft(nftId: number, to: string) {
		if (!isValidAddress(to, this.wallet.web3))
			throw new Error('Invalid receiver address');

		try {
			logger.info(`${this.wallet.info} Sending NFT #${nftId} to ${to}`);

			const contract = new this.wallet.web3.eth.Contract(
				NFT_ABI,
				CONFIG.NFT_ADDRESS,
			);
			const data = contract.methods
				.safeTransferFrom(
					this.wallet.address,
					this.wallet.web3.utils.toChecksumAddress(to),
					nftId,
					'0x',
				)
				.encodeABI();

			const result = await this.wallet.sendTx(
				await this.wallet.getTxData(CONFIG.NFT_ADDRESS, 0, data),
			);
			if (result)
				logger.info(`${this.wallet.info} NFT #${nftId} sent successfully`);
			else throw new Error();
		} catch (error) {
			logger.error(
				`${this.wallet.info} Failed to send NFT: ${(error as Error).message}`,
			);
		}
	}

	async sendAllNfts(to: string) {
		const nftIds = await this.getNfts();
		await Promise.all(nftIds.map(nftId => this.sendNft(nftId, to)));
	}

	async claimNfts(count: number) {
		try {
			logger.info(`${this.wallet.info} Claiming ${count} NFTs...`);

			const contract = new this.wallet.web3.eth.Contract(
				NFT_ABI,
				CONFIG.NFT_ADDRESS,
			);
			const data = contract.methods
				.claim(
					this.wallet.address,
					count,
					CONFIG.ASTR_ADDRESS,
					10 * 10 ** 18,
					[
						[
							'0x0000000000000000000000000000000000000000000000000000000000000000',
						],
						count,
						10 * 10 ** 18,
						CONFIG.ASTR_ADDRESS,
					],
					'0x',
				)
				.encodeABI();

			const result = await this.wallet.sendTx(
				await this.wallet.getTxData(CONFIG.NFT_ADDRESS, 0, data),
			);
			if (result)
				logger.info(`${this.wallet.info} ${count} NFTs successfully claimed`);
			else throw new Error();
		} catch (error) {
			logger.error(
				`${this.wallet.info} Failed to claim ${count} NFT: ${(error as Error).message}`,
			);
		}
	}
}
