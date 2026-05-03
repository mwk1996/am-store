import { Wallet, Clock, TrendingUp } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  pendingBalance: number;
}

export function BalanceCard({ balance, pendingBalance }: BalanceCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-indigo-900/60 to-indigo-800/40 border border-indigo-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/40 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">
              Available Balance
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
        <p className="text-indigo-400/70 text-xs mt-1">Ready to withdraw or spend</p>
      </div>

      <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-600/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-400/80 text-xs font-medium uppercase tracking-wider">
              In Escrow
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold text-white">${pendingBalance.toFixed(2)}</p>
        <p className="text-yellow-400/50 text-xs mt-1">Held for active orders</p>
      </div>
    </div>
  );
}
