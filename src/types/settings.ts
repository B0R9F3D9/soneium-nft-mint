export interface ISettings {
	readonly GAS_MULTIPLIER: [number, number];
	readonly MULTISEND_ETH_AMOUNT: [number, number];
	readonly MULTISEND_ASTR_AMOUNT: [number, number];
	readonly SLEEP_BETWEEN_WALLETS: [number, number];
	readonly CLAIM_NFT_AMOUNT: number;
	readonly NFT_ADDRESS: string;
	readonly COLLECTOR_MIN_ETH_AMOUNT: number;
	readonly COLLECTOR_MIN_ASTR_AMOUNT: number;
}
