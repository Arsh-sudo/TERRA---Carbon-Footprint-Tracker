import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  GoogleAuthProvider
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from "firebase/firestore";
import { auth, db, googleProvider, gmailProvider, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  reconnectGmail: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Sign in with Google Popup
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign in popup error in Context:", error);
      throw error;
    }
  };

  // Re-fetch token/re-authenticate if token expired or is null after refresh
  const reconnectGmail = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, gmailProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (error) {
      console.error("Reconnect Google error in Context:", error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setAccessToken(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Update user profile inside firestore
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      const currentData = profile || {
        uid: user.uid,
        name: user.displayName || "Climate Explorer",
        photoURL: user.photoURL || "",
        joinedDate: new Date().toISOString().split("T")[0],
        ecoPoints: 0,
        totalSavedCO2: 0,
        dailyStreak: 1,
        weeklyTarget: 8.0,
      };

      const newData: UserProfile = {
        ...currentData,
        ...updates,
        uid: user.uid, // enforce UID immutability
      };

      // Set/update the document
      await setDoc(userDocRef, newData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Listen to User Profile changes when user is signed in
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let isSubscribed = true;
    let unsubscribeSnapshot: (() => void) | null = null;

    const setupProfile = async () => {
      const userDocRef = doc(db, "users", user.uid);

      // Try reading user profile to see if it exists
      let profileDocSnap;
      try {
        profileDocSnap = await getDoc(userDocRef);
      } catch (error) {
        if (isSubscribed) {
          console.error("Error executing initial profile getDoc:", error);
        }
      }

      if (!isSubscribed) return;

      // If document doesn't exist, create it as our default bootstrapped profile
      if (!profileDocSnap || !profileDocSnap.exists()) {
        const initialProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || "Climate Explorer",
          photoURL: user.photoURL || "",
          joinedDate: new Date().toISOString().split("T")[0],
          ecoPoints: 150, // Welcome points
          totalSavedCO2: 14.5,
          dailyStreak: 3,
          weeklyTarget: 8.0,
        };

        try {
          await setDoc(userDocRef, initialProfile);
          if (isSubscribed) {
            setProfile(initialProfile);
          }
        } catch (error) {
          if (isSubscribed) {
            handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          }
        }
      }

      if (!isSubscribed) return;

      // Configure a reactive Realtime listener to stay synchronized across devices/tabs
      unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (isSubscribed && snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
          if (isSubscribed) {
            setLoading(false);
          }
        },
        (error) => {
          if (isSubscribed) {
            // Check if we still have an active authenticated user with the matching UID
            if (auth.currentUser?.uid === user.uid) {
              handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            }
            setLoading(false);
          }
        }
      );
    };

    setLoading(true);
    setupProfile();

    return () => {
      isSubscribed = false;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        accessToken,
        signInWithGoogle,
        logout,
        updateProfile,
        reconnectGmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
