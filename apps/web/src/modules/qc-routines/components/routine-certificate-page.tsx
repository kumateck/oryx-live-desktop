import { useParams } from "react-router";
import { routinesApi } from "../api/routines-api";
import { routinePath, routinesPath } from "../lib/routines";
import { CertificatePage } from "./certificate-view";

export function RoutineCertificatePage() {
  const { id = "" } = useParams();
  const query = routinesApi.useGetRoutineCertificateQuery(id, { skip: !id });
  return <CertificatePage query={query} showPoint coverage
    heading={(certificate) => certificate.combined ? "Water analytical certificate" : "Environmental monitoring certificate"}
    subtitle={(certificate) => certificate.combined ? "Chemical and microbial results for one water sample" : "Microbial results for the monitored areas"}
    crumbs={(certificate) => [{ label: "Routine tests", to: routinesPath }, ...(certificate.routineExecutionId ? [{ label: "Routine", to: routinePath(certificate.routineExecutionId) }] : []), { label: certificate.certificateCode ?? "Certificate" }]} />;
}
