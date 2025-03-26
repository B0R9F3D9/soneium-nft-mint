import { readFileSync } from 'fs';

import type { ISettings } from '@/types/settings';

export const SETTINGS = JSON.parse(
	readFileSync('./data/settings.json', 'utf-8'),
) as ISettings;
