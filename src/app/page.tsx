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
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans selection:bg-lime-400 selection:text-black">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter italic">
            LUCKY<span className="text-lime-400">BASE</span>
          </h1>
          <span className="bg-lime-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Wallet>
            <ConnectWallet className="bg-white hover:bg-lime-400 text-black font-bold transition-colors">
              <Avatar className="h-6 w-6" />
              <Name className="text-black" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight">GAME LOBBY</h2>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Now</span>
                </div>
              </div>

              <div className="space-y-4">
                {activeDuels.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-white/20 font-bold uppercase tracking-widest">No active duels found</p>
                  </div>
                )}
                {activeDuels.map((duel) => (
                  <div key={duel.id} className="group bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center hover:border-lime-400/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-lime-400 to-green-600 overflow-hidden">
                         <Avatar address={duel.player1 as `0x${string}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Host</p>
                        <p className="font-mono text-lg">{`${duel.player1.slice(0, 6)}...${duel.player1.slice(-4)}`}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Stake</p>
                      <p className="text-2xl font-black text-lime-400">{duel.stake} ETH</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveDuelId(duel.id);
                        writeContract({
                          address: DICE_GAME_ADDRESS,
                          abi: DICE_GAME_ABI,
                          functionName: 'joinGame', // Matches joinDuel requirement
                          args: [BigInt(duel.id)],
                          value: parseEther(duel.stake as `${number}`),
                          chainId: base.id,
                        });
                      }}
                      className="bg-white text-black font-black px-8 py-3 rounded-xl hover:bg-lime-400 transition-colors uppercase italic tracking-tighter"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-fit sticky top-8">
              <h3 className="text-xl font-black mb-6 italic">CREATE DUEL</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-2">Stake Amount</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="0.10"
                      readOnly
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-lime-400 focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs">ETH</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    writeContract({
                      address: DICE_GAME_ADDRESS,
                      abi: DICE_GAME_ABI,
                      functionName: 'createGameETH', // Matches createDuel requirement
                      value: parseEther('0.10'),
                      chainId: base.id,
                    });
                  }}
                  className="w-full bg-lime-400 text-black font-black py-4 rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.2)] uppercase italic"
                >
                  Launch Duel
                </button>

                <p className="text-[10px] text-white/30 text-center leading-relaxed font-medium">
                  By creating a duel, you agree to the 10% platform fee. <br/>
                  Funds can be refunded if no one joins within 24h.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-[3rem] p-12 mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent opacity-50" />

              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                  Platform Fee: 10% • 24h Safety Refund Active
                </p>
              </div>

              <div className="flex justify-between items-center relative z-10 mt-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-3xl bg-lime-400 rotate-3 absolute -inset-1 opacity-20 blur-xl" />
                    <div className="h-32 w-32 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center relative overflow-hidden group">
                      <Avatar className="h-full w-full" address={selectedDuel?.player1 as `0x${string}`} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lime-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Host</p>
                    <Name address={selectedDuel?.player1 as `0x${string}`} className="text-2xl font-black italic" />
                    <p className="text-white/40 font-mono text-xs mt-1">
                      {selectedDuel ? `${selectedDuel.player1.slice(0, 6)}...${selectedDuel.player1.slice(-4)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="text-6xl font-black italic text-white/10 select-none tracking-tighter">VS</div>
                  <div className="bg-lime-400/20 px-4 py-1 rounded-full border border-lime-400/30">
                    <p className="text-lime-400 text-[10px] font-bold uppercase tracking-widest">{selectedDuel?.stake || '0.10'} ETH STAKE</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center relative">
                      <span className="text-white/20 font-black text-4xl">?</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Opponent</p>
                    <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
                    <p className="text-white/10 font-mono text-xs mt-2 italic">Waiting for join...</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 flex justify-around items-center">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-black text-5xl font-black shadow-[0_8px_0_#d1d5db] animate-bounce transition-transform group-hover:scale-110">
                    6
                  </div>
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <p className="text-lime-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Rolling</p>
                  </div>
                </div>

                <div className="w-20 h-0.5 bg-gradient-to-r from-lime-400/50 to-transparent" />

                <div className="relative opacity-20">
                  <div className="w-24 h-24 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/20 text-5xl font-black">
                    ?
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveDuelId(null)}
              className="mb-8 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            >
              ← Back to Lobby
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
