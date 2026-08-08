export function getSavedLockoutRemaining(): number {
    if (typeof window === "undefined") return 0;
    const savedLockout = parseInt(localStorage.getItem("lockout_until") || "0", 10);
    if (savedLockout > Date.now()) {
        const diff = Math.ceil((savedLockout - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
    }
    return 0;
}

export function setLockoutDuration(durationInSeconds: number): void {
    if (typeof window === "undefined") return;
    const targetTime = Date.now() + durationInSeconds * 1000;
    localStorage.setItem("lockout_until", targetTime.toString());
}

export function clearLockout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("lockout_until");
}