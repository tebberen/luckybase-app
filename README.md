# LuckyBase - Modular P2P Gaming on Base

LuckyBase is a decentralized P2P duel platform built on the Base network. It functions as both a Farcaster Mini-app and a standalone BaseApp.

## Technical Stack
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Blockchain:** Base Network.
- **Web3:** OnchainKit (Coinbase), Wagmi, Viem.
- **Contracts:** Solidity (Hardhat).
- **Identity:** Farcaster SDK for @username resolution and app context.

## Modular Smart Contract Architecture

The system is designed to be modular, allowing for easy expansion with new game modules.

### 1. Treasury.sol
- Acts as the central hub for platform revenue.
- Collects a **10% platform fee** on all game payouts.
- Managed by the platform owner for withdrawals.

### 2. Leaderboard.sol
- Tracks global user statistics across all games.
- Stores wins, losses, and total volume.
- Only authorized game contracts can update stats.

### 3. DiceGame.sol (1v1)
- The first game module: A simple high-roll dice game.
- **Randomness:** Uses `prevrandao` for secure on-chain entropy.
- **Matching:** Players deposit ETH (min 0.10) to create or join a duel.
- **Resolution:** Winner takes the total stake (minus 10% fee). Ties result in an automatic re-roll.
- **Safety:** Players can refund their stake if no opponent joins within 24 hours.

## Getting Started

### Smart Contracts
1. Install dependencies: `npm install`
2. Compile contracts: `npx hardhat compile`
3. Run tests: `npx hardhat test`

### Frontend
1. Setup environment variables:
   ```
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
   NEXT_PUBLIC_URL=your_app_url
   ```
2. Run development server: `npm run dev`
3. Build for production: `npm run build`

## Farcaster Integration
LuckyBase is optimized for the Farcaster ecosystem:
- Resolves @usernames for a social gaming experience.
- Implements Farcaster Mini-app SDK for seamless loading and context.
- Provides `fc:miniapp` metadata for rich embeds.
