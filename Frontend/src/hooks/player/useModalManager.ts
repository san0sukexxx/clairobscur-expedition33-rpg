import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { UseModalManagerReturn } from "../../pages/PlayerPage/PlayerPage.types";

/**
 * Hook to manage modal state
 */
export function useModalManager(onCloseCallback?: () => void): UseModalManagerReturn {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<ReactNode>(null);

  const openModal = useCallback((title: string, body: ReactNode) => {
    setModalTitle(title);
    setModalBody(body);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    // Remove focus from modal content before closing to avoid aria-hidden warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    onCloseCallback?.();
    setModalOpen(false);
  }, [onCloseCallback]);

  return {
    modalOpen,
    modalTitle,
    modalBody,
    openModal,
    closeModal,
    setModalBody,
    setModalOpen,
    setModalTitle
  };
}
