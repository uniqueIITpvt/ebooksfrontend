'use client';

import { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { useInitialSiteLogo } from '@/contexts/SiteConfigContext';

const DEFAULT_LOGO = '/file.svg';

export const useSiteLogo = (initialLogo?: string | null) => {
  const providedLogo = useInitialSiteLogo();
  const resolvedInitialLogo = initialLogo !== undefined ? initialLogo : providedLogo;
  const [siteLogo, setSiteLogo] = useState(resolvedInitialLogo || DEFAULT_LOGO);

  useEffect(() => {
    if (resolvedInitialLogo !== undefined) {
      setSiteLogo(resolvedInitialLogo || DEFAULT_LOGO);
      return;
    }

    let ignore = false;

    fetch(`${API_CONFIG.API_BASE_URL}/settings/public`)
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) {
          setSiteLogo(String(data?.data?.site_logo || DEFAULT_LOGO));
        }
      })
      .catch(() => {
        if (!ignore) setSiteLogo(DEFAULT_LOGO);
      });

    return () => {
      ignore = true;
    };
  }, [resolvedInitialLogo]);

  return siteLogo;
};
