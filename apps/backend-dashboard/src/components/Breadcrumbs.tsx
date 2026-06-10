"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/providers/I18nProvider";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useI18n();

  const getPathBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: t("nav-home"), href: "/" }];

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const labelKey = `nav-${path}`;
      const label = t(labelKey) || path.charAt(0).toUpperCase() + path.slice(1);

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getPathBreadcrumbs();

  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav className="border-b border-hairline bg-canvas px-4 py-2">
      <ol className="flex items-center space-x-2 text-body-sm text-mute">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-mute mx-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-ink font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-mute hover:text-ink transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
