import { toast } from 'react-toastify';

let lastToastId = null;

export function showToast(toastId, type, message, options = {}) {
  if (lastToastId && toastId !== lastToastId && toast.isActive(lastToastId)) {
    toast.dismiss(lastToastId);
  }

  if (!toastId) {
    lastToastId = toast[type]?.(message, options);
    return;
  }

  if (toast.isActive(toastId)) {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      ...options
    });
    lastToastId = toastId;
    return;
  }

  toast[type]?.(message, { toastId, ...options });
  lastToastId = toastId;
}

export function showLoadingToast(toastId, message, options = {}) {
  if (lastToastId && toastId !== lastToastId && toast.isActive(lastToastId)) {
    toast.dismiss(lastToastId);
  }

  if (toastId && toast.isActive(toastId)) {
    toast.update(toastId, {
      render: message,
      isLoading: true,
      ...options
    });
    lastToastId = toastId;
    return toastId;
  }

  const id = toast.loading(message, { toastId, ...options });
  lastToastId = id;
  return id;
}
