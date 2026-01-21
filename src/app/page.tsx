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
import { useAccount, useWriteContract, useReadContract, useReadContracts, useBalance } from 'wagmi';
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
  const { data: ethBalance } = useBalance({ address });
  const { writeContract } = useWriteContract();

  const [activeTab, setActiveTab] = useState<'lobby' | 'create' | 'ranks'>('lobby');
  const [activeDuelId, setActiveDuelId] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('0.10');

  const { data: nextGameId } = useReadContract({
    address: DICE_GAME_ADDRESS,
    abi: DICE_GAME_ABI,
    functionName: 'nextGameId',
  });

  const gameIds = useMemo(() => {
    if (!nextGameId) return [];
    const count = Number(nextGameId);
    const start = Math.max(0, count - 10);
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
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="bg-base-blue text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-base-blue font-black text-xl italic">L</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter italic">LUCKYBASE</h1>
        </div>
        <div className="flex items-center gap-2">
           <Wallet>
            <ConnectWallet className="bg-white/20 hover:bg-white/30 text-white border-none rounded-xl h-9 px-3">
              <Avatar className="h-5 w-5" />
              <Name className="text-white text-xs" />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </header>

      <main className="flex-1 p-4 pb-32">
        {activeDuelId ? (
          /* Duel View */
          <div className="flex flex-col gap-6">
            <button
              onClick={() => setActiveDuelId(null)}
              className="flex items-center gap-2 text-base-blue font-bold text-xs uppercase tracking-widest"
            >
              ← Back to Lobby
            </button>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-base-blue/5">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                  <Avatar address={selectedDuel?.player1 as `0x${string}`} className="h-16 w-16 rounded-2xl border-2 border-base-blue/10" />
                  <Name address={selectedDuel?.player1 as `0x${string}`} className="font-bold text-sm truncate w-full" />
                  <span className="text-[10px] font-bold text-base-blue bg-base-blue/5 px-2 py-0.5 rounded-full uppercase">Host</span>
                </div>

                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-base-blue/20 italic">VS</span>
                   <div className="bg-base-blue/10 px-3 py-1 rounded-full mt-2">
                      <span className="text-[10px] font-bold text-base-blue">{selectedDuel?.stake} ETH</span>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-3 w-1/3 text-center opacity-40">
                  <div className="h-16 w-16 rounded-2xl bg-base-gray/10 flex items-center justify-center border-2 border-dashed border-base-gray/20 text-2xl font-bold">?</div>
                  <span className="font-bold text-sm">Waiting...</span>
                </div>
              </div>

              <div className="flex justify-center items-center gap-8 mb-4">
                  <div className="w-20 h-20 bg-base-blue text-white rounded-2xl flex items-center justify-center text-4xl font-black shadow-xl shadow-base-blue/20 animate-bounce">6</div>
                  <div className="h-px w-12 bg-base-blue/10" />
                  <div className="w-20 h-20 bg-white border-4 border-dashed border-base-blue/10 rounded-2xl flex items-center justify-center text-4xl font-black text-base-blue/10">?</div>
              </div>
              <p className="text-center text-[10px] font-bold text-base-blue uppercase tracking-[0.2em] animate-pulse">Rolling Dice...</p>
            </div>
          </div>
        ) : (
          /* Tabs Content */
          <>
            {/* Dashboard / User Info */}
            <div className="bg-base-blue rounded-[2rem] p-6 mb-8 text-white shadow-xl shadow-base-blue/20 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Your Balance</p>
                <h2 className="text-3xl font-black italic tracking-tight">
                  {ethBalance ? Number(ethBalance.formatted).toFixed(4) : '0.0000'} <span className="text-sm opacity-60">ETH</span>
                </h2>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-center relative z-10">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-80">Rank</p>
                <p className="text-lg font-black italic">#12</p>
              </div>
            </div>

            {activeTab === 'lobby' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-base-blue italic">Live Duels</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active Now</span>
                  </div>
                </div>

                {activeDuels.length === 0 && (
                  <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-base-blue/20">
                    <p className="text-base-gray text-[10px] font-bold uppercase tracking-widest">No active duels</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 text-base-blue font-black text-xs uppercase underline decoration-2 underline-offset-4"
                    >
                      Create the first one
                    </button>
                  </div>
                )}

                {activeDuels.map((duel) => (
                  <div key={duel.id} className="bg-white rounded-[1.5rem] p-4 flex justify-between items-center shadow-sm border border-base-blue/5 hover:border-base-blue/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Avatar address={duel.player1 as `0x${string}`} className="h-12 w-12 rounded-xl border border-base-blue/10" />
                      <div>
                        <Name address={duel.player1 as `0x${string}`} className="font-bold text-sm block" />
                        <p className="text-[10px] font-bold text-base-blue/60 uppercase">{duel.stake} ETH</p>
                      </div>
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
                      className="bg-base-blue text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-base-blue/20 active:scale-95 transition-all"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-base-blue italic px-2">Create New Duel</h3>
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-base-blue/5">
                  <div className="mb-8">
                    <label className="text-[10px] font-bold text-base-gray uppercase tracking-widest block mb-3">Stake Amount</label>
                    <div className="flex flex-col gap-3">
                      <div className={`flex items-center justify-between bg-background rounded-2xl p-4 border transition-colors ${Number(stakeAmount) < 0.00004 && stakeAmount !== '' ? 'border-red-500' : 'border-base-blue/10'}`}>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.00001"
                          className="bg-transparent text-2xl font-black italic outline-none w-full mr-2"
                        />
                        <span className="text-sm font-bold text-base-blue">ETH</span>
                      </div>

                      <div className="flex gap-2">
                        {[0.001, 0.01, 0.05].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setStakeAmount(amount.toString())}
                            className="flex-1 py-2 px-3 rounded-xl border border-base-blue/10 text-[10px] font-bold text-base-blue hover:bg-base-blue/5 transition-colors"
                          >
                            {amount} ETH
                          </button>
                        ))}
                      </div>

                      {Number(stakeAmount) < 0.00004 && stakeAmount !== '' && (
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-1">Min stake is 0.00004 ETH</p>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={Number(stakeAmount) < 0.00004}
                    onClick={() => {
                      writeContract({
                        address: DICE_GAME_ADDRESS,
                        abi: DICE_GAME_ABI,
                        functionName: 'createGameETH',
                        value: parseEther(stakeAmount as `${number}`),
                        chainId: base.id,
                      });
                    }}
                    className="w-full bg-base-blue text-white font-black py-5 rounded-2xl shadow-xl shadow-base-blue/20 uppercase tracking-[0.2em] italic text-sm active:scale-98 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    Launch Duel
                  </button>

                  <p className="text-[9px] text-base-gray text-center mt-6 font-bold leading-relaxed opacity-60">
                    10% PLATFORM FEE APPLIES <br/>
                    24H SAFETY REFUND ACTIVE
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ranks' && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-base-blue italic px-2">Top Players</h3>
                <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-base-blue/5">
                   <div className="divide-y divide-base-blue/5">
                      {[
                        { name: 'vbuterin.eth', wins: 142, volume: '14.2 ETH', rank: 1 },
                        { name: 'basegod.eth', wins: 98, volume: '9.8 ETH', rank: 2 },
                        { name: 'jules.eth', wins: 87, volume: '8.7 ETH', rank: 3 },
                        { name: 'lucky.eth', wins: 64, volume: '6.4 ETH', rank: 4 },
                        { name: 'degen.eth', wins: 52, volume: '5.2 ETH', rank: 5 },
                      ].map((player) => (
                        <div key={player.rank} className="p-4 flex justify-between items-center group hover:bg-base-blue/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                             <span className={`text-lg font-black italic w-6 ${player.rank <= 3 ? 'text-base-blue' : 'text-base-gray/40'}`}>
                               #{player.rank}
                             </span>
                             <div>
                                <p className="font-bold text-sm">{player.name}</p>
                                <p className="text-[10px] font-bold text-base-gray uppercase tracking-widest">{player.wins} Wins</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-base-blue uppercase italic">{player.volume}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full max-w-[480px] left-1/2 -translate-x-1/2 bg-white border-t border-base-blue/10 px-8 py-4 flex justify-between items-center z-50 pb-8 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,82,255,0.1)]">
         <button
            onClick={() => { setActiveTab('lobby'); setActiveDuelId(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'lobby' ? 'text-base-blue scale-110' : 'text-base-gray opacity-40 hover:opacity-80'}`}
         >
            <div className={`p-2 rounded-2xl transition-all ${activeTab === 'lobby' ? 'bg-base-blue/10' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Lobby</span>
         </button>

         <button
            onClick={() => { setActiveTab('create'); setActiveDuelId(null); }}
            className="flex flex-col items-center gap-1 group -translate-y-8"
         >
            <div className={`p-5 rounded-full shadow-2xl transition-all border-[6px] border-background active:scale-90 ${activeTab === 'create' ? 'bg-base-blue text-white shadow-base-blue/40' : 'bg-base-gray text-white shadow-base-gray/20'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
         </button>

         <button
            onClick={() => { setActiveTab('ranks'); setActiveDuelId(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'ranks' ? 'text-base-blue scale-110' : 'text-base-gray opacity-40 hover:opacity-80'}`}
         >
            <div className={`p-2 rounded-2xl transition-all ${activeTab === 'ranks' ? 'bg-base-blue/10' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Ranks</span>
         </button>
      </nav>
    </div>
  );
}
