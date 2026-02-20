import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

type FirebaseService = "firestore" | "auth";

interface TrackFirebaseRequestOptions {
  service: FirebaseService;
  operation: string;
  metadata?: Record<string, unknown>;
}

interface FirebaseRequestLogRecord extends TrackFirebaseRequestOptions {
  status: "success" | "error";
  durationMs: number;
  errorMessage?: string;
}

const FIREBASE_REQUEST_LOGS_COLLECTION = "firebase_request_logs";
const IP_LOOKUP_ENDPOINTS = [
  "https://api.ipify.org?format=json",
  "https://api64.ipify.org?format=json",
];

let cachedIpAddress: string | null | undefined;
let pendingIpAddressPromise: Promise<string | null> | null = null;

function getClientContext() {
  return {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    pagePath: typeof window !== "undefined" ? window.location.pathname : null,
  };
}

async function fetchPublicIpFromEndpoint(endpoint: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { ip?: unknown };
    return typeof data.ip === "string" && data.ip.trim().length > 0
      ? data.ip.trim()
      : null;
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function resolvePublicIpAddress(): Promise<string | null> {
  if (cachedIpAddress !== undefined) {
    return cachedIpAddress;
  }

  if (!pendingIpAddressPromise) {
    pendingIpAddressPromise = (async () => {
      for (const endpoint of IP_LOOKUP_ENDPOINTS) {
        const ipAddress = await fetchPublicIpFromEndpoint(endpoint);
        if (ipAddress) {
          cachedIpAddress = ipAddress;
          return ipAddress;
        }
      }

      cachedIpAddress = null;
      return null;
    })().finally(() => {
      pendingIpAddressPromise = null;
    });
  }

  return pendingIpAddressPromise;
}

async function logFirebaseRequest(record: FirebaseRequestLogRecord): Promise<void> {
  try {
    const ipAddress = await resolvePublicIpAddress();
    const clientContext = getClientContext();

    await addDoc(collection(db, FIREBASE_REQUEST_LOGS_COLLECTION), {
      service: record.service,
      operation: record.operation,
      status: record.status,
      durationMs: record.durationMs,
      metadata: record.metadata ?? {},
      errorMessage: record.errorMessage ?? null,
      ipAddress,
      userId: auth.currentUser?.uid ?? null,
      userAgent: clientContext.userAgent,
      pagePath: clientContext.pagePath,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Unable to persist Firebase request log:", error);
  }
}

export async function trackFirebaseRequest<T>(
  options: TrackFirebaseRequestOptions,
  request: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await request();
    await logFirebaseRequest({
      ...options,
      status: "success",
      durationMs: Date.now() - startTime,
    });
    return result;
  } catch (error) {
    await logFirebaseRequest({
      ...options,
      status: "error",
      durationMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
