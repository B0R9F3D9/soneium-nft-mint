import { readFileSync } from 'fs';

import type { ISettings } from '@/types/settings';

function removeComments(jsonString: string): string {
	return jsonString
		.split('\n')
		.map(line => line.replace(/\/\/\s.*$/, ''))
		.join('\n')
		.trim();
}

const rawData = readFileSync('./data/settings.json', 'utf-8');
const cleanedData = removeComments(rawData);
export const SETTINGS = JSON.parse(cleanedData) as ISettings;
