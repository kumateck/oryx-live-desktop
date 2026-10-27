import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReportBook } from "./report-data";
export function AppliedFilterDetails({book}:{book:ReportBook}) {
  const [open,setOpen]=useState(false);
  return <><Button variant="outline" onClick={()=>setOpen(true)}>Filter details</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Applied report filters</DialogTitle><DialogDescription>{book.title} · Generated {new Date(book.generatedAt).toLocaleString()}</DialogDescription></DialogHeader>
      <DialogBody><dl className="space-y-3">{book.filters.map((filter)=><div key={filter.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3"><dt className="text-muted-foreground">{filter.label}</dt><dd className="break-words">{filter.value}</dd></div>)}</dl></DialogBody>
      <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Close</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
