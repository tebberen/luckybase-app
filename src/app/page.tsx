'use client';

import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
} from '@coinbase/onchainkit/identity';
import { useAccount, useWriteContract, useReadContract, useReadContracts } from 'wagmi';
import { base } from 'wagmi/chains';
import { useState, useMemo } from 'react';
import { parseEther, formatEther } from 'viem';

const TREASURY_ADDRESS = '0x71aFDE0D9849e492231dE0CB3559D2Ed02B518b6' as `0x${string}`;
const DICE_GAME_ADDRESS = '0x9bA4560d7EAbbB86f8Ff98700641a79B06Ec7a6f' as `0x${string}`;

const DICE_GAME_ABI = [
  {
    "inputs": [],
    "name": "createGameETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "games",
    "outputs": [
      {
        "internalType": "address",
        "name": "player1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "player2",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stake",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextGameId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function LuckyBasePage() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const [activeDuelId, setActiveDuelId] = useState<number | null>(null);

  const { data: nextGameId } = useReadContract({
    address: DICE_GAME_ADDRESS,
    abi: DICE_GAME_ABI,
    functionName: 'nextGameId',
  });

  const gameIds = useMemo(() => {
    if (!nextGameId) return [];
    const count = Number(nextGameId);
    // Fetch last 20 games to find active ones
    const start = Math.max(0, count - 20);
    return Array.from({ length: count - start }, (_, i) => BigInt(start + i));
  }, [nextGameId]);

  const { data: gamesData } = useReadContracts({
    contracts: gameIds.map((id) => ({
      address: DICE_GAME_ADDRESS,
      abi: DICE_GAME_ABI,
      functionName: 'games',
      args: [id],
    })),
  });

  const activeDuels = useMemo(() => {
    if (!gamesData) return [];
    return gamesData
      .map((res, index) => {
        if (res.status === 'success' && Array.isArray(res.result)) {
          const [player1, player2, token, stake, startTime, isActive] = res.result as unknown as [string, string, string, bigint, bigint, boolean];
          return {
            id: Number(gameIds[index]),
            player1,
            player2,
            token,
            stake: formatEther(stake),
            startTime,
            isActive,
          };
        }
        return null;
      })
      .filter((game): game is NonNullable<typeof game> =>
        game !== null &&
        game.isActive &&
        game.player2 === '0x0000000000000000000000000000000000000000'
      )
      .reverse();
  }, [gamesData, gameIds]);

  const selectedDuel = useMemo(() =>
    activeDuels.find(d => d.id === activeDuelId),
    [activeDuels, activeDuelId]
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-sans selection:bg-base-blue selection:text-white">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            LUCKY<span className="text-base-blue">BASE</span>
          </h1>
          <span className="bg-base-blue/10 text-base-blue text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-base-blue/20">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Wallet>
            <ConnectWallet className="bg-base-blue hover:bg-base-blue/90 text-white font-bold transition-all rounded-xl">
              <Avatar className="h-6 w-6" />
              <Name className="text-white" />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
              </Identity>
              <WalletDropdownDisconnect className="hover:bg-red-500 hover:text-white transition-colors" />
            </WalletDropdown>
          </Wallet>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {!activeDuelId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold tracking-widest text-base-gray uppercase">Game Lobby</h2>
                <div className="flex items-center gap-2 bg-base-blue/5 px-3 py-1 rounded-full border border-base-blue/10">
                  <span className="w-2 h-2 rounded-full bg-base-blue animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-base-blue">Live</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeDuels.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                    <p className="text-base-gray text-xs font-bold uppercase tracking-[0.2em]">No active duels found</p>
                  </div>
                )}
                {activeDuels.map((duel) => (
                  <div key={duel.id} className="group bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:bg-white/[0.05] hover:border-base-blue/30 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-base-blue/10 border border-base-blue/20 overflow-hidden flex items-center justify-center">
                         <Avatar address={duel.player1 as `0x${string}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-base-gray uppercase tracking-widest mb-0.5">Host</p>
                        <Name address={duel.player1 as `0x${string}`} className="font-bold text-lg block" />
                        <p className="font-mono text-[10px] text-base-gray/60">{`${duel.player1.slice(0, 6)}...${duel.player1.slice(-4)}`}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-bold text-base-gray uppercase tracking-widest mb-0.5">Stake</p>
                      <p className="text-xl font-bold text-foreground">{duel.stake} <span className="text-base-blue text-sm">ETH</span></p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveDuelId(duel.id);
                        writeContract({
                          address: DICE_GAME_ADDRESS,
                          abi: DICE_GAME_ABI,
                          functionName: 'joinGame',
                          args: [BigInt(duel.id)],
                          value: parseEther(duel.stake as `${number}`),
                          chainId: base.id,
                        });
                      }}
                      className="bg-foreground text-background font-bold px-6 py-2.5 rounded-xl hover:bg-base-blue hover:text-white transition-all uppercase text-xs tracking-wider"
                    >
                      Join Duel
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 h-fit sticky top-8">
              <h3 className="text-lg font-bold mb-6">Create Duel</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-base-gray uppercase tracking-widest block mb-2">Stake Amount</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="0.10"
                      readOnly
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 font-mono text-foreground focus:outline-none focus:border-base-blue/50 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-base-gray">ETH</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    writeContract({
                      address: DICE_GAME_ADDRESS,
                      abi: DICE_GAME_ABI,
                      functionName: 'createGameETH',
                      value: parseEther('0.10'),
                      chainId: base.id,
                    });
                  }}
                  className="w-full bg-base-blue text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all transform active:scale-[0.98] shadow-lg shadow-base-blue/20 uppercase text-sm tracking-widest"
                >
                  Launch Duel
                </button>

                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-base-gray text-center leading-relaxed font-medium">
                    By creating a duel, you agree to the 10% platform fee. <br/>
                    Funds can be refunded if no one joins within 24h.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-12 mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-base-blue/50 to-transparent" />

              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-widest text-base-gray">
                  Platform Fee: 10% • 24h Safety Refund Active
                </p>
              </div>

              <div className="flex justify-between items-center relative z-10 mt-8">
                <div className="flex flex-col items-center gap-6 w-1/3">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-3xl bg-base-blue/10 absolute -inset-2 blur-2xl opacity-30" />
                    <div className="h-32 w-32 rounded-[2rem] bg-background border-2 border-white/5 flex items-center justify-center relative overflow-hidden shadow-2xl">
                      <Avatar className="h-full w-full" address={selectedDuel?.player1 as `0x${string}`} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-base-blue text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Host</p>
                    <Name address={selectedDuel?.player1 as `0x${string}`} className="text-2xl font-bold" />
                    <p className="text-base-gray font-mono text-xs mt-1">
                      {selectedDuel ? `${selectedDuel.player1.slice(0, 6)}...${selectedDuel.player1.slice(-4)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl font-bold text-white/5 select-none tracking-tighter">VS</div>
                  <div className="bg-base-blue/10 px-4 py-1.5 rounded-full border border-base-blue/20">
                    <p className="text-base-blue text-[10px] font-bold uppercase tracking-widest">{selectedDuel?.stake || '0.10'} ETH STAKE</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 w-1/3">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-[2rem] bg-white/[0.02] border-2 border-dashed border-white/10 flex items-center justify-center relative">
                      <span className="text-white/10 font-bold text-4xl">?</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white/10 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Opponent</p>
                    <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse mx-auto" />
                    <p className="text-base-gray/40 font-mono text-[10px] mt-2 italic">Waiting for join...</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 flex justify-center items-center gap-12">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-background text-5xl font-bold shadow-xl animate-bounce">
                    6
                  </div>
                  <div className="absolute -bottom-10 left-0 right-0 text-center">
                    <p className="text-base-blue text-[10px] font-bold uppercase tracking-widest animate-pulse">Rolling</p>
                  </div>
                </div>

                <div className="w-24 h-px bg-gradient-to-r from-base-blue/50 to-transparent" />

                <div className="relative opacity-30">
                  <div className="w-24 h-24 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20 text-5xl font-bold">
                    ?
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveDuelId(null)}
              className="mb-8 text-base-gray hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Lobby
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
