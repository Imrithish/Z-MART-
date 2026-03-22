'use client';

import { useEffect, useState } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  DocumentSnapshot,
  getDocFromCache,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Try instant cache for fast UI response
    getDocFromCache(docRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as any), id: snapshot.id });
          setLoading(false);
        }
      })
      .catch(() => {
        // Ignore cache miss
      });
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...(snapshot.data() as any), id: snapshot.id } : null);
        setLoading(false);
      },
      async (serverError: any) => {
        console.error("Firestore Error:", serverError);
        
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
