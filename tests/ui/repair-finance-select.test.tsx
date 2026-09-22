// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FinanceRecordSelect } from "@/features/admin/finance/finance-record-select";
import { FormDraftProvider, useFormDraft } from "@/features/admin/shared/form-draft-provider";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const first = { id: "first", label: "First client" };
const distant = { id: "distant", label: "Distant client" };
function Editor({ record }: { record: string }) {
  const draft = useFormDraft(record);
  return <form ref={draft.formRef} onChangeCapture={draft.capture}>
    <FinanceRecordSelect entity="clients" name="clientId" label="Client" initialOptions={[first]} defaultValue="first" />
  </form>;
}
function Harness({ record }: { record: string }) {
  return <FormDraftProvider><Editor key={record} record={record} /></FormDraftProvider>;
}
describe("finance searchable controlled selection", () => {
  it("scopes case search to the chosen client and does not silently clear an unavailable association", async () => {
    const lookup = vi.fn(async (url: string) => {
      const clientId = new URL(url, "https://example.test").searchParams.get("clientId");
      return new Response(JSON.stringify({ data: { items: clientId === "one" ? [first] : [], selected: clientId === "one" ? first : null, total: clientId === "one" ? 1 : 0, page: 1, pageSize: 20 } }), { status: 200 });
    });
    vi.stubGlobal("fetch", lookup);
    render(<form><select aria-label="Client scope" name="clientId" defaultValue="one"><option value="one">One</option><option value="two">Two</option></select>
      <FinanceRecordSelect entity="cases" clientId="one" name="caseId" label="Case" initialOptions={[first]} defaultValue={first.id} />
    </form>);
    await waitFor(() => expect(lookup).toHaveBeenCalledWith(expect.stringContaining("clientId=one"), expect.anything()));
    fireEvent.change(screen.getByLabelText("Client scope"), { target: { value: "two" } });
    await waitFor(() => expect(lookup).toHaveBeenCalledWith(expect.stringContaining("clientId=two"), expect.anything()));
    const caseSelect = screen.getByRole("combobox", { name: "Case" }) as HTMLSelectElement;
    await waitFor(() => expect(caseSelect.validity.valid).toBe(false));
    expect(caseSelect.value).toBe(first.id);
  });
  it("restores an off-page draft selection without reverting its association", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const selectedId = new URL(url, "https://example.test").searchParams.get("selectedId");
      return new Response(JSON.stringify({ data: { items: [first, distant], selected: selectedId === distant.id ? distant : first, total: 2, page: 1, pageSize: 20 } }), { status: 200 });
    }));
    const { rerender } = render(<Harness record="invoice-a" />);
    await screen.findByRole("option", { name: distant.label });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: distant.id } });
    rerender(<Harness record="invoice-b" />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(first.id);
    rerender(<Harness record="invoice-a" />);
    await waitFor(() => expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(distant.id));
    await screen.findByRole("option", { name: distant.label });
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(distant.id);
  });
});
