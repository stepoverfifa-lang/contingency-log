// Built-in KSAU-HS emblem, drawn as SVG. Used when no logo image is uploaded.
// ================= 1. HIGH-PRECISION EXACT KSAU-HS EMBLEM SVG REPLICA =================
export const EXACT_KSAU_SVG = `
  <svg viewBox="0 0 240 240" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="ksauTopArc" d="M 27,120 A 93,93 0 1,1 213,120" fill="none"/>
      <path id="ksauBotArc" d="M 22,124 A 98,98 0 0,0 218,124" fill="none"/>
    </defs>
    <!-- Outer Green Seal Ring -->
    <circle cx="120" cy="120" r="118" fill="#0f6838" stroke="#9e7b2f" stroke-width="3.5"/>
    <!-- Inner Cream Field -->
    <circle cx="120" cy="120" r="80" fill="#fcf6c5" stroke="#9e7b2f" stroke-width="3"/>
    <!-- Curved Arabic University Name -->
    <text fill="#fcf6c5" font-family="'Noto Kufi Arabic', sans-serif" font-size="11.5" font-weight="700" text-anchor="middle">
      <textPath href="#ksauTopArc" startOffset="50%">جامعة الملك سعود بن عبد العزيز للعلوم الصحية</textPath>
    </text>
    <!-- Curved English University Name -->
    <text fill="#fcf6c5" font-family="'Plus Jakarta Sans', sans-serif" font-size="8.7" font-weight="800" letter-spacing="0.15" text-anchor="middle">
      <textPath href="#ksauBotArc" startOffset="50%">King Saud bin Abdulaziz University for Health Sciences</textPath>
    </text>
    <!-- Golden 3-Lobed Trefoil Arch -->
    <path d="M 120,46
             C 138,65 143,88 139,109
             C 162,118 176,136 181,160
             C 158,172 138,169 120,155
             C 102,169 82,172 59,160
             C 64,136 78,118 101,109
             C 97,88 102,65 120,46 Z"
          fill="none" stroke="#9e7b2f" stroke-width="8.5" stroke-linejoin="round" stroke-linecap="round"/>
    <!-- Top Lobe: Saudi Palm & Crossed Swords -->
    <g transform="translate(120, 79)">
      <line x1="0" y1="7" x2="0" y2="-6" stroke="#0f6838" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M0,-6 C-5,-10 -10,-8 -12,-4 M0,-6 C5,-10 10,-8 12,-4 M0,-7 C-4,-13 -8,-13 -10,-10 M0,-7 C4,-13 8,-13 10,-10 M0,-8 L0,-14" stroke="#0f6838" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M-14,10 Q0,3 14,12 M14,10 Q0,3 -14,12" stroke="#0f6838" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    </g>
    <!-- Center: Open Book -->
    <g transform="translate(120, 121)">
      <path d="M-16,-10 L-2,-8 L-2,10 L-16,8 Z M16,-10 L2,-8 L2,10 L16,8 Z" fill="#fcf6c5" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
      <line x1="0" y1="-8" x2="0" y2="11" stroke="#1e293b" stroke-width="2"/>
      <line x1="-12" y1="-4" x2="-5" y2="-3" stroke="#1e293b" stroke-width="1.2"/>
      <line x1="-12" y1="1" x2="-5" y2="2" stroke="#1e293b" stroke-width="1.2"/>
      <line x1="5" y1="-3" x2="12" y2="-4" stroke="#1e293b" stroke-width="1.2"/>
      <line x1="5" y1="2" x2="12" y2="1" stroke="#1e293b" stroke-width="1.2"/>
    </g>
    <!-- Bottom-Left Lobe: Stethoscope -->
    <g transform="translate(86, 144)">
      <path d="M-6,-10 C-6,-2 4,-2 4,-10" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      <path d="M-1,-4 L-4,6 C-6,11 -13,10 -12,4 C-11,-1 -4,1 -1,6 C2,10 8,8 9,3" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      <circle cx="10" cy="1" r="2.8" fill="#fcf6c5" stroke="#1e293b" stroke-width="2"/>
    </g>
    <!-- Bottom-Right Lobe: DNA Double Helix -->
    <g transform="translate(154, 144) rotate(-32)">
      <path d="M-12,-4 Q-6,5 0,-4 T12,-4" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-12,4 Q-6,-5 0,4 T12,4" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="-8" y1="-2" x2="-8" y2="2" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="0" y1="-3" x2="0" y2="3" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="8" y1="-2" x2="8" y2="2" stroke="#1e293b" stroke-width="1.5"/>
    </g>
    <!-- Founding Years: 2005 & ١٤٢٦ -->
    <text x="92" y="185" fill="#1e293b" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle" transform="rotate(18, 92, 185)">2005</text>
    <text x="148" y="185" fill="#1e293b" font-family="sans-serif" font-size="11.5" font-weight="800" text-anchor="middle" transform="rotate(-18, 148, 185)">١٤٢٦</text>
  </svg>
`;
