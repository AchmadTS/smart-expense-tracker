type ToastType = "success" | "error" | "info";

type Listener = (toast: { message: string; type: ToastType } | null) => void;

let listener: Listener | null = null;

export const showToast = (message: string, type: ToastType = "error") => {
    if (listener) {
        listener({ message, type });
    }
};

export const subscribeToast = (callback: Listener) => {
    listener = callback;
    return () => {
        listener = null;
    };
};