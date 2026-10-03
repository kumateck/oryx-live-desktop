// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";
import BankingPanel, { maskAccount } from "./banking-panel";
import CertificationsPanel from "./certifications-panel";
import ContactsPanel from "./contacts-panel";
import PricingPanel from "./pricing-panel";

afterEach(() => { cleanup(); forgetSession(); });

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();
const usd = { id: "c1", name: "US Dollar", symbol: "$" };
const data: Record<string, object[]> = {
  contacts: [{ id: "k2", supplierId: "s1", name: "Kofi Boateng", role: "Accounts", email: null, phone: null, isPrimary: false },
    { id: "k1", supplierId: "s1", name: "Ama Owusu", role: "Sales", email: "ama@acme.test", phone: "+233 20 000 0000", isPrimary: true }],
  "bank-details": [{ id: "b1", supplierId: "s1", bankName: "GCB", accountNumber: "1234567890", accountName: "Acme Chemicals", swiftCode: "GHCBGHAC", iban: null, branchAddress: null, currency: usd }],
  certifications: [{ id: "c-ok", supplierId: "s1", certificationType: 0, certificateNumber: "GMP-1", issuingBody: "FDA", issueDate: iso(-100), expiryDate: iso(300), attachments: [] },
    { id: "c-old", supplierId: "s1", certificationType: 1, certificateNumber: "ISO-0", issuingBody: "BSI", issueDate: iso(-800), expiryDate: iso(-10), attachments: [] }],
  "pricing-agreements": [
    { id: "p1", supplierId: "s1", status: 1, changeKind: 0, materialId: "m1", materialName: "Albendazole", uoMId: "u1", uoMName: "Kilogram", agreedPrice: 42.5, priceUoM: "kg", currency: usd, effectiveFrom: iso(-30), effectiveTo: null },
    { id: "p2", supplierId: "s1", status: 0, changeKind: 1, priorAgreedPrice: 40, priorPriceUoM: "kg", priorCurrencySymbol: "$", materialId: "m2", materialName: "Sugar", uoMId: "u1", uoMName: "Kilogram", agreedPrice: 44, priceUoM: "kg", currency: usd, effectiveFrom: iso(5), effectiveTo: iso(400) }],
};

function open(ui: React.ReactNode, permissions: string[] = []) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") { calls.push(`${input.method} ${path}`); return new Response(null, { status: 204 }); }
    const section = /^\/api\/v1\/suppliers\/s1\/(.+)$/.exec(path)?.[1];
    return section && data[section] ? Response.json(data[section]) : new Response(null, { status: 404 });
  });
  render(<SessionProvider><ApiProvider>{ui}</ApiProvider></SessionProvider>);
  return calls;
}
const rowOf = (text: string) => { const row = screen.getByText(text).closest("tr"); if (!row) throw new Error(`no row for ${text}`); return row; };

it("lists contacts with the primary one first and removes one after confirming", async () => {
  const calls = open(<ContactsPanel supplierId="s1" />, ["CanManageSupplierContracts"]);
  await screen.findByText("Ama Owusu");
  expect(screen.getAllByRole("row").slice(1).map((row) => row.textContent?.slice(0, 9))).toEqual(["Ama Owusu", "Kofi Boat"]);
  expect(within(rowOf("Ama Owusu")).getByText("Primary")).toBeTruthy();
  expect(screen.getByRole("link", { name: "ama@acme.test" }).getAttribute("href")).toBe("mailto:ama@acme.test");
  await chooseAction("Actions for Kofi Boateng", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(calls).toEqual(["DELETE /api/v1/suppliers/s1/contacts/k2"]));
});

it("keeps account numbers hidden until one is shown", async () => {
  open(<BankingPanel supplierId="s1" />);
  expect(await screen.findByText("•••• 7890")).toBeTruthy();
  expect(screen.queryByText("1234567890")).toBeNull();
  await chooseAction("Actions for GCB account", "Show account number");
  expect(await screen.findByText("1234567890")).toBeTruthy();
  expect([maskAccount("12"), maskAccount("123456")]).toEqual(["••••", "•••• 3456"]);
});

it("puts the expired certificate first and offers actions only to those who manage certificates", async () => {
  open(<CertificationsPanel supplierId="s1" />, ["CanViewSupplierCertifications"]);
  await screen.findByText("ISO-0");
  expect(screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0]?.textContent)).toEqual(["ISO 9001ISO-0", "GMPGMP-1"]);
  expect(within(rowOf("ISO-0")).getByText("Expired")).toBeTruthy();
  expect(within(rowOf("GMP-1")).getByText("Valid")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Add certification" })).toBeNull();
});

it("shows a proposed price against the one it replaces, and only lets an approved agreement be changed", async () => {
  open(<PricingPanel supplierId="s1" />, ["CanManageSupplierContracts"]);
  await screen.findByText("Albendazole");
  expect(within(rowOf("Sugar")).getByText("$44 per kg")).toBeTruthy();
  expect(within(rowOf("Sugar")).getByText("was $40 per kg")).toBeTruthy();
  expect(within(rowOf("Sugar")).getByText("Pending approval")).toBeTruthy();
  await openMenu("Actions for Sugar pricing");
  const item = screen.getByRole("menuitem", { name: /Propose a change/ });
  expect(item.getAttribute("aria-disabled")).toBe("true");
  expect(item.textContent).toContain("Waiting for approval");
});

 it("hides contact mutations from a supplier viewer without contract access", async () => {
  const calls = open(<ContactsPanel supplierId="s1" />, ["CanViewVendors"]);
  await screen.findByText("Ama Owusu");
  expect(screen.queryByRole("button", { name: "Add contact" })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull();
  expect(calls).toEqual([]);
});
