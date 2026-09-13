import {
  Home,
  Inbox,
  Users,
  UserCog,
  CalendarClock,
  Wallet,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

// Ordenadas según el recorrido del negocio: primero entra la consulta, después
// la persona se convierte en residente.
export const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/admision", label: "Admisión", icon: Inbox },
  { href: "/residentes", label: "Residentes", icon: Users },
  { href: "/empleados", label: "Empleados", icon: UserCog },
  { href: "/turnos", label: "Turnos", icon: CalendarClock },
  { href: "/contabilidad", label: "Contabilidad", icon: Wallet },
  { href: "/entrevistas", label: "Entrevistas", icon: MessageSquare },
  { href: "/accesos", label: "Accesos", icon: ShieldCheck },
];
