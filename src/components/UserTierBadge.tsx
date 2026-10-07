"use client";

type Props = {
  tier: string;
  paymentStatus?: string;
  fullName?: string;
  size?: "sm" | "md" | "lg";
};

export default function UserTierBadge({
  tier,
  paymentStatus,
  fullName,
  size = "md",
}: Props) {
  // Determine color scheme by tier
  const tierStyles: Record<string, { text: string; bg: string; icon?: string; label: string }> = {
    TRIAL: {
      text: "text-gray-600",
      bg: "bg-gray-100",
      label: "Trial",
    },
    NORMAL: {
      text: "text-blue-700",
      bg: "bg-blue-50",
      label: "Normal",
    },
    PREMIUM: {
      text: "text-yellow-800",
      bg: "bg-yellow-100",
      icon: "✨",
      label: "Premium",
    },
    VIP: {
      text: "text-red-700",
      bg: "bg-red-100",
      icon: "👑",
      label: "VIP",
    },
  };

  const styles = tierStyles[tier] || tierStyles.TRIAL;
  const isPending = paymentStatus === "PENDING_VERIFICATION";

  const sizeClasses: Record<string, string> = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${styles.text} ${styles.bg} ${sizeClasses[size]} ${
        isPending ? "animate-pulse ring-2 ring-yellow-400 ring-offset-1" : ""
      }`}
      title={isPending ? "Payment pending verification" : styles.label}
    >
      {fullName && <span className={styles.text}>{fullName}</span>}
      {styles.icon && <span>{styles.icon}</span>}
      {!fullName && <span>{styles.label}</span>}
      {isPending && <span>⚠️</span>}
    </span>
  );
}