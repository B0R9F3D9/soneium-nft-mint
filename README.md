# Soneium NFT Mint

![image](https://github.com/user-attachments/assets/221a108f-5545-41fd-b7dc-cab79d3e8ae1)

# Available Modules

- 💰 **MultiSender** - Send ETH or ASTR tokens (set amount during runtime)
- 🎁 **Claim NFTs** - Mint multiple NFTs at once (set amount during runtime)
- 🛫 **Transfer NFTs** - Send all NFTs from all wallets to a chosen
- 📊 **Checker** - Check wallets, display results in a table, and save to `/checker/`

# Installation

> _For best emoji display and formatting on Windows - use VS Code or Windows Terminal_

1. Install [**bun**](https://bun.sh/)
2. Clone this repository to your machine
3. Run `bun install` to fetch dependencies

# Setup

- Rename `/data/keys.txt.example` to `/data/keys.txt`
- Add your wallet private keys (starting with `0x`) to `/data/keys.txt`

# Start

```bash
bun run start
```
