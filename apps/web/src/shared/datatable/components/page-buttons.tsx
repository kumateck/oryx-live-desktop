import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageWindow } from "../lib/pagination";

export function PageButtons({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  return <nav aria-label="Pagination" className="flex items-center gap-1">
    <Button type="button" size="icon-sm" variant="outline" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft /></Button>
    {pageWindow(page, pages).map((item, index) => item === "gap" ? <span key={`gap-${index}`} aria-hidden="true" className="px-1">…</span> :
      <Button key={item} type="button" size="sm" variant={item === page ? "default" : "outline"} className="h-7 min-w-7 px-2 text-xs"
        aria-label={`Page ${item}`} {...(item === page ? { "aria-current": "page" as const } : {})} onClick={() => onChange(item)}>{item}</Button>)}
    <Button type="button" size="icon-sm" variant="outline" aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight /></Button>
  </nav>;
}
