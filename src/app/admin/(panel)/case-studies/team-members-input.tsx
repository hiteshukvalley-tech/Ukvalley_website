"use client";

import { useRef, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/admin/toast";

export const TEAM_MEMBER_MAX = 60;
export const TEAM_MAX_MEMBERS = 30;

/** "6 people" — what the case-study page shows for a team made of named members. */
export const teamSummary = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/**
 * Team field: a row of member names with a + button. Click +, type a name and
 * press Enter to add it; click + again for the next one. The names and the
 * "N people" summary are submitted with the form.
 */
export function TeamMembersInput({
  initialMembers,
  legacyTeam,
  error,
}: {
  initialMembers: string[];
  /** the old free-text team (e.g. "6 people"), kept until names are added */
  legacyTeam: string;
  error?: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string>();
  const input = useRef<HTMLInputElement>(null);

  const commit = () => {
    const name = draft.replace(/\s+/g, " ").trim();
    if (!name) {
      setAdding(false);
      setProblem(undefined);
      return;
    }
    if (name.length > TEAM_MEMBER_MAX) return setProblem(`Keep the name to ${TEAM_MEMBER_MAX} characters or fewer.`);
    if (members.some((m) => m.toLowerCase() === name.toLowerCase())) return setProblem(`“${name}” is already in the team.`);
    if (members.length >= TEAM_MAX_MEMBERS) return setProblem(`A team can have up to ${TEAM_MAX_MEMBERS} members.`);
    setMembers([...members, name]);
    setDraft("");
    setProblem(undefined);
    setAdding(false);
    toast.success(`“${name}” added to the team.`);
  };

  const remove = (name: string) => setMembers(members.filter((m) => m !== name));

  const summary = members.length ? teamSummary(members.length) : legacyTeam;
  const shown = problem ?? error;

  return (
    <div className="space-y-2">
      <Label htmlFor="f-teamMemberDraft" className="text-uk-heading">
        Team
        <span className="-ml-1 text-destructive" aria-hidden>*</span>
      </Label>

      {/* what the form submits */}
      <input type="hidden" name="teamMembers" value={members.join("\n")} />
      <input type="hidden" name="team" value={summary} />

      <div
        className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-input px-2.5 py-2 aria-invalid:border-destructive dark:bg-input/30"
        aria-invalid={shown ? true : undefined}
      >
        <Users className="h-4 w-4 shrink-0 text-uk-muted" aria-hidden />
        {members.map((m) => (
          <span key={m} className="inline-flex items-center gap-1 rounded-full bg-uk-blue/10 py-1 pl-3 pr-1.5 text-sm font-medium text-uk-heading">
            {m}
            <button
              type="button"
              onClick={() => remove(m)}
              aria-label={`Remove ${m} from the team`}
              className="rounded-full p-0.5 text-uk-muted transition-colors hover:bg-uk-blue/20 hover:text-uk-heading"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {adding ? (
          <Input
            id="f-teamMemberDraft"
            ref={input}
            autoFocus
            value={draft}
            maxLength={TEAM_MEMBER_MAX}
            placeholder="Team member name, then press Enter"
            autoComplete="off"
            onChange={(e) => {
              setDraft(e.target.value);
              setProblem(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Adds the name instead of submitting the whole form.
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setDraft("");
                setProblem(undefined);
                setAdding(false);
              }
            }}
            onBlur={() => {
              // Leaving the box keeps what was typed.
              if (draft.trim()) commit();
              else setAdding(false);
            }}
            className="h-8 w-64 max-w-full"
          />
        ) : (
          <button
            type="button"
            id="f-teamMemberDraft"
            onClick={() => setAdding(true)}
            aria-label="Add a team member"
            title="Add a team member"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-uk-blue/50 text-uk-blue transition-colors hover:bg-uk-blue/10"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {shown && <p role="alert" className="text-xs font-medium text-destructive">{shown}</p>}
      <p className="text-xs text-uk-muted">
        {members.length
          ? `${teamSummary(members.length)} — shown as “${teamSummary(members.length)}” on the case study, with their names listed.`
          : legacyTeam
            ? `Currently shown as “${legacyTeam}”. Click + and add the members' names to replace it.`
            : "Click + , type a team member's name and press Enter. Click + again for the next person."}
      </p>
    </div>
  );
}
