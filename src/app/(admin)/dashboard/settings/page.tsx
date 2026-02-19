import { getSettings } from "@/actions/settings-actions";
import SettingsForm from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  // Pass settings to form, or empty object if null
  return <SettingsForm initialData={settings || {}} />;
}
