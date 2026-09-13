import { requerirSesion } from "@/lib/auth";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function TurnosPage() {
  await requerirSesion("administration");
  return <PlaceholderPage title="Turnos" />;
}
