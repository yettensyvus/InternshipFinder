import { toast } from 'react-toastify';

let lastToastId = null;

export function showToast(toastId, type, message, options = {}) {
  const resolvedOptions =
    options && Object.prototype.hasOwnProperty.call(options, 'autoClose')
      ? options
      : { autoClose: 2200, ...options };

  if (lastToastId && toastId !== lastToastId && toast.isActive(lastToastId)) {
    toast.dismiss(lastToastId);
  }

  if (!toastId) {
    lastToastId = toast[type]?.(message, resolvedOptions);
    return;
  }

  if (toast.isActive(toastId)) {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      ...resolvedOptions
    });
    lastToastId = toastId;
    return;
  }

  toast[type]?.(message, { toastId, ...resolvedOptions });
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
