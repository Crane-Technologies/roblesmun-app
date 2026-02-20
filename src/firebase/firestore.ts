import { db } from "./firebase";
import { trackFirebaseRequest } from "./requestTracker";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  QueryConstraint,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Query,
} from "firebase/firestore";

export class FirestoreService {
  static async add<T>(collectionName: string, data: T) {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "add",
        metadata: { collectionName },
      },
      async () => {
        const colRef = collection(db, collectionName);
        const docRef = await addDoc(colRef, data as DocumentData);
        return docRef.id;
      }
    );
  }

  static async getAll<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ) {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "getAll",
        metadata: { collectionName, constraintsCount: constraints.length },
      },
      async () => {
        const colRef = collection(db, collectionName);
        const q = constraints.length ? query(colRef, ...constraints) : colRef;
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
      }
    );
  }

  static async getById<T>(collectionName: string, id: string) {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "getById",
        metadata: { collectionName, id },
      },
      async () => {
        const docRef = doc(db, collectionName, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
          ? ({ id: snapshot.id, ...snapshot.data() } as T)
          : null;
      }
    );
  }

  static async update<T>(collectionName: string, id: string, data: Partial<T>) {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "update",
        metadata: { collectionName, id },
      },
      async () => {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data as DocumentData);
      }
    );
  }

  static async delete(collectionName: string, id: string) {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "delete",
        metadata: { collectionName, id },
      },
      async () => {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
      }
    );
  }

  static async set<T>(collectionName: string, id: string, data: T) {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "set",
        metadata: { collectionName, id },
      },
      async () => {
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, data as DocumentData);
      }
    );
  }

  static async getPaginated<T>(
    collectionName: string,
    pageSize: number = 9,
    lastDoc?: DocumentSnapshot | null,
    orderByField: string = "createdAt",
    orderDirection: "asc" | "desc" = "desc"
  ): Promise<{
    data: T[];
    lastVisible: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "getPaginated",
        metadata: {
          collectionName,
          pageSize,
          hasCursor: Boolean(lastDoc),
          orderByField,
          orderDirection,
        },
      },
      async () => {
        try {
          const colRef = collection(db, collectionName);

          let q: Query;
          if (lastDoc) {
            q = query(
              colRef,
              orderBy(orderByField, orderDirection),
              startAfter(lastDoc),
              limit(pageSize + 1)
            );
          } else {
            q = query(
              colRef,
              orderBy(orderByField, orderDirection),
              limit(pageSize + 1)
            );
          }

          const snapshot = await getDocs(q);
          const hasMore = snapshot.docs.length > pageSize;
          const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

          const data = docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          const lastVisible = docs[docs.length - 1] || null;

          return { data, lastVisible, hasMore };
        } catch (error) {
          console.error("Error getting paginated data:", error);
          throw error;
        }
      }
    );
  }

  static async getPaginatedWithFilter<T>(
    collectionName: string,
    filterField: string,
    filterValue: unknown,
    pageSize: number = 9,
    lastDoc?: DocumentSnapshot | null,
    orderByField: string = "createdAt",
    orderDirection: "asc" | "desc" = "desc"
  ): Promise<{
    data: T[];
    lastVisible: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    return trackFirebaseRequest(
      {
        service: "firestore",
        operation: "getPaginatedWithFilter",
        metadata: {
          collectionName,
          filterField,
          pageSize,
          hasCursor: Boolean(lastDoc),
          orderByField,
          orderDirection,
        },
      },
      async () => {
        try {
          const colRef = collection(db, collectionName);

          let q: Query;
          if (lastDoc) {
            q = query(
              colRef,
              where(filterField, "==", filterValue),
              orderBy(orderByField, orderDirection),
              startAfter(lastDoc),
              limit(pageSize + 1)
            );
          } else {
            q = query(
              colRef,
              where(filterField, "==", filterValue),
              orderBy(orderByField, orderDirection),
              limit(pageSize + 1)
            );
          }

          const snapshot = await getDocs(q);
          const hasMore = snapshot.docs.length > pageSize;
          const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

          const data = docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          const lastVisible = docs[docs.length - 1] || null;

          return { data, lastVisible, hasMore };
        } catch (error) {
          console.error("Error getting filtered paginated data:", error);
          throw error;
        }
      }
    );
  }
}
