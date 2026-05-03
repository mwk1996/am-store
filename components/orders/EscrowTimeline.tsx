import { CheckCircle, Clock, Package, ShieldCheck, AlertTriangle, XCircle, Banknote } from "lucide-react";

type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "REFUNDED";

interface EscrowTimelineProps {
  status: OrderStatus;
  createdAt: string | Date;
  escrowReleasedAt?: string | Date | null;
}

const STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Clock, description: "Order created, awaiting payment" },
  { key: "PAID", label: "Payment Held", icon: ShieldCheck, description: "Funds secured in escrow" },
  { key: "DELIVERED", label: "Delivered", icon: Package, description: "Seller has delivered the product" },
  { key: "COMPLETED", label: "Completed", icon: Banknote, description: "Funds released to seller" },
] as const;

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0,
  PAID: 1,
  DELIVERED: 2,
  COMPLETED: 3,
  DISPUTED: 2,
  REFUNDED: 3,
};

export function EscrowTimeline({ status, createdAt, escrowReleasedAt }: EscrowTimelineProps) {
  const currentStep = STATUS_ORDER[status];
  const isDisputed = status === "DISPUTED";
  const isRefunded = status === "REFUNDED";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        Escrow Status
      </h3>

      {/* Special states */}
      {isDisputed && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Dispute In Progress</p>
            <p className="text-yellow-400/70 text-xs">Funds are held while admin reviews the dispute.</p>
          </div>
        </div>
      )}

      {isRefunded && (
        <div className="mb-4 flex items-center gap-3 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium text-sm">Order Refunded</p>
            <p className="text-red-400/70 text-xs">Funds have been returned to the buyer.</p>
          </div>
        </div>
      )}

      {/* Timeline steps */}
      <div className="relative">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > index || (status === "COMPLETED" && index === 3);
          const isCurrent = currentStep === index && !isDisputed && !isRefunded;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex gap-4 mb-1">
              {/* Icon column */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    isComplete
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : isCurrent
                      ? "bg-gray-700 border-indigo-500 text-indigo-400"
                      : "bg-gray-900 border-gray-600 text-gray-600"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 my-1 min-h-[1.5rem] ${
                      currentStep > index ? "bg-indigo-600" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-5 flex-1">
                <p
                  className={`font-medium text-sm ${
                    isComplete || isCurrent ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                {index === 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(createdAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                )}
                {index === 3 && escrowReleasedAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Released {new Date(escrowReleasedAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
