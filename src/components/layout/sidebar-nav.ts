import { LayoutDashboard, Users, Settings, Layers, Newspaper, GraduationCap, BookOpen, FileText, CalendarDays, type LucideIcon } from "lucide-react";
import { hasPermission, P } from "@/features/identity";
import { SAMPLE_P } from "@/features/sample";
import { NEWS_P } from "@/features/news";
import { STAFF_P } from "@/features/staff";
import { CURRICULUM_P } from "@/features/curriculum";
import { DOCUMENTS_P } from "@/features/documents";
import { BOOKING_P } from "@/features/bookings";

export interface NavItem {
  /** i18n key */
  title: string;
  href: string;
  icon?: LucideIcon;
  /** ต้องมีสิทธิ์นี้ถึงเห็น — ไม่มี = ทุกคนที่ login เห็น */
  permission?: string;
  children?: NavItem[];
}
export interface NavGroup { label: string; items: NavItem[] }
export interface NavCrumb { title: string; href: string }

export const sidebarGroups: NavGroup[] = [
  {
    label: "nav.group.overview",
    items: [
      {
        title: "nav.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        children: [
          { title: "dashboard.nav.overview", href: "/dashboard" },
          { title: "dashboard.nav.portal", href: "/portal" },
        ],
      },
    ],
  },
  {
    label: "nav.group.faculty",
    items: [
      {
        title: "news.nav",
        href: "/news",
        icon: Newspaper,
        permission: NEWS_P.newsRead,
        children: [
          { title: "news.tab.all", href: "/news", permission: NEWS_P.newsRead },
          { title: "news.create", href: "/news?action=create", permission: NEWS_P.newsManage },
        ],
      },
      {
        title: "staff.nav",
        href: "/staff",
        icon: GraduationCap,
        permission: STAFF_P.staffRead,
        children: [
          { title: "staff.tab.directory", href: "/staff", permission: STAFF_P.staffRead },
          { title: "staff.create", href: "/staff?action=create", permission: STAFF_P.staffManage },
        ],
      },
      {
        title: "curriculum.nav",
        href: "/curriculum",
        icon: BookOpen,
        permission: CURRICULUM_P.curriculumRead,
        children: [
          { title: "curriculum.tab.programs", href: "/curriculum", permission: CURRICULUM_P.curriculumRead },
          { title: "curriculum.tab.departments", href: "/curriculum/departments", permission: CURRICULUM_P.curriculumRead },
        ],
      },
      {
        title: "documents.nav",
        href: "/documents",
        icon: FileText,
        permission: DOCUMENTS_P.documentRead,
        children: [
          { title: "documents.tab.all", href: "/documents", permission: DOCUMENTS_P.documentRead },
          { title: "documents.create", href: "/documents?action=create", permission: DOCUMENTS_P.documentSubmit },
        ],
      },
      {
        title: "bookings.nav",
        href: "/bookings",
        icon: CalendarDays,
        permission: BOOKING_P.bookingView,
        children: [
          { title: "bookings.tab.reservations", href: "/bookings", permission: BOOKING_P.bookingView },
          { title: "bookings.tab.resources", href: "/bookings?tab=resources", permission: BOOKING_P.bookingView },
        ],
      },
    ],
  },
  {
    label: "nav.group.sample",
    items: [
      {
        title: "sample.nav",
        href: "/sample",
        icon: Layers,
        permission: SAMPLE_P.sampleRead,
        children: [
          { title: "sample.tab.items", href: "/sample", permission: SAMPLE_P.sampleRead },
          { title: "sample.create", href: "/sample?action=create", permission: SAMPLE_P.sampleManage },
        ],
      },
    ],
  },
  {
    label: "nav.group.users",
    items: [
      {
        title: "nav.users",
        href: "/users",
        icon: Users,
        permission: P.usersRead,
        children: [
          { title: "nav.users", href: "/users", permission: P.usersRead },
          { title: "nav.roles", href: "/users/roles", permission: P.rolesManage },
        ],
      },
    ],
  },
  {
    label: "nav.group.settings",
    items: [
      {
        title: "nav.settings",
        href: "/settings",
        icon: Settings,
        permission: P.settingsManage,
        children: [
          { title: "nav.settings", href: "/settings", permission: P.settingsManage },
          { title: "settings.nav.contact", href: "/settings#contact", permission: P.settingsManage },
        ],
      },
    ],
  },
];

type Ctx = Parameters<typeof hasPermission>[0];

function visibleItem(item: NavItem, ctx: Ctx): NavItem | null {
  if (item.permission && !hasPermission(ctx, item.permission)) return null;
  if (!item.children) return item;
  const children = item.children.filter((c) => !c.permission || hasPermission(ctx, c.permission));
  return children.length ? { ...item, children } : null;
}

export function visibleGroups(ctx: Ctx): NavGroup[] {
  return sidebarGroups
    .map((g) => ({ ...g, items: g.items.map((i) => visibleItem(i, ctx)).filter((i): i is NavItem => i !== null) }))
    .filter((g) => g.items.length > 0);
}

/** สายเมนูสำหรับ breadcrumb — จับ href ที่ยาวที่สุดที่ตรง (ลูกชนะแม่) */
export function getActiveNavChain(pathname: string): NavCrumb[] {
  let best: { parent: NavItem | null; item: NavItem } | null = null;
  const consider = (item: NavItem, parent: NavItem | null) => {
    const [clean] = item.href.split(/[?#]/);
    if (pathname === clean || (clean !== "/" && pathname.startsWith(clean + "/"))) {
      const bestClean = best ? best.item.href.split(/[?#]/)[0] : "";
      if (
        !best ||
        clean.length > bestClean.length ||
        (clean.length === bestClean.length && parent && !item.href.includes("?") && !item.href.includes("#"))
      ) {
        best = { parent, item };
      }
    }
  };
  for (const g of sidebarGroups) {
    for (const i of g.items) {
      consider(i, null);
      for (const c of i.children ?? []) consider(c, i);
    }
  }
  if (!best) return [];
  const { parent, item } = best as { parent: NavItem | null; item: NavItem };
  const chain: NavCrumb[] = [];
  const [parentClean] = parent ? parent.href.split(/[?#]/) : [""];
  const [itemClean] = item.href.split(/[?#]/);
  if (parent && parentClean !== itemClean) chain.push({ title: parent.title, href: parent.href });
  chain.push({ title: item.title, href: item.href });
  return chain;
}
