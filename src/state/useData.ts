import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Load something out of the database, and reload it whenever the screen comes
 * back into focus.
 *
 * The app is single-user and offline, so screens can simply re-read what they
 * need on focus rather than maintaining a client-side cache that has to be
 * invalidated.
 */
export function useData<T>(
  loader: (db: SQLiteDatabase) => Promise<T>,
  initial: T,
): { data: T; loading: boolean; reload: () => void } {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loader(db)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        // A read failing should not take the screen down with it; the empty
        // state is a safe thing to show.
        console.warn('Failed to load data', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `loader` is expected to be a stable useCallback from the calling screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, nonce, loader]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, loading, reload };
}
