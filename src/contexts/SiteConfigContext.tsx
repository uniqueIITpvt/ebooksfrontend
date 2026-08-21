'use client';

import { createContext, useContext } from 'react';

type PublicSettings = Record<string, unknown>;

interface SiteConfigContextValue {
  siteLogo: string | null;
  publicSettings: PublicSettings;
}

const SiteConfigContext = createContext<SiteConfigContextValue | undefined>(undefined);

export function SiteConfigProvider({
  siteLogo,
  publicSettings,
  children,
}: {
  siteLogo: string | null;
  publicSettings: PublicSettings;
  children: React.ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={{ siteLogo, publicSettings }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export const useInitialSiteLogo = () => useContext(SiteConfigContext)?.siteLogo;
export const usePublicSettings = () => useContext(SiteConfigContext)?.publicSettings;
