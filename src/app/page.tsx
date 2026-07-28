import { redirect } from "next/navigation";

// El middleware ya redirige según sesión; esto es el fallback.
export default function Home() {
  redirect("/turno");
}
