export const metadata = {
  title: 'NewsroomOps • Daily Rundown',
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
          sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
          mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        },
      },
    },
  };
`;

const globalCss = `
  html, body { background: #000000; color: #f4f4f5; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
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
  html.light, html.light body { background: #ffffff; color: #1d1d1f; }
  html.light ::selection { background: rgba(10, 132, 255, 0.25); }
  html.light ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); background-clip: content-box; border: 2px solid transparent; }
  html.light ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); background-clip: content-box; border: 2px solid transparent; }
  html.light [class*="color-scheme:dark"] { color-scheme: light; }

  /* surfaces */
  html.light .bg-black { background-color: #ffffff; }
  html.light [class~="bg-[#121215]"] { background-color: #f5f5f7; }
  html.light [class~="bg-[#121215]/95"] { background-color: rgba(255,255,255,0.96); }
  html.light [class~="bg-black/60"][class~="sticky"] { background-color: rgba(255,255,255,0.72); }
  html.light aside[class~="bg-black/60"] { background-color: rgba(255,255,255,0.9); }
  html.light [class~="bg-black/60"][class~="inset-0"], html.light [class~="bg-black/70"][class~="inset-0"] { background-color: rgba(0,0,0,0.32); }
  html.light footer[class~="bg-black/70"] { background-color: rgba(255,255,255,0.9); }
  html.light [class~="bg-black/30"] { background-color: rgba(0,0,0,0.03); }
  html.light [class~="bg-black/70"] { background-color: rgba(255,255,255,0.95); }
  html.light [class~="bg-red-950/70"] { background-color: #fee2e2; }
  html.light [class~="bg-emerald-950/70"] { background-color: #d1fae5; }

  /* soft fills */
  html.light [class~="bg-white/[0.02]"] { background-color: rgba(0,0,0,0.02); }
  html.light [class~="bg-white/[0.025]"] { background-color: rgba(0,0,0,0.025); }
  html.light [class~="bg-white/[0.03]"] { background-color: rgba(0,0,0,0.03); }
  html.light [class~="bg-white/[0.04]"] { background-color: rgba(0,0,0,0.04); }
  html.light [class~="bg-white/[0.05]"] { background-color: rgba(0,0,0,0.05); }
  html.light [class~="bg-white/[0.06]"] { background-color: rgba(0,0,0,0.06); }
  html.light [class~="bg-white/[0.08]"] { background-color: rgba(0,0,0,0.08); }
  html.light [class~="bg-white/[0.1]"] { background-color: rgba(0,0,0,0.09); }
  html.light [class~="bg-white/15"] { background-color: rgba(0,0,0,0.16); }
  html.light [class~="hover:bg-white/[0.04]"]:hover { background-color: rgba(0,0,0,0.04); }
  html.light [class~="hover:bg-white/[0.05]"]:hover { background-color: rgba(0,0,0,0.05); }
  html.light [class~="hover:bg-white/[0.07]"]:hover { background-color: rgba(0,0,0,0.07); }
  html.light [class~="hover:bg-white/[0.08]"]:hover { background-color: rgba(0,0,0,0.08); }
  html.light [class~="hover:bg-white/[0.09]"]:hover { background-color: rgba(0,0,0,0.09); }
  html.light [class~="hover:bg-white/10"]:hover { background-color: rgba(0,0,0,0.08); }
  html.light [class~="focus:bg-white/[0.06]"]:focus { background-color: #ffffff; }

  /* primary button + logo: Apple blue */
  html.light [class~="bg-white"][class~="font-semibold"], html.light [class~="bg-white"][class~="font-bold"] { background-color: #0a84ff; color: #ffffff; }
  html.light [class~="bg-white"][class~="font-semibold"]:hover { background-color: #0071e3; }
  html.light [class~="bg-white"][class~="font-semibold"][class~="hover:bg-zinc-200"]:hover { background-color: #0071e3; }
  html.light [class~="bg-sky-500"][class~="text-white"], html.light [class~="bg-red-500"][class~="text-white"] { color: #ffffff; }

  /* borders */
  html.light [class~="border-white/[0.04]"] { border-color: rgba(0,0,0,0.05); }
  html.light [class~="border-white/[0.05]"] { border-color: rgba(0,0,0,0.06); }
  html.light [class~="border-white/[0.06]"] { border-color: rgba(0,0,0,0.08); }
  html.light [class~="border-white/[0.08]"] { border-color: rgba(0,0,0,0.1); }
  html.light [class~="border-white/[0.1]"], html.light [class~="border-white/10"] { border-color: rgba(0,0,0,0.12); }
  html.light [class~="border-white/[0.15]"] { border-color: rgba(0,0,0,0.18); }
  html.light [class~="ring-white/10"] { --tw-ring-color: rgba(0,0,0,0.12); }
  html.light [class~="to-white/[0.16]"] { --tw-gradient-to: rgb(0 0 0 / 0.16) var(--tw-gradient-to-position); }
  html.light [class~="shadow-black"], html.light [class~="shadow-black/60"], html.light [class~="shadow-black/70"] { --tw-shadow-color: rgba(0,0,0,0.18); --tw-shadow: var(--tw-shadow-colored); }

  /* text */
  html.light .text-white { color: #1d1d1f; }
  html.light .text-zinc-100 { color: #1d1d1f; }
  html.light .text-zinc-200 { color: #2c2c2e; }
  html.light .text-zinc-300 { color: #48484a; }
  html.light .text-zinc-400 { color: #636366; }
  html.light .text-zinc-500 { color: #6e6e73; }
  html.light .text-zinc-600 { color: #8e8e93; }
  html.light .text-zinc-700 { color: #aeaeb2; }
  html.light [class~="placeholder:text-zinc-600"]::placeholder { color: #a1a1a6; }
  html.light [class~="hover:text-white"]:hover { color: #000000; }
  html.light [class~="hover:text-zinc-300"]:hover { color: #1d1d1f; }
  html.light [class~="hover:text-sky-300"]:hover { color: #0a84ff; }
  html.light [class~="hover:text-red-400"]:hover { color: #dc2626; }

  /* colored text on tinted chips */
  html.light .text-sky-200, html.light .text-sky-300, html.light [class~="text-sky-300/80"] { color: #0369a1; }
  html.light .text-sky-400 { color: #0a84ff; }
  html.light .text-emerald-200, html.light .text-emerald-300 { color: #047857; }
  html.light .text-emerald-400 { color: #059669; }
  html.light .text-amber-300, html.light [class~="text-amber-300/80"], html.light [class~="text-amber-400/80"] { color: #b45309; }
  html.light .text-yellow-300, html.light .text-yellow-400 { color: #a16207; }
  html.light .text-red-200, html.light .text-red-300, html.light .text-red-400 { color: #b91c1c; }
  html.light .text-violet-300 { color: #6d28d9; }
  html.light .text-teal-300 { color: #0f766e; }
  html.light .text-pink-300 { color: #be185d; }
  html.light .text-orange-300 { color: #c2410c; }
  html.light .text-indigo-300 { color: #4338ca; }
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
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
