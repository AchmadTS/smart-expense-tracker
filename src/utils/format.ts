export const formatCurrency = (amount: number | string, currency: string = "IDR"): string => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatDate = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
};

export const formatMonth = (yyyyMm: string | null | undefined): string => {
    if (!yyyyMm) return "";
    const parts = yyyyMm.split("-");
    if (parts.length !== 2) return yyyyMm;
    const [year, month] = parts;
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    if (isNaN(d.getTime())) return yyyyMm;
    return new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(d);
};

export const todayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const timeAgo = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    const diffMs = Date.now() - new Date(date).getTime();
    if (diffMs < 0) return "only just";
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "only just";
    if (minutes < 60) return `${minutes}m then`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}j then`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}h then`;
    return formatDate(date);
};