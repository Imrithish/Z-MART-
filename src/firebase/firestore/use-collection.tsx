'use client';

import { useEffect, useState } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  getDocsFromCache,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Try instant cache for fast UI response
    getDocsFromCache(query)
      .then((snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          ...(doc.data() as any),
          id: doc.id,
        }));
        if (items.length > 0) {
          setData(items);
          setLoading(false);
        }
      })
      .catch(() => {
        // Ignore cache miss
      });
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...(doc.data() as any),
          id: doc.id,
        }));
        setData(items);
        setLoading(false);
      },
      async (serverError: any) => {
        // Log the actual server error to the console for internal debugging
        console.error("Firestore Error:", serverError);
        
        // Extract the path from the query if possible, otherwise use a descriptive placeholder
        const path = (query as any)._query?.path?.toString() || 'collection/query';
        
        const permissionError = new FirestorePermissionError({
          path: path,
          operation: 'list',
        });
        
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
