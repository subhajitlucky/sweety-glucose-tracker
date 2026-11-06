function Svg({ children, size = 20, className = '', ...props }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconSunrise = (props) => (
  <Svg {...props}>
    <path d="M12 3v3M4.6 6.6l2.1 2.1M19.4 6.6l-2.1 2.1M3 19h18M5 15.5a7 7 0 0 1 14 0" />
    <path d="M9 19h6M12 10v-3" />
  </Svg>
);

export const IconCoffee = (props) => (
  <Svg {...props}>
    <path d="M5 8h11v5.5a5.5 5.5 0 0 1-5.5 5.5h0A5.5 5.5 0 0 1 5 13.5V8Z" />
    <path d="M16 9h1.8a2.7 2.7 0 1 1 0 5.4H16M4 21h14M8 4c0 1-1 1.4-1 2.5M12 3c0 1-1 1.4-1 2.5" />
  </Svg>
);

export const IconSun = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const IconMoon = (props) => (
  <Svg {...props}>
    <path d="M20.5 14.7A8.6 8.6 0 0 1 9.3 3.5a8.6 8.6 0 1 0 11.2 11.2Z" />
    <path d="M18 4.5v3M16.5 6h3" />
  </Svg>
);

export const IconDroplet = (props) => (
  <Svg {...props}>
    <path d="M12 3.2c4.2 4.7 6.8 8.1 6.8 11.5A6.8 6.8 0 0 1 12 21.5a6.8 6.8 0 0 1-6.8-6.8C5.2 11.3 7.8 7.9 12 3.2Z" />
  </Svg>
);

export const IconPlus = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconArrowLeft = (props) => (
  <Svg {...props}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);

export const IconArrowRight = (props) => (
  <Svg {...props}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const IconChevronLeft = (props) => (
  <Svg {...props}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);

export const IconChevronRight = (props) => (
  <Svg {...props}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const IconChevronDown = (props) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconCalendar = (props) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Svg>
);

export const IconEdit = (props) => (
  <Svg {...props}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
  </Svg>
);

export const IconTrash = (props) => (
  <Svg {...props}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" />
  </Svg>
);

export const IconCheck = (props) => (
  <Svg {...props}>
    <path d="m5 12 4.5 4.5L19 7" />
  </Svg>
);

export const IconX = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconLogout = (props) => (
  <Svg {...props}>
    <path d="M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
  </Svg>
);

export const IconEye = (props) => (
  <Svg {...props}>
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.7" />
  </Svg>
);

export const IconEyeOff = (props) => (
  <Svg {...props}>
    <path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.2 3.7M6.2 6.7A16.5 16.5 0 0 0 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const IconAlert = (props) => (
  <Svg {...props}>
    <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const IconInfo = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);

export const IconChart = (props) => (
  <Svg {...props}>
    <path d="M3 3v18h18M7 14l4-5 4 3 5-7" />
  </Svg>
);

export const IconSparkle = (props) => (
  <Svg {...props}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  </Svg>
);

export const IconLeaf = (props) => (
  <Svg {...props}>
    <path d="M20 4C11 4 4 8 4 15c0 2.7 2.2 5 5 5 7 0 11-7 11-16Z" />
    <path d="M4 21c2.5-6 7-9.5 12-11" />
  </Svg>
);

export const IconLock = (props) => (
  <Svg {...props}>
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
  </Svg>
);
