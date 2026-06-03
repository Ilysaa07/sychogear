const fs = require('fs');
let code = fs.readFileSync('app/layout.tsx', 'utf-8');

// Replace font imports
code = code.replace(
  /import \{ Cormorant_Garamond, Syne, DM_Mono, Metal_Mania, Rubik_Glitch \} from "next\/font\/google";/,
  'import { Inter } from "next/font/google";'
);
code = code.replace(/import localFont from "next\/font\/local";\n/, '');

// Remove all the font definitions
const fontDefRegex = /\/\* ─── DISPLAY[\s\S]*?display: "swap",\n\}\);\n/g;
code = code.replace(fontDefRegex, '');

// Insert Inter font def
const newFontDef = `
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-syne", // Overriding the existing variable so we don't have to change everywhere
  display: "swap",
});

const interDisplay = Inter({
  subsets: ["latin"],
  variable: "--font-display-cormorant", // Overriding
  display: "swap",
});

const interMono = Inter({
  subsets: ["latin"],
  variable: "--font-dm-mono", // Overriding
  display: "swap",
});
`;
code = code.replace(/import \{ Toaster \} from "react-hot-toast";\n/, 'import { Toaster } from "react-hot-toast";\n' + newFontDef);

// Replace body classnames
code = code.replace(
  /\$\{cormorant\.variable\}\s+\$\{syne\.variable\}\s+\$\{dmMono\.variable\}\s+\$\{hooliganFont\.variable\}\s+\$\{metalMania\.variable\}\s+\$\{rubikGlitch\.variable\}/g,
  '${inter.variable} ${interDisplay.variable} ${interMono.variable}'
);

fs.writeFileSync('app/layout.tsx', code);
console.log('layout.tsx updated');
