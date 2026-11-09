"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { TestCase } from "@/src/app/types/testmind";
import { updateTestCase } from "@/src/app/actions/suites";
import Modal, { btnGhost, btnPrimary, fieldClass, labelClass } from "./Modal";

type Props = {
  suiteId: string;
  testCase: TestCase | null;
  onClose: () => void;
  onSaved: (testCases: TestCase[]) => void;
};

const TYPES: { value: TestCase["type"]; label: string }[] = [
  { value: "happy", label: "Happy path" },
  { value: "negative", label: "Negative" },
  { value: "edge", label: "Edge case" },
];

export default function CaseModal({ suiteId, testCase, onClose, onSaved }: Props) {
  const [type, setType] = useState<TestCase["type"]>("happy");
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!testCase) return;
    setType(testCase.type);
    setTitle(testCase.title);
    setSteps(testCase.steps.join("\n"));
    setExpected(testCase.expected);
  }, [testCase]);

  const stepList = steps.split("\n").map((step) => step.trim()).filter(Boolean);
  const ready = Boolean(title.trim() && expected.trim() && stepList.length);

  const save = async () => {
    if (!testCase || !ready || busy) return;
    setBusy(true);
    try {
      const result = await updateTestCase(suiteId, testCase.id, { type, title, steps: stepList, expected });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onSaved(result.testCases);
      toast.success("Test case saved");
      onClose();
    } catch {
      toast.error("Could not save the test case. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(testCase)}
      onClose={onClose}
      busy={busy}
      onSubmit={ready ? save : undefined}
      title="Edit test case"
      width="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy || !ready}>
            {busy ? "Saving..." : "Save test case"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="case-type" className={labelClass}>Type</label>
          <select id="case-type" value={type} onChange={(e) => setType(e.target.value as TestCase["type"])} className={fieldClass}>
            {TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="case-title" className={labelClass}>Title</label>
          <input id="case-title" type="text" maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="case-steps" className={labelClass}>Steps <span className="font-normal text-gray-400">(one per line)</span></label>
          <textarea id="case-steps" rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} className={`${fieldClass} resize-y`} />
        </div>
        <div>
          <label htmlFor="case-expected" className={labelClass}>Expected result</label>
          <textarea id="case-expected" rows={2} maxLength={2000} value={expected} onChange={(e) => setExpected(e.target.value)} className={`${fieldClass} resize-y`} />
        </div>
      </div>
    </Modal>
  );
}
