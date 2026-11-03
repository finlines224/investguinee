type AuthIconName =
  | "arrow"
  | "briefcase"
  | "chart"
  | "check"
  | "chevron"
  | "edit"
  | "eye"
  | "eyeOff"
  | "globe"
  | "google"
  | "handshake"
  | "help"
  | "linkedin"
  | "lock"
  | "mail"
  | "phone"
  | "rocket"
  | "shield"
  | "user"
  | "users";

export default function AuthIcon({
  name,
  size = 20,
}: {
  name: AuthIconName;
  size?: number;
}) {
  if (name === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.38a4.6 4.6 0 0 1-2 3.02v2.46h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"/>
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.46c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.13H3.08v2.54A10 10 0 0 0 12 22Z"/>
        <path fill="#FBBC05" d="M6.42 13.94A6.02 6.02 0 0 1 6.1 12c0-.67.12-1.32.32-1.94V7.52H3.08A10 10 0 0 0 2 12c0 1.62.39 3.15 1.08 4.48l3.34-2.54Z"/>
        <path fill="#EA4335" d="M12 5.93c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.94 14.7 2 12 2a10 10 0 0 0-8.92 5.52l3.34 2.54C7.2 7.69 9.4 5.93 12 5.93Z"/>
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#0A66C2" d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.85 0 1.55-.68 1.55-1.52V3.52c0-.84-.7-1.52-1.55-1.52ZM7.93 18.45H4.96V9h2.97v9.45ZM6.45 7.71a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12 10.74h-2.96v-4.6c0-1.1-.02-2.52-1.54-2.52-1.55 0-1.78 1.2-1.78 2.44v4.68H9.2V9h2.85v1.29h.04c.4-.74 1.37-1.53 2.82-1.53 3.01 0 3.57 1.98 3.57 4.55v4.4Z"/>
      </svg>
    );
  }

  const shared = {
    fill: "none",
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
    case "briefcase":
      artwork = <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>;
      break;
    case "chart":
      artwork = <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>;
      break;
    case "check":
      artwork = <path d="m5 12 4 4L19 6"/>;
      break;
    case "chevron":
      artwork = <path d="m6 9 6 6 6-6"/>;
      break;
    case "edit":
      artwork = <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/><path d="M13 20h8"/></>;
      break;
    case "eye":
      artwork = <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>;
      break;
    case "eyeOff":
      artwork = <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.6"/></>;
      break;
    case "globe":
      artwork = <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>;
      break;
    case "handshake":
      artwork = <><path d="m8 12 2 2a2 2 0 0 0 3 0l3-3"/><path d="m3 11 4-4 4 1 2-1 5 1 3 3-5 6a2 2 0 0 1-3 0l-1-1"/><path d="m2 10 4 4m16-4-3 3"/></>;
      break;
    case "help":
      artwork = <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.3-1.8 2.7M12 17h.01"/></>;
      break;
    case "lock":
      artwork = <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>;
      break;
    case "mail":
      artwork = <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>;
      break;
    case "phone":
      artwork = <><path d="M5 3h4l2 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/></>;
      break;
    case "rocket":
      artwork = <><path d="M5 13c-2 1.5-2.5 5.5-2.5 5.5S6.5 18 8 16"/><path d="M9 15 6 12c1-5 5-8 13-9 0 8-4 12-9 13Z"/><circle cx="15" cy="8" r="1.5"/></>;
      break;
    case "shield":
      artwork = <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>;
      break;
    case "user":
      artwork = <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>;
      break;
    case "users":
      artwork = <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>;
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
