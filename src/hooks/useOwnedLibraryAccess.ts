'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, type LibraryItem } from '@/services/api/libraryApi';
import { tokenStore } from '@/services/api/tokenStore';
import { generateBookSlug } from '@/utils/slugify';

type MatchableItem = {
  id?: string;
  _id?: string;
  slug?: string;
  title?: string;
};

const itemKeys = (item: MatchableItem) =>
  [item.slug, item.id, item._id, item.title, item.title ? generateBookSlug(item.title) : undefined]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

export const isPurchasedLibraryItem = (
  libraryItem: LibraryItem,
  item: MatchableItem,
  itemType: LibraryItem['itemType'] = 'ebook'
) => {
  if (
    libraryItem.itemType !== itemType ||
    libraryItem.accessMode !== 'purchase' ||
    libraryItem.status !== 'active'
  ) {
    return false;
  }

  const keys = itemKeys(item);
  const libraryKeys = [
    libraryItem.slug,
    libraryItem.itemId,
    libraryItem.title,
    libraryItem.title ? generateBookSlug(libraryItem.title) : undefined,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return keys.some((key) => libraryKeys.includes(key));
};

export function useOwnedLibraryAccess() {
  const { user } = useAuth();
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadLibraryItems = useCallback(async () => {
    const token = tokenStore.getAccessToken();

    if (!token) {
      setLibraryItems([]);
      setLoaded(true);
      return;
    }

    try {
      const response = await libraryApi.getMyLibrary();
      setLibraryItems(response.success ? response.data : []);
    } catch {
      setLibraryItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setLoaded(false);
    loadLibraryItems();
    window.addEventListener('library:changed', loadLibraryItems);

    return () => {
      window.removeEventListener('library:changed', loadLibraryItems);
    };
  }, [loadLibraryItems, user?._id]);

  const isOwned = useCallback(
    (item: MatchableItem, itemType: LibraryItem['itemType'] = 'ebook') =>
      libraryItems.some((libraryItem) => isPurchasedLibraryItem(libraryItem, item, itemType)),
    [libraryItems]
  );

  return { isOwned, libraryItems, loaded };
}
