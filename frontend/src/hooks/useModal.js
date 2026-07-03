import { useContext } from 'react';
import { ModalContext } from '../context/ModalContext.jsx';

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}
