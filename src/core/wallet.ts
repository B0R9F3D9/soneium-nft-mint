import { type Transaction, Web3 } from 'web3';

import { ERC20_ABI } from '@/abi/erc20';
import { CONFIG } from '@/config';
import { logger } from '@/lib/logger';
import { isValidAddress, randomFloat, sleep } from '@/lib/utils';

export class Wallet {
	public web3: Web3;
	public address: string;
	public info: string;
	public index: number;
	private privateKey: string;
	private chainId!: number;

	constructor(index: number, privateKey: string) {
		this.web3 = new Web3(CONFIG.RPC_URL);
		const acc = this.web3.eth.accounts.privateKeyToAccount(privateKey);
		this.privateKey = acc.privateKey;
		this.index = index;
		this.address = acc.address;
		this.info = `[№${index} - ${this.address.slice(0, 5)}...${this.address.slice(-5)}]`;
		this.initialize();
	}

	private async initialize(): Promise<void> {
		this.chainId = await this.web3.eth.getChainId().then(Number);
	}

	async getEthBalance(): Promise<number> {
		try {
			return Number(await this.web3.eth.getBalance(this.address));
		} catch (error) {
			throw new Error('Failed to get ETH balance: ' + (error as Error).message);
		}
	}

	async getTokenBalance(tokenAddress: string): Promise<number> {
		try {
			if (!isValidAddress(tokenAddress, this.web3))
				throw new Error('Invalid token address');
			const contract = new this.web3.eth.Contract(
				ERC20_ABI,
				this.web3.utils.toChecksumAddress(tokenAddress),
			);
			return Number(await contract.methods.balanceOf(this.address).call());
		} catch (error) {
			throw new Error(
				'Failed to get token balance: ' + (error as Error).message,
			);
		}
	}

	async getTxData(
		to: string,
		value: number = 0,
		data: string = '0x',
	): Promise<Transaction> {
		try {
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');
			return {
				from: this.address,
				to: this.web3.utils.toChecksumAddress(to),
				data,
				value,
				gasPrice: Math.floor(
					Number(await this.web3.eth.getGasPrice()) *
						randomFloat(...CONFIG.GAS_MULTIPLIER),
				),
				nonce: await this.web3.eth.getTransactionCount(this.address, 'pending'),
				chainId: this.chainId,
			};
		} catch (error) {
			throw new Error('Failed to get tx data: ' + (error as Error).message);
		}
	}

	async sendTx(txData: Transaction): Promise<string> {
		try {
			txData.gas = await this.web3.eth.estimateGas(txData);
			const signed = await this.web3.eth.accounts.signTransaction(
				txData,
				this.privateKey,
			);
			const txHash = await this.web3.eth.sendSignedTransaction(
				signed.rawTransaction,
			);
			return this.waitTx(txHash.transactionHash.toString());
		} catch (error) {
			throw new Error('Failed to send tx: ' + (error as Error).message);
		}
	}

	private async waitTx(txHash: string): Promise<string> {
		const startTime = Date.now();
		while (true) {
			try {
				const receipt = await this.web3.eth.getTransactionReceipt(txHash);
				const status = Number(receipt.status);
				if (status === 1) {
					logger.info(`${this.info} Tx successful: ${txHash}`);
					return txHash;
				} else if (status === 0) {
					throw new Error(`Tx failed: ${txHash}`);
				}
				await sleep(500);
			} catch (e) {
				if (e instanceof Error && e.message.includes('not found')) {
					if (Date.now() - startTime > 45000) {
						throw new Error(`Tx not found: ${txHash}`);
					}
					await sleep(1000);
				} else {
					throw e;
				}
			}
		}
	}

	async approve(
		tokenAddress: string,
		spender: string,
		amount: string = String(2n ** 256n - 1n),
	): Promise<string> {
		try {
			if (!isValidAddress(tokenAddress, this.web3))
				throw new Error('Invalid token address');
			if (!isValidAddress(spender, this.web3))
				throw new Error('Invalid spender address');

			const contract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
			const allowance = String(
				await contract.methods.allowance(this.address, spender).call(),
			);
			if (BigInt(allowance) >= BigInt(amount)) {
				logger.info(`${this.info} Approve already exists for ${spender}`);
				return '';
			}

			const data = contract.methods.approve(spender, amount).encodeABI();
			return this.sendTx(await this.getTxData(tokenAddress, 0, data));
		} catch (error) {
			throw new Error('Failed to approve: ' + (error as Error).message);
		}
	}

	async transferEth(to: string, amount: number) {
		try {
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');

			const result = await this.sendTx(await this.getTxData(to, amount));
			if (result)
				logger.info(
					`${this.info} ${(amount / 10 ** 18).toFixed(6)} ETH sent successfully`,
				);
			else throw new Error();
		} catch (error) {
			throw new Error('Failed to transfer ETH: ' + (error as Error).message);
		}
	}

	async transferToken(tokenAddress: string, to: string, amount: number) {
		try {
			if (!isValidAddress(tokenAddress, this.web3))
				throw new Error('Invalid token address');
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');

			const contract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
			const data = contract.methods.transfer(to, amount).encodeABI();
			const result = await this.sendTx(
				await this.getTxData(tokenAddress, 0, data),
			);
			if (result)
				logger.info(
					`${this.info} ${amount}(wei) ${tokenAddress} sent successfully`,
				);
			else throw new Error();
		} catch (error) {
			throw new Error('Failed to transfer token: ' + (error as Error).message);
		}
	}
}
