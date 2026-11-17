import logoUrl from "../../../../../assets/company-logo.png";

/** The company as it appears at the top of every printed document. Change it here and every document follows. */
export const company = {
  name: "Entrance Pharmaceuticals & Research Centre",
  address: "No. 16 Okpoi Gonno, Spintex Road, Accra",
  phone: "+233 302 234375 / 250948",
  email: "info@entranceindustries.com",
  website: "www.entranceindustries.com",
  logoUrl,
  /** Annexure numbers of controlled forms printed from Oryx. */
  documents: { productTestRequest: "QAD/SOP/046/F02-04" },
} as const;
