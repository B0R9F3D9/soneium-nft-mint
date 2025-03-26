import { SETTINGS } from '@/constants/settings';
import type { IToken } from '@/types/token';

export const TOKENS: Record<'ASTR' | 'NFT', IToken> = {
	ASTR: {
		address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
		symbol: 'ASTR',
		decimals: 18,
		logDecimals: 2,
	},
	NFT: {
		address: SETTINGS.NFT_ADDRESS,
		symbol: 'NFT',
		decimals: 1,
		logDecimals: 0,
	},
};
