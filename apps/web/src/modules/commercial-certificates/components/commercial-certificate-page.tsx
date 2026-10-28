import { useParams } from "react-router";
import { routinesApi } from "@/modules/qc-routines/api/routines-api";
import { CertificatePage } from "@/modules/qc-routines/components/certificate-view";

export function CommercialCertificatePage() {
  const { id = "" } = useParams();
  const query = routinesApi.useGetCommercialCertificateQuery(id, { skip: !id });
  return <CertificatePage query={query} showPoint={false} heading={() => "Certificate of analysis"}
    subtitle={(certificate) => certificate.combined ? "Combined chemical and microbial analysis" : "Single analysis type"}
    crumbs={(certificate) => [{ label: "Certificates of analysis" }, { label: certificate.certificateCode ?? "Certificate" }]} />;
}
