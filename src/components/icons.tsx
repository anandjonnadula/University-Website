import type { SVGProps } from "react";

const paths: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 9a2.4 2.4 0 0 0 4 0" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="17" rx="2" />
      <path d="M3 10h18M8 2.5V7M16 2.5V7" />
    </>
  ),
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5" />,
  check: <path d="M4 12.5 9.5 18 20 6" />,
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14-2 8 5.5-3 5.5 3-2-8" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  library: <path d="M4 3h4v18H4V3Zm6 0h4v18h-4V3Zm7.5 1.5 4 17-4 1-4-17 4-1Z" />,
  building: (
    <>
      <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 8h4a1 1 0 0 1 1 1v12M2 21h20" />
      <path d="M8 7h3M8 11h3M8 15h3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  inbox: <path d="M22 12h-6l-2 3h-4l-2-3H2m20 0v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6m20 0-3.5-8h-13L2 12" />,
  id: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.5 17.5c.6-2 2-3 3.5-3s2.9 1 3.5 3M15 9h4M15 13h4" />
    </>
  ),
  sparkles: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 15l.9 2.4L22 18.3l-2.1.9L19 21.5l-.9-2.3-2.1-.9 2.1-.9.9-2.4ZM5 15l.9 2.4 2.1.9-2.1.9L5 21.5l-.9-2.3-2.1-.9 2.1-.9L5 15Z" />,
  chart: <path d="M3 3v18h18M8 17v-6m5 6V7m5 10v-3" />,
  shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Zm-3-10.5 2.3 2.3L15.5 9.5" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5 6.5-5s5.7 1.5 6.5 5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 15.4c1.6.7 2.7 2 3 4.6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7L22 7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.5-4.5" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />,
  arrow: <path d="M5 12h14m-6-7 7 7-7 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM18 18h3v3h-3z" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5M4 19h16" />,
  send: <path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" />,
  flask: <path d="M9 3h6M10 3v6l-6 9.5A2 2 0 0 0 5.7 21h12.6a2 2 0 0 0 1.7-2.5L14 9V3M7.5 15h9" />,
  grad: <path d="m2 9 10-5 10 5-10 5L2 9Zm4 3.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5" />,
  warn: <path d="M12 3 1.8 20.2h20.4L12 3Zm0 7v4.5m0 3v.5" />,
};

export function Icon({ name, className, ...rest }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "size-5"}
      {...rest}
    >
      {paths[name] ?? paths.home}
    </svg>
  );
}
