import React, { createContext, useContext, useMemo } from 'react';
import { PharbitClient } from '../../../sdk/index.js';

const ClientCtx = createContext(null);

export function PharbitClientProvider({ baseUrl, children }) {
  const client = useMemo(() => new PharbitClient(baseUrl), [baseUrl]);
  return <ClientCtx.Provider value={client}>{children}</ClientCtx.Provider>;
}

export function usePharbit() {
  const client = useContext(ClientCtx);
  if (!client) throw new Error('Wrap with <PharbitClientProvider>');
  return client;
}

