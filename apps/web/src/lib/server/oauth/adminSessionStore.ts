const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const KEY_PREFIX = "admin-session:";

interface StoredSession {
  did: string;
  expiresAt: number;
}

export interface AdminSessionStoreOptions {
  ttlSeconds?: number;
}

/**
 * Gates who's allowed to use /admin. This is deliberately separate from the OAuth
 * client's own session store: that one persists PDS tokens so the *server* can make
 * authenticated writes, but says nothing about which *browser* is allowed to trigger
 * them. An opaque, unguessable token in an HttpOnly cookie is the actual access gate.
 */
export class AdminSessionStore {
  private readonly ttlSeconds: number;

  constructor(
    private readonly namespace: KVNamespace,
    options: AdminSessionStoreOptions = {}
  ) {
    this.ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  }

  /** Create a new session for `did`, returning the opaque token to store in a cookie. */
  async create(did: string): Promise<string> {
    const token = crypto.randomUUID();
    const session: StoredSession = { did, expiresAt: Date.now() + this.ttlSeconds * 1000 };
    await this.namespace.put(KEY_PREFIX + token, JSON.stringify(session), {
      expirationTtl: this.ttlSeconds
    });
    return token;
  }

  /** Resolve a token to its DID, or null if the token is missing/expired. */
  async verify(token: string): Promise<string | null> {
    const raw = await this.namespace.get(KEY_PREFIX + token);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (session.expiresAt < Date.now()) return null;
    return session.did;
  }

  async destroy(token: string): Promise<void> {
    await this.namespace.delete(KEY_PREFIX + token);
  }
}
