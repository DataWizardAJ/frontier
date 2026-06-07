"use server";

import { revalidatePath } from "next/cache";
import { saveApiKey, clearApiKey } from "@/lib/config";

export async function saveApiKeyAction(formData: FormData) {
  const key = String(formData.get("apiKey") ?? "").trim();
  if (!key) return;
  saveApiKey(key);
  revalidatePath("/settings");
}

export async function clearApiKeyAction() {
  clearApiKey();
  revalidatePath("/settings");
}
