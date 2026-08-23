"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gates an interactive action behind login/register. Call `guard(fn)` from
 * an onClick handler: if the user is signed in, fn runs immediately;
 * otherwise the auth modal opens and fn runs automatically right after a
 * successful login/register.
 */
export function useAuthGate() {
  const { firebaseUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  function guard(fn: () => void) {
    if (firebaseUser) {
      fn();
      return;
    }
    setPending(() => fn);
    setModalOpen(true);
  }

  function handleSuccess() {
    pending?.();
    setPending(null);
  }

  return {
    modalOpen,
    closeModal: () => setModalOpen(false),
    handleSuccess,
    guard,
  };
}
