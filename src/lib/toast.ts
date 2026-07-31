type ToastType = "success" | "error" | "info";

export type ToastPayload = {
    id: string;
    message: string;
    type: ToastType;
};

type Listener = (toast: ToastPayload | null) => void;
const listeners = new Set<Listener>();

export const showToast = (message: string, type: ToastType = "error") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const toast = { id, message, type };

    listeners.forEach((listener) => {
        listener(toast);
    });
};

export const dismissToast = () => {
    listeners.forEach((listener) => {
        listener(null);
    });
};

export const subscribeToast = (callback: Listener) => {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
};