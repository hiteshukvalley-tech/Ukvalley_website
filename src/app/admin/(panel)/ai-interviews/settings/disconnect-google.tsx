"use client";

import { useTransition } from "react";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import { disconnectGoogleAction } from "../actions";

export function DisconnectGoogle() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
      onClick={() =>
        start(async () => {
          if (!(await confirmDialog("Disconnect Google Calendar? New interviews will only get a calendar file by email."))) return;
          toast.result(await disconnectGoogleAction(), "Disconnected.");
        })
      }
    >
      Disconnect
    </button>
  );
}
