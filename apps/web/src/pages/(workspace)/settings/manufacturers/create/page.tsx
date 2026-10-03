import { PageHeader } from "@/shared/navigation/page-header";
import { ManufacturerEditor } from "@/modules/manufacturers/components/manufacturer-editor";

export default function CreateManufacturerPage() {
  return <section className="min-w-0 space-y-4"><PageHeader title="Create manufacturer" crumbs={[{ label: "Manufacturers", to: "/settings/manufacturers" }, { label: "Create" }]} />
    <ManufacturerEditor /></section>;
}
