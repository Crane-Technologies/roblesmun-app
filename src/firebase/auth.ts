import { auth } from "./firebase";
import { trackFirebaseRequest } from "./requestTracker";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

function getEmailDomain(email: string): string | null {
  const [, domain] = email.split("@");
  return domain ? domain.toLowerCase() : null;
}

export class AuthService {
  static async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<FirebaseUser> {
    return trackFirebaseRequest(
      {
        service: "auth",
        operation: "register",
        metadata: { emailDomain: getEmailDomain(email) },
      },
      async () => {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
        return userCredential.user;
      }
    );
  }

  static async login(email: string, password: string) {
    return trackFirebaseRequest(
      {
        service: "auth",
        operation: "login",
        metadata: { emailDomain: getEmailDomain(email) },
      },
      async () => {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        return userCredential.user;
      }
    );
  }

  static async logout() {
    return trackFirebaseRequest(
      {
        service: "auth",
        operation: "logout",
      },
      async () => {
        await signOut(auth);
      }
    );
  }

  static getCurrentUser(): Promise<FirebaseUser | null> {
    return trackFirebaseRequest(
      {
        service: "auth",
        operation: "getCurrentUser",
      },
      async () =>
        new Promise<FirebaseUser | null>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
          });
        })
    );
  }

  static async resetPassword(email: string): Promise<void> {
    return trackFirebaseRequest(
      {
        service: "auth",
        operation: "resetPassword",
        metadata: { emailDomain: getEmailDomain(email) },
      },
      async () => {
        await sendPasswordResetEmail(auth, email);
      }
    );
  }
}
