import { useCallback, useState } from 'react';

type ModalState<T> = {
  isOpen: boolean;
  data: T;
};

type UseModalStateReturn<T> = {
  isOpen: boolean;
  data: T;
  open: (payload?: T) => void;
  close: () => void;
  toggle: (next?: boolean, payload?: T) => void;
  setData: React.Dispatch<React.SetStateAction<T>>;
};

/**
 * Small helper for handling modal visibility and optional payload.
 */
export function useModalState<T = undefined>(initialOpen = false, initialData?: T): UseModalStateReturn<T | undefined> {
  const [state, setState] = useState<ModalState<T | undefined>>({
    isOpen: initialOpen,
    data: initialData
  });

  const open = useCallback((payload?: T | undefined) => {
    setState({ isOpen: true, data: payload });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggle = useCallback((next?: boolean, payload?: T | undefined) => {
    setState(prev => {
      const isOpen = typeof next === 'boolean' ? next : !prev.isOpen;
      return {
        isOpen,
        data: payload !== undefined ? payload : prev.data
      };
    });
  }, []);

  const setData = useCallback<React.Dispatch<React.SetStateAction<T | undefined>>>((updater) => {
    setState(prev => {
      const nextData = typeof updater === 'function' ? (updater as (prev: T | undefined) => T | undefined)(prev.data) : updater;
      return { ...prev, data: nextData };
    });
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
    setData
  };
}
