interface NftItem {
	animation_url: string | null;
	external_app_url: string | null;
	id: string;
	image_url: string;
	is_unique: boolean | null;
	media_type: string | null;
	media_url: string;
	metadata: {
		attributes: {
			trait_type: string;
			value: string;
		}[];
		image: string;
		name: string;
	};
	owner: string | null;
	thumbnails: string[] | null;
	token: {
		address: string;
		circulating_market_cap: string | null;
		decimals: string | null;
		exchange_rate: string | null;
		holders: string;
		icon_url: string | null;
		name: string;
		symbol: string;
		total_supply: string | null;
		type: 'ERC-721';
		volume_24h: string | null;
	};
	token_type: 'ERC-721';
	value: string;
}

export interface NftResponse {
	items: NftItem[];
	next_page_params: object;
}
