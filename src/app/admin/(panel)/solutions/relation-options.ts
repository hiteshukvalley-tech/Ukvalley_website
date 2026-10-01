import { getServices } from "@/lib/services-store";
import { getIndustries } from "@/lib/industries-store";

export type Option = { value: string; label: string };

/** The services and industries a solution can be linked to, as tick-box options. */
export async function relationOptions(): Promise<{ serviceOptions: Option[]; industryOptions: Option[] }> {
  return {
    serviceOptions: (await getServices()).map((s) => ({ value: s.href.split("/").pop() ?? "", label: s.title })),
    industryOptions: (await getIndustries()).map((i) => ({ value: i.slug, label: i.name })),
  };
}
