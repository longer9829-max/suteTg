import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user to firestore
        try {
          const publicRef = doc(db, 'users', user.uid, 'public', 'profile');
          const privateRef = doc(db, 'users', user.uid, 'private', 'info');
          
          const publicSnap = await getDoc(publicRef);
          if (!publicSnap.exists()) {
            await setDoc(publicRef, {
              uid: user.uid,
              displayName: user.displayName || 'Anonymous',
              photoURL: user.photoURL || '',
              lastSeen: serverTimestamp(),
            });
            await setDoc(privateRef, {
              email: user.email || '',
              createdAt: serverTimestamp(),
            });
          } else {
            await setDoc(publicRef, { lastSeen: serverTimestamp() }, { merge: true });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
