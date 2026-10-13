"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Loader2, Save, Trash2, UserRound } from "lucide-react";
import { FormField, FormSection, FormTextarea } from "@/components/admin/form";
import { toast, useResultToast } from "@/components/admin/toast";
import { PROFILE_MAX, type Profile } from "@/lib/profile-validation";
import { saveProfileAction, type ProfileFormState } from "./actions";

/** Photo picker: uploads through the media upload route and keeps "/media/<id>". */
function PhotoField({ initial, error }: { initial: string; error?: string }) {
  const [photo, setPhoto] = useState(initial);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("files", file);
      const res = await fetch("/admin/media/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; results?: { ok: boolean; id?: string; error?: string }[] };
      const r = data.results?.[0];
      if (!res.ok || !r?.ok || !r.id) throw new Error(r?.error || data.error || "Could not upload the photo.");
      setPhoto(`/media/${r.id}`);
      toast.info("Photo uploaded. Save the profile to keep it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload the photo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
      <input type="hidden" name="photo" value={photo} />
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="Your photo" className="h-20 w-20 rounded-full border border-uk-line object-cover" />
      ) : (
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-uk-surface-blue text-uk-blue">
          <UserRound className="h-9 w-9" />
        </span>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {photo ? "Change photo" : "Upload photo"}
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </label>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto("")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
        <p className="text-xs text-uk-muted">PNG, JPG or WebP, up to 4 MB. A square photo looks best.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

export function ProfileForm({ profile, email, role }: { profile: Profile; email: string; role: string }) {
  const [state, action, saving] = useActionState<ProfileFormState, FormData>(saveProfileAction, {});
  const values = state.values ?? profile;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>
      <FormSection title="Photo and name" description="Shown in the top bar and the dashboard welcome.">
        <PhotoField initial={values.photo} error={errors.photo} />
        <FormField label="Full name" name="name" defaultValue={values.name} required autoComplete="name" maxLength={PROFILE_MAX.name} error={errors.name} />
        <FormField label="Email ID" name="email-readonly" defaultValue={email} readOnly hint="Your sign-in email. An admin can change it in Users." />
        <FormField label="Role" name="role-readonly" defaultValue={role} readOnly hint="Set by an admin in Users." />
      </FormSection>

      <FormSection title="Contact">
        <FormField label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={values.phone} maxLength={PROFILE_MAX.phone} error={errors.phone} placeholder="+91 98765 43210" />
        <FormField label="City / location" name="location" defaultValue={values.location} maxLength={PROFILE_MAX.location} error={errors.location} placeholder="Nashik" />
        <FormTextarea label="Address" name="address" defaultValue={values.address} maxLength={PROFILE_MAX.address} error={errors.address} full rows={2} />
        <FormField label="LinkedIn" name="linkedin" type="url" inputMode="url" defaultValue={values.linkedin} maxLength={PROFILE_MAX.linkedin} error={errors.linkedin} placeholder="https://www.linkedin.com/in/your-name" full />
      </FormSection>

      <FormSection title="Background">
        <FormField label="Qualification" name="qualification" defaultValue={values.qualification} maxLength={PROFILE_MAX.qualification} error={errors.qualification} placeholder="MBA (HR)" />
        <FormField label="Department" name="department" defaultValue={values.department} maxLength={PROFILE_MAX.department} error={errors.department} placeholder="Human Resources" />
        <FormField label="Experience" name="experience" defaultValue={values.experience} maxLength={PROFILE_MAX.experience} error={errors.experience} placeholder="5 years" />
        <FormField label="Date of joining" name="dateOfJoining" type="date" defaultValue={values.dateOfJoining} error={errors.dateOfJoining} />
        <FormField label="Date of birth" name="dateOfBirth" type="date" defaultValue={values.dateOfBirth} error={errors.dateOfBirth} />
        <FormTextarea label="About you" name="bio" defaultValue={values.bio} maxLength={PROFILE_MAX.bio} error={errors.bio} full rows={3} />
      </FormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
