"use client";

import type React from "react";
import { createContext, useContext, useEffect } from "react";

type RealtimeContextType = {
  emitPackageAdded: () => void;
  emitPackageDeleted: () => void;
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

export const eventEmitter = {
  listeners: new Set<() => void>(),
  emit: function () {
    this.listeners.forEach((listener) => listener());
  },
  subscribe: function (listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const emitPackageAdded = () => {
    eventEmitter.emit();
  };

  const emitPackageDeleted = () => {
    eventEmitter.emit();
  };

  return (
    <RealtimeContext.Provider value={{ emitPackageAdded, emitPackageDeleted }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtimeListener = (callback: () => void) => {
  useEffect(() => {
    const unsubscribe = eventEmitter.subscribe(callback);
    return unsubscribe;
  }, [callback]);
};
