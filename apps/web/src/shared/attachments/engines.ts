export const viewerPolicy = "readonly-v1";
export const engines = {
  docx: { name: "wordcraft", revision: "eae242176108d328c5dd81fbc10370c51ab90706", archive: "77c63330ea69e8cf07e0ff45279ffe619140884ec072cc4fdbfcb24d45d24ee8" },
  pdf: { name: "pdfcraft", revision: "53a5880386789fc3531e54f6e6ffdef9a8e41f1a", archive: "6ec9aaa6119e39cc8bb4f3b287dcf188c5c7967ae5d611e577d6b2158195438f" },
  xlsx: { name: "gridcraft", revision: "d9d09f0baa912e88c5111107903fc8c640214b57", archive: "ebe7de1f6905f02c85493c58b711bd99011641683cad7e9e26685df6a5728191" },
} as const;
export type DocumentFormat = keyof typeof engines;
export const engineDirectory = (format: DocumentFormat) => `/viewers/${engines[format].name}-${engines[format].revision.slice(0, 12)}-${engines[format].archive.slice(0, 12)}`;
