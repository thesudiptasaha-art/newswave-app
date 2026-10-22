import { APP_NAME } from '../utils/constants';
export const metadata = {
  title: APP_NAME,
  description:
    'Real-time Daily Rundown & Content Operations for video production teams.',
};

export const viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

const tailwindConfig = `
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'Noto Serif Bengali', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
          mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        },
      },
    },
  };
`;

const globalCss = `
  html, body { background: #000000; color: #f4f4f5; }
  body {
    font-family: 'Inter', 'Noto Serif Bengali', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    letter-spacing: -0.011em;
  }
  ::selection { background: rgba(10, 132, 255, 0.35); }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.10);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); background-clip: content-box; border: 2px solid transparent; }
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translate(-50%, 10px) scale(0.98); }
    to { opacity: 1; transform: translate(-50%, 0) scale(1); }
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(0.8); }
  }
  .row-in { animation: rowIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .toast-in { animation: toastIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .live-dot { animation: pulseDot 1.8s ease-in-out infinite; }
  input, textarea, select, button { font-family: inherit; letter-spacing: inherit; }
`;
const lightCss = `
  html.light { color-scheme: light; }
  html.light, html.light body { background: #f7f4ed; color: #28231d; }
  html.light ::selection { background: rgba(70, 90, 34, 0.26); }
  html.light ::-webkit-scrollbar-thumb { background: rgba(105, 85, 60, 0.22); background-clip: content-box; border: 2px solid transparent; }
  html.light ::-webkit-scrollbar-thumb:hover { background: rgba(105, 85, 60, 0.35); background-clip: content-box; border: 2px solid transparent; }
  html.light [class*="color-scheme:dark"] { color-scheme: light; }

  /* surfaces: warm paper & linen */
  html.light .bg-black { background-color: #f7f4ed; }
  html.light [class~="bg-[#121215]"] { background-color: #fcfaf5; }
  html.light [class~="bg-[#121215]/95"] { background-color: rgba(252, 250, 245, 0.98); }
  html.light [class~="bg-black/60"][class~="sticky"] { background-color: rgba(247, 244, 237, 0.88); }
  html.light aside[class~="bg-black/60"] { background-color: rgba(251, 248, 242, 0.96); }
  html.light [class~="bg-black/60"][class~="inset-0"], html.light [class~="bg-black/70"][class~="inset-0"] { background-color: rgba(45, 38, 30, 0.42); }
  html.light footer[class~="bg-black/70"] { background-color: rgba(247, 244, 237, 0.92); }
  html.light [class~="bg-black/30"] { background-color: rgba(105, 85, 60, 0.04); }
  html.light [class~="bg-black/70"] { background-color: rgba(251, 248, 242, 0.96); }
  html.light [class~="bg-red-950/70"] { background-color: #fbeae8; }
  html.light [class~="bg-emerald-950/70"] { background-color: #edf4e6; }

  /* soft fills: subtle warm paper layering */
  html.light [class~="bg-white/[0.02]"] { background-color: rgba(90, 75, 55, 0.025); }
  html.light [class~="bg-white/[0.025]"] { background-color: rgba(90, 75, 55, 0.03); }
  html.light [class~="bg-white/[0.03]"] { background-color: rgba(90, 75, 55, 0.04); }
  html.light [class~="bg-white/[0.04]"] { background-color: rgba(90, 75, 55, 0.05); }
  html.light [class~="bg-white/[0.05]"] { background-color: rgba(90, 75, 55, 0.06); }
  html.light [class~="bg-white/[0.06]"] { background-color: rgba(90, 75, 55, 0.07); }
  html.light [class~="bg-white/[0.08]"] { background-color: rgba(90, 75, 55, 0.085); }
  html.light [class~="bg-white/[0.1]"] { background-color: rgba(90, 75, 55, 0.10); }
  html.light [class~="bg-white/15"] { background-color: rgba(90, 75, 55, 0.15); }
  html.light [class~="hover:bg-white/[0.04]"]:hover { background-color: rgba(90, 75, 55, 0.05); }
  html.light [class~="hover:bg-white/[0.05]"]:hover { background-color: rgba(90, 75, 55, 0.065); }
  html.light [class~="hover:bg-white/[0.07]"]:hover { background-color: rgba(90, 75, 55, 0.08); }
  html.light [class~="hover:bg-white/[0.08]"]:hover { background-color: rgba(90, 75, 55, 0.095); }
  html.light [class~="hover:bg-white/[0.09]"]:hover { background-color: rgba(90, 75, 55, 0.11); }
  html.light [class~="hover:bg-white/10"]:hover { background-color: rgba(90, 75, 55, 0.12); }
  html.light [class~="focus:bg-white/[0.06]"]:focus { background-color: #ffffff; }

  /* buttons: earthy olive green primary, earthy maroon red destructive */
  html.light [class~="bg-white"][class~="font-semibold"],
  html.light [class~="bg-white"][class~="font-bold"] {
    background-color: #465a22;
    color: #fdfdfa;
  }
  html.light [class~="bg-white"][class~="font-semibold"]:hover,
  html.light [class~="bg-white"][class~="font-semibold"][class~="hover:bg-zinc-200"]:hover,
  html.light [class~="bg-white"][class~="font-bold"]:hover {
    background-color: #384a1b;
    color: #ffffff;
  }
  html.light [class~="bg-white"][class~="font-semibold"]:active,
  html.light [class~="bg-white"][class~="font-bold"]:active {
    background-color: #2d3b15;
  }
  html.light [class~="bg-sky-500"][class~="text-white"] {
    background-color: #465a22;
    color: #ffffff;
  }
  html.light [class~="bg-sky-500"][class~="text-white"]:hover {
    background-color: #384a1b;
  }
  html.light [class~="bg-red-500"][class~="text-white"],
  html.light [class~="bg-red-600"][class~="text-white"] {
    background-color: #802c2c;
    color: #ffffff;
  }
  html.light [class~="bg-red-500"][class~="text-white"]:hover,
  html.light [class~="bg-red-600"][class~="text-white"]:hover {
    background-color: #6a2323;
  }
  html.light [class~="border-red-500/30"][class~="bg-red-500/10"] {
    border-color: rgba(128, 44, 44, 0.35);
    background-color: rgba(128, 44, 44, 0.10);
    color: #822929;
  }
  html.light [class~="border-red-500/30"][class~="bg-red-500/10"]:hover {
    background-color: rgba(128, 44, 44, 0.18);
    color: #6a2323;
  }

  /* borders: warm natural stone */
  html.light [class~="border-white/[0.04]"] { border-color: rgba(105, 85, 60, 0.06); }
  html.light [class~="border-white/[0.05]"] { border-color: rgba(105, 85, 60, 0.08); }
  html.light [class~="border-white/[0.06]"] { border-color: rgba(105, 85, 60, 0.10); }
  html.light [class~="border-white/[0.08]"] { border-color: rgba(105, 85, 60, 0.13); }
  html.light [class~="border-white/[0.1]"], html.light [class~="border-white/10"] { border-color: rgba(105, 85, 60, 0.16); }
  html.light [class~="border-white/[0.14]"] { border-color: rgba(105, 85, 60, 0.24); }
  html.light [class~="border-white/[0.15]"] { border-color: rgba(105, 85, 60, 0.22); }
  html.light [class~="ring-white/10"] { --tw-ring-color: rgba(105, 85, 60, 0.16); }
  html.light [class~="to-white/[0.16]"] { --tw-gradient-to: rgb(90 75 55 / 0.16) var(--tw-gradient-to-position); }
  html.light [class~="shadow-black"], html.light [class~="shadow-black/60"], html.light [class~="shadow-black/70"] { --tw-shadow-color: rgba(65, 50, 35, 0.14); --tw-shadow: var(--tw-shadow-colored); }

  /* text: warm espresso & charcoal (low eye fatigue) */
  html.light .text-white { color: #28231d; }
  html.light .text-zinc-100 { color: #28231d; }
  html.light .text-zinc-200 { color: #3d372f; }
  html.light .text-zinc-300 { color: #544b41; }
  html.light .text-zinc-400 { color: #6e6457; }
  html.light .text-zinc-500 { color: #877c6f; }
  html.light .text-zinc-600 { color: #9e9487; }
  html.light .text-zinc-700 { color: #b5aca0; }
  html.light [class~="placeholder:text-zinc-600"]::placeholder { color: #a3988b; }
  html.light [class~="hover:text-white"]:hover { color: #1a1612; }
  html.light [class~="hover:text-zinc-300"]:hover { color: #28231d; }
  html.light [class~="hover:text-sky-300"]:hover { color: #465a22; }
  html.light [class~="hover:text-red-400"]:hover { color: #802c2c; }

  /* colored text & chips: muted earthy tones */
  html.light .text-sky-200, html.light .text-sky-300, html.light [class~="text-sky-300/80"] { color: #285a80; }
  html.light .text-sky-400 { color: #3a6a92; }
  html.light .text-emerald-200, html.light .text-emerald-300 { color: #3f5120; }
  html.light .text-emerald-400 { color: #465a22; }
  html.light .text-amber-300, html.light [class~="text-amber-300/80"], html.light [class~="text-amber-400/80"] { color: #8c581c; }
  html.light .text-yellow-300, html.light .text-yellow-400 { color: #855212; }
  html.light .text-red-200, html.light .text-red-300, html.light .text-red-400 { color: #872b2b; }
  html.light .text-violet-300 { color: #653a7a; }
  html.light .text-teal-300 { color: #26635a; }
  html.light .text-pink-300 { color: #8f3555; }
  html.light .text-orange-300 { color: #964718; }
  html.light .text-indigo-300 { color: #4a457a; }

  /* status chips: muted earth tones */
  html.light [class~="bg-zinc-500/15"] { background-color: #ece6da; }
  html.light [class~="bg-red-500/15"] { background-color: #f0dcd9; }
  html.light [class~="bg-amber-500/15"] { background-color: #f2dfb5; }
  html.light .text-amber-500 { color: #8a5410; }
  html.light [class~="bg-yellow-400/10"] { background-color: #f5efb5; }
  html.light .text-yellow-200 { color: #6b5f00; }
  html.light [class~="bg-emerald-500/15"] { background-color: #e1e7cc; }
  html.light [class~="bg-sky-500/15"] { background-color: #dce8f3; }
  html.light [class~="bg-teal-500/15"] { background-color: #dcebe6; }
  html.light [class~="bg-zinc-950"] { background-color: #1c1814; }
  html.light [class~="bg-zinc-950"][class~="text-zinc-300"] { color: #e9e2d6; }
  html.light [class~="ring-zinc-400/25"], html.light [class~="ring-red-400/25"], html.light [class~="ring-amber-400/25"], html.light [class~="ring-yellow-300/25"], html.light [class~="ring-emerald-400/25"], html.light [class~="ring-sky-400/25"], html.light [class~="ring-teal-400/25"] { --tw-ring-color: rgba(105, 85, 60, 0.16); }
  html.light [class~="ring-zinc-500/50"] { --tw-ring-color: #1c1814; }
  
  /* modal / form panels, drawer and inputs */
  html.light [class~="bg-[#121215]/90"] { background-color: rgba(251, 248, 242, 0.97) !important; }
  html.light aside[class~="bg-black/60"] { background-color: rgba(251, 248, 242, 0.96) !important; }
  html.light input, html.light textarea, html.light select {
    color: #28231d;
    background-color: #fcfaf5;
  }
  html.light input:focus, html.light textarea:focus, html.light select:focus {
    background-color: #ffffff;
    border-color: rgba(70, 90, 34, 0.6);
  }

  /* teleprompter: always black background and white text in both themes */
  html.light .teleprompter-root,
  html.light [class~="teleprompter-root"] {
    background-color: #000000 !important;
    color: #ffffff !important;
  }
  html.light .teleprompter-root .text-white,
  html.light .teleprompter-root [class*="text-white"] {
    color: #ffffff !important;
  }
  html.light .teleprompter-root [class*="text-white/70"] {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  /* script duration badge in drawer top section: high visibility in light theme */
  html.light .script-duration-badge,
  html.light [class~="script-duration-badge"] {
    background-color: #e5ded2 !important;
    color: #241f19 !important;
    border-color: rgba(105, 85, 60, 0.3) !important;
  }
`;
export default function RootLayout({ children }) {
  return (
      <html lang="en" className="bg-black" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: tailwindConfig }} />
                <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('nw-theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}",
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: globalCss + lightCss }} />
      </head>
      <body className="min-h-screen bg-black font-sans text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
