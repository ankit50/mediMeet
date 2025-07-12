// components/UserCreditsBadge.jsx
"use client";

import { CreditCard } from "lucide-react";
import { Badge } from "./ui/badge";
import Link from "next/link";

const UserCreditsBadge = ({ user }) => {
  if (!user || user.role === "ADMIN") return null;

  const href = user.role === "PATIENT" ? "/pricing" : "/doctor";
  const creditsLabel = user.role === "PATIENT" ? "Credits" : "Earned Credits";

  return (
    <Link href={href}>
      <Badge
        variant="outline"
        className="h-9 bg-emerald-900/20 border-emerald-700/30 px-3 py-1 flex items-center gap-2"
      >
        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-emerald-400">
          {user.credits}
          <span className="hidden md:inline"> {creditsLabel}</span>
        </span>
      </Badge>
    </Link>
  );
};

export default UserCreditsBadge;
