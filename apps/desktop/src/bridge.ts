export interface SiteStatus {
  siteUrl: string;
  error: string;
}

export interface ConnectionBridge {
  getStatus(): Promise<SiteStatus>;
  setSiteUrl(url: string): Promise<SiteStatus>;
}

/** The kept sign-in of the connected server, encrypted by the operating system. Refused to any other page. */
export interface SessionBridge {
  load(): Promise<string | null>;
  save(refreshToken: string | null): Promise<void>;
}

declare global {
  interface Window { oryxConnection: ConnectionBridge; oryxSession: SessionBridge }
}
