export function formatDateTime(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function truncateAddress(address: string) {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
