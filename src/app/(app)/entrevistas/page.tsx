import { requerirSesion } from "@/lib/auth";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function EntrevistasPage() {
  await requerirSesion("administration");
  return <PlaceholderPage title="Entrevistas" />;
}
