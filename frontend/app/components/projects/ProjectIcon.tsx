type ProjectIconName =
  | "arrow"
  | "calendar"
  | "chevron"
  | "clock"
  | "eye"
  | "filter"
  | "folder"
  | "handshake"
  | "heart"
  | "location"
  | "menu"
  | "refresh"
  | "rocket"
  | "search"
  | "sliders"
  | "x";

export default function ProjectIcon({
  name,
  size = 18,
  filled = false,
}: {
  name: ProjectIconName;
  size?: number;
  filled?: boolean;
}) {
  const shared = {
    fill: name === "heart" && filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let artwork;

  switch (name) {
    case "arrow":
      artwork = <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>;
      break;
    case "calendar":
      artwork = <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>;
      break;
    case "chevron":
      artwork = <path d="m6 9 6 6 6-6"/>;
      break;
    case "clock":
      artwork = <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>;
      break;
    case "eye":
      artwork = <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>;
      break;
    case "filter":
      artwork = <><path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="2"/><circle cx="15" cy="12" r="2"/></>;
      break;
    case "folder":
      artwork = <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/></>;
      break;
    case "handshake":
      artwork = <><path d="m8 12 2 2a2 2 0 0 0 3 0l3-3"/><path d="m3 11 4-4 4 1 2-1 5 1 3 3-5 6a2 2 0 0 1-3 0l-1-1"/><path d="m2 10 4 4m16-4-3 3"/></>;
      break;
    case "heart":
      artwork = <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>;
      break;
    case "location":
      artwork = <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>;
      break;
    case "menu":
      artwork = <><path d="M4 6h16M4 12h16M4 18h16"/></>;
      break;
    case "refresh":
      artwork = <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2"/></>;
      break;
    case "rocket":
      artwork = <><path d="M5 13c-2 1.5-2.5 5.5-2.5 5.5S6.5 18 8 16"/><path d="M9 15 6 12c1-5 5-8 13-9 0 8-4 12-9 13Z"/><circle cx="15" cy="8" r="1.5"/></>;
      break;
    case "search":
      artwork = <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>;
      break;
    case "sliders":
      artwork = <><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4"/></>;
      break;
    case "x":
      artwork = <><path d="m18 6-12 12M6 6l12 12"/></>;
      break;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...shared}
    >
      {artwork}
    </svg>
  );
}
