'use client';

import { use } from 'react';
import Link from 'next/link';
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity';

export default function DuelRoomClient({ id }: { id: string }) {
  // Mock addresses for demonstration
  const player1Address = "0x02ef790Dd7993A35fD847C053EDdAE940D055596";
  const player2Address = "0x838e4a80419D0388406f890539126487e67176E3";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white/[0.03] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-base-blue/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-base-blue/5 blur-[100px] rounded-full" />

        <div className="flex justify-between items-center mb-12 relative z-10 px-4">
          <div className="text-center">
            <Identity address={player1Address as `0x${string}`} className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 shadow-xl shadow-base-blue/20 rounded-2xl" />
              <Name className="font-bold text-lg text-foreground" />
              <p className="text-base-blue text-[10px] font-bold uppercase tracking-widest">Player 1</p>
            </Identity>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-white/5 select-none tracking-tighter">VS</div>
            <div className="h-px w-8 bg-white/10 mt-2" />
          </div>

          <div className="text-center">
            <Identity address={player2Address as `0x${string}`} className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 shadow-xl shadow-white/5 rounded-2xl" />
              <Name className="font-bold text-lg text-foreground" />
              <p className="text-base-gray text-[10px] font-bold uppercase tracking-widest">Player 2</p>
            </Identity>
          </div>
        </div>

        <div className="bg-background/50 rounded-3xl p-12 flex justify-around items-center mb-10 border border-white/5 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-background text-5xl font-bold shadow-lg animate-bounce">
              6
            </div>
            <p className="absolute -bottom-10 left-0 right-0 text-center text-base-blue text-[10px] font-bold uppercase tracking-widest animate-pulse">Rolling</p>
          </div>

          <div className="relative">
            <div className="w-24 h-24 bg-white/[0.02] rounded-2xl flex items-center justify-center text-white/10 text-5xl font-bold border-2 border-dashed border-white/10 shadow-inner">
              ?
            </div>
          </div>
        </div>

        <div className="text-center relative z-10">
          <p className="text-base-gray text-[10px] font-bold mb-3 tracking-widest uppercase">Duel Room #{id}</p>
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-base-blue/10 text-base-blue rounded-full text-xs font-bold border border-base-blue/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-base-blue animate-pulse" />
            STAKE: 0.10 ETH
          </div>
        </div>
      </div>

      <Link href="/" className="mt-8 text-base-gray hover:text-foreground transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 group">
        <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span> Back to Lobby
      </Link>
    </div>
  );
}
