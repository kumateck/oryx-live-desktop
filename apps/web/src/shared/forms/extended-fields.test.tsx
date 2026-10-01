// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import { FormWizard, type WizardField } from "./form-wizard";
import { InputTypes } from "./input-types";

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

interface Values {
  choice: string | null;
  enabled: boolean;
  quantity: number;
  start: string | null;
  duration: string | null;
}
const fields = [
  { type: InputTypes.LABEL, id: "section", label: "Settings", text: "Choose values" },
  { type: InputTypes.RADIO, name: "choice", label: "Choice", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
  { type: InputTypes.SWITCH, name: "enabled", label: "Enabled" },
  { type: InputTypes.SLIDER, name: "quantity", label: "Quantity", min: 0, max: 10 },
  { type: InputTypes.CLOCK, name: "start", label: "Start" },
  { type: InputTypes.MOMENT, name: "duration", label: "Duration" },
  { type: InputTypes.SPACE, id: "gap", size: "sm" },
  { type: InputTypes.SUBMIT, id: "save", label: "Save" },
] as const satisfies readonly WizardField<Values>[];

it("submits shadcn basic controls, time values, and layout submit", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: Values) => void>();
  function Example() {
    const form = useForm<Values>({ defaultValues: { choice: null, enabled: false, quantity: 2, start: null, duration: null } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={fields} /></form>;
  }
  render(<Example />);
  await screen.findByRole("radio", { name: "Yes" });
  expect(screen.getByText("Choose values")).toBeTruthy();
  await user.click(screen.getByRole("radio", { name: "Yes" }));
  await user.click(screen.getByRole("switch", { name: "Enabled" }));
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "14:25" } });
  await user.type(screen.getByRole("spinbutton", { name: "Hours" }), "2");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0]).toMatchObject({
    choice: "yes", enabled: true, quantity: 2, start: "02:25 PM", duration: "2 hours",
  }));
});

it("keeps the legacy variable-duration option", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: { duration: string | null }) => void>();
  const durationFields = [
    { type: InputTypes.MOMENT, name: "duration", label: "Duration" },
    { type: InputTypes.SUBMIT, id: "save-duration", label: "Save duration" },
  ] as const satisfies readonly WizardField<{ duration: string | null }>[];
  function DurationForm() {
    const form = useForm<{ duration: string | null }>({ defaultValues: { duration: null } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={durationFields} /></form>;
  }
  render(<DurationForm />);
  await user.click(await screen.findByRole("checkbox", { name: "Time varies" }));
  expect(screen.getByRole("spinbutton", { name: "Hours" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Save duration" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].duration).toBe("Varies"));
});

it("selects and removes files while respecting type limits", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: { documents: File[] }) => void>();
  const uploadFields = [{ type: InputTypes.UPLOAD, mode: "multiple", name: "documents", label: "Documents", accept: ".pdf", maxSizeBytes: 10 }] as const satisfies readonly WizardField<{ documents: File[] }>[];
  function UploadForm() {
    const form = useForm<{ documents: File[] }>({ defaultValues: { documents: [] } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={uploadFields} /><button type="submit">Save</button></form>;
  }
  render(<UploadForm />);
  const input = await screen.findByLabelText("Documents");
  await user.upload(input, new File(["ok"], "valid.pdf", { type: "application/pdf" }));
  expect(screen.getByText("valid.pdf")).toBeTruthy();
  fireEvent.change(input, { target: { files: [new File(["too large!!!"], "large.pdf", { type: "application/pdf" })] } });
  expect(screen.getByRole("alert").textContent).toContain("rejected");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].documents[0]?.name).toBe("valid.pdf"));
  await user.click(screen.getByRole("button", { name: "Remove valid.pdf" }));
  expect(screen.queryByText("valid.pdf")).toBeNull();
});

it("reports persisted attachment removal without mutating the server value itself", async () => {
  const user = userEvent.setup();
  const onPersistedChange = vi.fn();
  const existing = [{ id: "attachment-1", name: "approved.pdf" }];
  const attachmentFields = [{ type: InputTypes.UPLOAD, mode: "multiple", name: "documents", label: "Documents",
    persisted: existing, onPersistedChange }] as const satisfies readonly WizardField<{ documents: File[] }>[];
  function AttachmentForm() {
    const form = useForm<{ documents: File[] }>({ defaultValues: { documents: [] } });
    return <FormWizard form={form} fields={attachmentFields} />;
  }
  render(<AttachmentForm />);
  await user.click(await screen.findByRole("button", { name: "Remove approved.pdf" }));
  expect(onPersistedChange).toHaveBeenCalledWith([]);
  expect(screen.getByText("approved.pdf")).toBeTruthy();
});

it("previews an image and submits its File without encoding it during rendering", async () => {
  const user = userEvent.setup();
  const createUrl = vi.fn(() => "blob:preview");
  const revokeUrl = vi.fn();
  URL.createObjectURL = createUrl;
  URL.revokeObjectURL = revokeUrl;
  const submit = vi.fn<(values: { photo: File | null }) => void>();
  const imageFields = [{ type: InputTypes.IMAGE, name: "photo", label: "Photo" }] as const satisfies readonly WizardField<{ photo: File | null }>[];
  function ImageForm() {
    const form = useForm<{ photo: File | null }>({ defaultValues: { photo: null } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={imageFields} /><button type="submit">Save</button></form>;
  }
  render(<ImageForm />);
  const image = new File(["pixels"], "photo.png", { type: "image/png" });
  await user.upload(await screen.findByLabelText("Photo"), image);
  expect(await screen.findByRole("img", { name: "Photo preview" })).toHaveProperty("src", "blob:preview");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].photo).toBe(image));
  await user.click(screen.getByRole("button", { name: "Remove image" }));
  await waitFor(() => expect(screen.queryByRole("img", { name: "Photo preview" })).toBeNull());
  expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
});

it("exports a signature on pointer release and clears it explicitly", async () => {
  const user = userEvent.setup();
  const context = { clearRect: vi.fn(), drawImage: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() };
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: () => context });
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", { configurable: true, value: () => "data:image/png;base64,c2ln" });
  const submit = vi.fn<(values: { signature: string | null }) => void>();
  const signatureFields = [{ type: InputTypes.SIGNATURE, name: "signature", label: "Signature" }] as const satisfies readonly WizardField<{ signature: string | null }>[];
  function SignatureForm() {
    const form = useForm<{ signature: string | null }>({ defaultValues: { signature: null } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={signatureFields} /><button type="submit">Save</button></form>;
  }
  render(<SignatureForm />);
  const canvas = await screen.findByLabelText("Signature drawing area");
  fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 5, clientY: 5 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 20, clientY: 20 });
  fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 20, clientY: 20 });
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].signature).toBe("data:image/png;base64,c2ln"));
  await user.click(screen.getByRole("button", { name: "Clear signature" }));
  expect(context.clearRect).toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit.mock.calls.at(-1)?.[0].signature).toBeNull());
});
