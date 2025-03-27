import { type Numbers, type Transaction, Web3 } from 'web3';

import { ERC20_ABI } from '@/constants/abi/erc20';
import { CONFIG } from '@/constants/config';
import { SETTINGS } from '@/constants/settings';
import { logger } from '@/lib/logger';
import { isValidAddress, randomFloat } from '@/lib/utils';
import type { IToken } from '@/types/token';

export class Wallet {
	public web3: Web3;
	public address: string;
	public info: string;
	public index: number;
	private privateKey: string;

	constructor(index: number, privateKey: string) {
		this.web3 = new Web3(CONFIG.RPC_URL);
		const acc = this.web3.eth.accounts.privateKeyToAccount(privateKey);
		this.privateKey = acc.privateKey;
		this.index = index;
		this.address = acc.address;
		this.info = `[№${index} - ${this.address.slice(0, 5)}...${this.address.slice(-5)}]`;
	}

	public static generate() {
		return new Web3().eth.accounts.create();
	}

	async getEthBalance() {
		try {
			const wei = BigInt(await this.web3.eth.getBalance(this.address));
			const amount = Number(wei) / 10 ** 18;
			return { wei, amount, logAmount: amount.toFixed(6) };
		} catch (error) {
			throw new Error(`Failed to get ETH balance: ${error as Error}`);
		}
	}

	async getTokenBalance(token: IToken) {
		try {
			const contract = new this.web3.eth.Contract(ERC20_ABI, token.address);
			const wei = BigInt(await contract.methods.balanceOf(this.address).call());
			const amount = Number(wei) / 10 ** token.decimals;
			return { wei, amount, logAmount: amount.toFixed(token.logDecimals) };
		} catch (error) {
			throw new Error(
				`Failed to get ${token.symbol} balance: ${error as Error}`,
			);
		}
	}

	async getTxData(
		to: string,
		value: Numbers = 0,
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
						randomFloat(...SETTINGS.GAS_MULTIPLIER),
				),
				nonce: await this.web3.eth.getTransactionCount(this.address, 'pending'),
				chainId: CONFIG.CHAIN_ID,
			};
		} catch (error) {
			throw new Error('Failed to get tx data: ' + (error as Error));
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
			throw new Error('Failed to send tx: ' + (error as Error));
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
				await new Promise(resolve => setTimeout(resolve, 1000));
			} catch (e) {
				if (e instanceof Error && e.message.includes('not found')) {
					if (Date.now() - startTime > 45000) {
						throw new Error(`Tx not found: ${txHash}`);
					}
					await new Promise(resolve => setTimeout(resolve, 1000));
				} else {
					throw e;
				}
			}
		}
	}

	async approve(
		token: IToken,
		spender: string,
		amount: string = String(2n ** 256n - 1n),
	) {
		try {
			if (!isValidAddress(spender, this.web3))
				throw new Error('Invalid spender address');

			const contract = new this.web3.eth.Contract(ERC20_ABI, token.address);
			const allowance = String(
				await contract.methods.allowance(this.address, spender).call(),
			);
			if (BigInt(allowance) >= BigInt(amount)) {
				return logger.info(
					`${this.info} ${token.symbol} token approve already exists`,
				);
			}

			logger.info(
				`${this.info} Approving ${
					amount === String(2n ** 256n - 1n)
						? 'max'
						: Number(amount).toFixed(token.logDecimals)
				} ${token.symbol} for ${spender}`,
			);

			const data = contract.methods.approve(spender, amount).encodeABI();
			await this.sendTx(await this.getTxData(token.address, 0, data));

			logger.info(
				`${this.info} Successfully approved ${
					amount === String(2n ** 256n - 1n)
						? 'max'
						: Number(amount).toFixed(token.logDecimals)
				} ${token.symbol} for ${spender}`,
			);
		} catch (error) {
			throw new Error('Failed to approve: ' + (error as Error));
		}
	}

	async transferToken(token: IToken, to: string, amount: number) {
		try {
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');

			logger.info(
				`${this.info} Sending ${amount.toFixed(token.logDecimals)} ${token.symbol} to ${to}`,
			);

			const contract = new this.web3.eth.Contract(ERC20_ABI, token.address);
			const amountWei = this.web3.utils.toWei(String(amount), token.decimals);
			const data = contract.methods.transfer(to, amountWei).encodeABI();
			await this.sendTx(await this.getTxData(token.address, 0, data));

			logger.info(
				`${this.info} Successfully sent ${amount.toFixed(token.logDecimals)} ${token.symbol} to ${to}`,
			);
		} catch (error) {
			throw new Error('Failed to transfer token: ' + (error as Error));
		}
	}

	async transferEth(to: string, amountEther: number) {
		try {
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');

			logger.info(
				`${this.info} Sending ${amountEther.toFixed(6)} ETH to ${to}`,
			);

			await this.sendTx(
				await this.getTxData(
					to,
					this.web3.utils.toWei(String(amountEther), 'ether'),
				),
			);

			logger.info(
				`${this.info} Successfully sent ${amountEther.toFixed(6)} ETH to ${to}`,
			);
		} catch (error) {
			throw new Error('Failed to transfer ETH: ' + (error as Error));
		}
	}

	async transferAllEth(to: string) {
		try {
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');

			const balance = await this.getEthBalance();
			const tempTx = await this.getTxData(to);
			const gasCost = BigInt(tempTx.gasPrice!) * BigInt(21000) * BigInt(2);
			const amountWei = BigInt(balance.wei) - gasCost;
			const amountEther = Number(amountWei) / 10 ** 18;
			if (amountWei <= 0) throw new Error('Insufficient balance');

			logger.info(
				`${this.info} Sending ${amountEther.toFixed(6)} ETH to ${to}`,
			);

			await this.sendTx(await this.getTxData(to, Number(amountWei)));

			logger.info(
				`${this.info} Successfully sent ${amountEther.toFixed(6)} ETH to ${to}`,
			);
		} catch (error) {
			throw new Error(
				'Failed to transfer all ETH: ' + (error as Error).message,
			);
		}
	}

	async transferAllToken(token: IToken, to: string) {
		try {
			if (!isValidAddress(to, this.web3))
				throw new Error('Invalid receiver address');

			const balance = await this.getTokenBalance(token);

			logger.info(
				`${this.info} Sending ${balance.logAmount} ${token.symbol} to ${to}`,
			);

			const contract = new this.web3.eth.Contract(ERC20_ABI, token.address);
			const data = contract.methods.transfer(to, balance.wei).encodeABI();
			await this.sendTx(await this.getTxData(token.address, 0, data));

			logger.info(
				`${this.info} Successfully sent ${
					balance.logAmount
				} ${token.symbol} to ${to}`,
			);
		} catch (error) {
			throw new Error(
				`Failed to transfer all ${token.symbol} token: ` + (error as Error),
			);
		}
	}
}
