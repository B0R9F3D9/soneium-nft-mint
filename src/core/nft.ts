import { NFT_ABI } from '@/abi/nft';
import { CONFIG } from '@/config';
import type { Wallet } from '@/core/wallet';
import { logger } from '@/lib/logger';
import { isValidAddress } from '@/lib/utils';

export class Nft {
	private wallet: Wallet;

	constructor(wallet: Wallet) {
		this.wallet = wallet;
	}

	async claimNfts(count: number, receiver: string) {
		try {
			if (!isValidAddress(receiver, this.wallet.web3))
				throw new Error('Invalid receiver address');

			logger.info(`${this.wallet.info} Claiming ${count} NFTs...`);

			const contract = new this.wallet.web3.eth.Contract(
				NFT_ABI,
				CONFIG.NFT_ADDRESS,
			);
			const data = contract.methods
				.claim(
					this.wallet.web3.utils.toChecksumAddress(receiver),
					count,
					CONFIG.ASTR_ADDRESS,
					10 * 10 ** 18,
					[
						[
							'0x0000000000000000000000000000000000000000000000000000000000000000',
						],
						2,
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
