import {
  Home,
  Users,
  UserCog,
  CalendarClock,
  Wallet,
  MessageSquare,
} from "lucide-react";

export const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/residentes", label: "Residentes", icon: Users },
  { href: "/empleados", label: "Empleados", icon: UserCog },
  { href: "/turnos", label: "Turnos", icon: CalendarClock },
  { href: "/contabilidad", label: "Contabilidad", icon: Wallet },
  { href: "/entrevistas", label: "Entrevistas", icon: MessageSquare },
];
