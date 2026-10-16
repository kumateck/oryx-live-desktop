import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptySection, type FormType, type TemplateSection } from "../lib/template-model";
import { AddQuestionsDialog } from "./add-questions-dialog";
import { SectionCard } from "./section-card";

/** The tests of a template: add, reorder, group several under one heading, and pick the questions of each. */
export function SectionsEditor({ sections, setSections, formType }: { sections: TemplateSection[]; setSections: Dispatch<SetStateAction<TemplateSection[]>>; formType: FormType }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(sections[0] ? [sections[0].key] : []));
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [picking, setPicking] = useState<string | null>(null);
  const [grouping, setGrouping] = useState(false);
  const [group, setGroup] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const flip = (set: ReadonlySet<string>, key: string) => { const next = new Set(set); if (next.has(key)) next.delete(key); else next.add(key); return next; };
  const update = (next: TemplateSection) => setSections((list) => list.map((entry) => entry.key === next.key ? next : entry));
  const add = () => { const section = emptySection(); setSections((list) => [...list, section]); setOpen(new Set([section.key])); };
  const reorder = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setSections((list) => { const from = list.findIndex((entry) => entry.key === active.id); const to = list.findIndex((entry) => entry.key === over.id); return from >= 0 && to >= 0 ? arrayMove(list, from, to) : list; });
  };
  const target = sections.find((entry) => entry.key === picking);
  return <section aria-label="Tests" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Tests</h2>
      <div className="flex flex-wrap items-center gap-2">
        {selected.size >= 2 ? <><span className="text-sm text-muted-foreground">{selected.size} selected</span><Button type="button" size="sm" variant="outline" onClick={() => setSelected(new Set())}>Clear selection</Button>
          <Button type="button" size="sm" onClick={() => { setGroup(""); setGrouping(true); }}><Users />Group</Button></> : null}
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus />Add test</Button>
        {sections.length > 1 ? <><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(new Set(sections.map((entry) => entry.key)))}>Expand all</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(new Set())}>Collapse all</Button></> : null}
      </div></div>
    {sections.length === 0 ? <div className="rounded-lg border border-dashed p-6 text-center"><p className="mb-2 text-sm">No tests yet.</p><Button type="button" variant="outline" onClick={add}><Plus />Add the first test</Button></div>
      : <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={reorder}>
        <SortableContext items={sections.map((entry) => entry.key)} strategy={verticalListSortingStrategy}><ol className="space-y-3">
          {sections.map((section, index) => <SectionCard key={section.key} section={section} index={index} open={open.has(section.key)} selected={selected.has(section.key)} canRemove={sections.length > 1}
            onToggle={() => setOpen((set) => flip(set, section.key))} onSelect={() => setSelected((set) => flip(set, section.key))} onChange={update} onAddQuestions={() => setPicking(section.key)}
            onRemove={() => { setSections((list) => list.filter((entry) => entry.key !== section.key)); setSelected((set) => { const next = new Set(set); next.delete(section.key); return next; }); }} />)}
        </ol></SortableContext></DndContext>}
    {target ? <AddQuestionsDialog current={target.questions} formType={formType} onClose={() => setPicking(null)}
      onConfirm={(questions) => { const kept = target.questions.filter((entry) => questions.some((chosen) => chosen.questionId === entry.questionId));
        const added = questions.filter((chosen) => !target.questions.some((entry) => entry.questionId === chosen.questionId)); update({ ...target, questions: [...kept, ...added] }); setPicking(null); }} /> : null}
    {grouping ? <Dialog open onOpenChange={(value) => { if (!value) setGrouping(false); }}><DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Group {selected.size} tests</DialogTitle><DialogDescription>Grouped tests are shown under one heading, for example Assay or Dilution.</DialogDescription></DialogHeader>
      <DialogBody><div className="space-y-1.5"><Label htmlFor="group-name">Group name</Label><Input id="group-name" autoFocus value={group} onChange={(event) => setGroup(event.target.value)} placeholder="e.g. Assay" /></div></DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setGrouping(false)}>Cancel</Button>
        <Button type="button" disabled={!group.trim()} onClick={() => { setSections((list) => list.map((entry) => selected.has(entry.key) ? { ...entry, groupName: group.trim() } : entry)); setSelected(new Set()); setGrouping(false); }}>Group tests</Button></DialogFooter>
    </DialogContent></Dialog> : null}
  </section>;
}
