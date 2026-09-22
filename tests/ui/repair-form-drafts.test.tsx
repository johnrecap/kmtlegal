// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormDraftProvider, useFormDraft } from "@/features/admin/shared/form-draft-provider";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function Form({ record }: { record: string }) {
  const draft = useFormDraft(`invoice:${record}`);
  return <form ref={draft.formRef} onChangeCapture={draft.capture}>
    <input aria-label="amount" name="amount" defaultValue={record === "a" ? "100" : "200"} />
    <button type="button" onClick={draft.clear}>save</button>
    <button type="button" onClick={draft.discard}>discard</button>
    {draft.restored ? <span>restored</span> : null}
  </form>;
}
function Harness({ record, user = "one" }: { record: string; user?: string }) {
  return <FormDraftProvider key={user}><Form key={record} record={record} /></FormDraftProvider>;
}
describe("session-only record draft recovery", () => {
  it("isolates records and restores edits after back/forward remount", () => {
    const { rerender } = render(<Harness record="a" />);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "155" } });
    rerender(<Harness record="b" />);
    expect((screen.getByLabelText("amount") as HTMLInputElement).value).toBe("200");
    rerender(<Harness record="a" />);
    expect((screen.getByLabelText("amount") as HTMLInputElement).value).toBe("155");
    expect(screen.getByText("restored")).toBeTruthy();
    fireEvent.click(screen.getByText("discard"));
    expect((screen.getByLabelText("amount") as HTMLInputElement).value).toBe("100");
    rerender(<Harness record="b" />);
    rerender(<Harness record="a" />);
    expect(screen.queryByText("restored")).toBeNull();
  });
  it("never restores another account's session drafts", () => {
    const { rerender } = render(<Harness record="a" />);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "155" } });
    rerender(<Harness record="a" user="two" />);
    expect((screen.getByLabelText("amount") as HTMLInputElement).value).toBe("100");
  });
  it("clears saved drafts and warns before a real page unload", () => {
    const { rerender } = render(<Harness record="a" />);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "155" } });
    const dirtyUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyUnload);
    expect(dirtyUnload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByText("save"));
    const cleanUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanUnload);
    expect(cleanUnload.defaultPrevented).toBe(false);
    rerender(<Harness record="b" />);
    rerender(<Harness record="a" />);
    expect((screen.getByLabelText("amount") as HTMLInputElement).value).toBe("100");
    expect(screen.queryByText("restored")).toBeNull();
  });
  it("allows cancelling navigation without losing the draft", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<><Harness record="a" /><a href="/admin/finance?edit=b">other invoice</a></>);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "155" } });
    expect(fireEvent.click(screen.getByText("other invoice"))).toBe(false);
    expect((screen.getByLabelText("amount") as HTMLInputElement).value).toBe("155");
  });
});
