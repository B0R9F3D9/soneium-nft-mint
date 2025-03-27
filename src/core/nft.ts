import { NFT_ABI } from '@/constants/abi/nft';
import { TOKENS } from '@/constants/tokens';
import type { Wallet } from '@/core/wallet';
import { logger } from '@/lib/logger';
import { isValidAddress } from '@/lib/utils';

export class Nft {
	private wallet: Wallet;

	constructor(wallet: Wallet) {
		this.wallet = wallet;
	}

	async claim(count: number, receiver: string) {
		try {
			if (!isValidAddress(receiver, this.wallet.web3))
				throw new Error('Invalid receiver address');

			await this.wallet.approve(TOKENS.ASTR, TOKENS.NFT.address);

			logger.info(`${this.wallet.info} Claiming ${count} NFTs...`);

			const contract = new this.wallet.web3.eth.Contract(
				NFT_ABI,
				TOKENS.NFT.address,
			);
			const data = contract.methods
				.claim(
					this.wallet.web3.utils.toChecksumAddress(receiver),
					count,
					TOKENS.ASTR.address,
					10 * 10 ** 18,
					[
						[
							'0x0000000000000000000000000000000000000000000000000000000000000000',
						],
						2,
						10 * 10 ** 18,
						TOKENS.ASTR.address,
					],
					'0x',
				)
				.encodeABI();

			const result = await this.wallet.sendTx(
				await this.wallet.getTxData(TOKENS.NFT.address, 0, data),
			);
			if (result)
				logger.info(`${this.wallet.info} Successfully claimed ${count} NFTs`);
			else throw new Error();
		} catch (error) {
			throw new Error('Failed to claim NFT: ' + (error as Error).message);
		}
	}
}
