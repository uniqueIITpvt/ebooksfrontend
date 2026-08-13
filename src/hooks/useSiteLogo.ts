'use client';

import { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';

const DEFAULT_LOGO = '/file.svg';

export const useSiteLogo = (initialLogo?: string | null) => {
  const [siteLogo, setSiteLogo] = useState(initialLogo || DEFAULT_LOGO);

  useEffect(() => {
    if (initialLogo) {
      setSiteLogo(initialLogo);
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
  }, [initialLogo]);

  return siteLogo;
};
