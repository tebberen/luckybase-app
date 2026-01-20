'use client';

import { use } from 'react';
import Link from 'next/link';
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity';

export default function DuelRoomClient({ id }: { id: string }) {
  // Mock addresses for demonstration
  const player1Address = "0x02ef790Dd7993A35fD847C053EDdAE940D055596";
  const player2Address = "0x838e4a80419D0388406f890539126487e67176E3";

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />

        <div className="flex justify-between items-center mb-12 relative z-10">
          <div className="text-center">
            <Identity address={player1Address} className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20 shadow-lg shadow-blue-900/40" />
              <Name className="font-bold text-xl text-white" />
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Player 1</p>
            </Identity>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-5xl font-black italic text-slate-700 select-none">VS</div>
            <div className="h-0.5 w-12 bg-slate-700 mt-2" />
          </div>

          <div className="text-center">
            <Identity address={player2Address} className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20 shadow-lg shadow-purple-900/40" />
              <Name className="font-bold text-xl text-white" />
              <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Player 2</p>
            </Identity>
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-12 flex justify-around items-center mb-12 border border-slate-700/50 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-slate-900 text-5xl font-bold shadow-[inset_0_-8px_0_#cbd5e1] animate-bounce">
              6
            </div>
            <p className="absolute -bottom-8 left-0 right-0 text-center text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Rolling</p>
          </div>

          <div className="relative">
            <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-5xl font-bold border-2 border-dashed border-slate-700 shadow-inner">
              ?
            </div>
          </div>
        </div>

        <div className="text-center relative z-10">
          <p className="text-slate-500 text-xs font-medium mb-3 tracking-widest uppercase">Duel # {id}</p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-black border border-blue-500/20 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            STAKE: 0.10 ETH
          </div>
        </div>
      </div>

      <Link href="/lobby" className="mt-8 text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-xs flex items-center gap-2">
        <span className="text-lg">←</span> Back to Lobby
      </Link>
    </div>
  );
}
