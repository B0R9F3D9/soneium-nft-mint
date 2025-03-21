# Soneium NFT Mint

<img width="746" alt="image" src="https://github.com/user-attachments/assets/23105f8a-3548-45de-b767-2e37a87d388f" />

# Available Modules

- 💰 **MultiSender** - _Send ETH or ASTR tokens (sender is set at runtime, amount is set in `/src/settings.ts`)_
- 🎁 **Claim NFTs** - _Mint multiple NFTs at once (set amount in `/src/settings.ts`)_
- 💥 **Token Collector** - _Send entire ETH or ASTR balance (recipient is set at runtime, minimum amount is set in `/src/settings.ts`_
- 👛 **Generate Wallets** - _Generates and stores private keys to `/data/keys.txt`_
- 📊 **Checker** - _Check wallets, display results in a table, and saves to `/checker/`_

# Installation

> _For best emoji display and formatting on Windows - use VS Code or Windows Terminal_

1. Install [**bun**](https://bun.sh/)
2. Clone this repository to your machine
3. Run `bun install` to fetch dependencies

# Setup

- Rename `/data/keys.txt.example` to `/data/keys.txt`
- Add your wallet private keys (starting with `0x`) to `/data/keys.txt`
- Configurate `/src/settings.ts`

# Start

```bash
bun run start
```
