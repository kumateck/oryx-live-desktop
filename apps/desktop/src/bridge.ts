export interface SiteStatus {
  siteUrl: string;
  error: string;
}

export interface ConnectionBridge {
  getStatus(): Promise<SiteStatus>;
  setSiteUrl(url: string): Promise<SiteStatus>;
}

declare global {
  interface Window { oryxConnection: ConnectionBridge }
}
