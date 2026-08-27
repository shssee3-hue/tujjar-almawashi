"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

export const BANNED_MESSAGE = "تم حظر حسابك من قبل إدارة المنصة.";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSystemOwner: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isSystemOwner: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    const unsubDoc = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) };
        // A banned account is force-signed-out the instant this fires — whether
        // that's right after login (see login/page.tsx's own earlier check for
        // the normal case) or live, mid-session, if an admin bans someone who
        // is already browsing the site in another tab.
        if (data.banned) {
          firebaseSignOut(auth);
          toast.error(BANNED_MESSAGE);
          setProfile(null);
          setLoading(false);
          return;
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubDoc();
  }, [firebaseUser]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        isAdmin: profile?.role === "admin" || profile?.role === "owner",
        isSystemOwner: profile?.role === "owner",
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
