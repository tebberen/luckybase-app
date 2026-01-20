'use client';

import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity
} from '@coinbase/onchainkit/identity';
import { useState } from 'react';

export default function LobbyPage() {
  const [duels] = useState([
    { id: 1, player1: 'alice.eth', stake: '0.10 ETH', status: 'Waiting' },
    { id: 2, player1: 'bob.base', stake: '0.25 ETH', status: 'Waiting' },
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold text-blue-500">LuckyBase</h1>
        <div className="flex items-center gap-4">
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
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

      <main className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-semibold">Active Duels</h2>
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20">
            Create New Duel
          </button>
        </div>

        <div className="grid gap-4">
          {duels.map((duel) => (
            <div key={duel.id} className="bg-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center border border-slate-700 hover:border-blue-500/50 transition-colors gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Host</p>
                  <p className="font-medium text-lg">{duel.player1}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Stake</p>
                <p className="font-bold text-2xl text-blue-400">{duel.stake}</p>
              </div>
              <button className="w-full sm:w-auto bg-slate-700 hover:bg-green-600 text-white px-10 py-3 rounded-xl font-bold transition">
                Join
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
