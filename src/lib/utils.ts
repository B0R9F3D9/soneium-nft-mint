import type Web3 from 'web3';

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidAddress(address: string, web3: Web3): boolean {
	try {
		web3.utils.toChecksumAddress(address);
		return true;
	} catch {
		return false;
	}
}
