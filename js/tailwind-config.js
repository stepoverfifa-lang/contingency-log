// Tailwind theme: KSAU-HS fonts and brand colours (ksau-50 … ksau-950, gold).
// Loaded right after the Tailwind CDN script in index.html.
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Kufi Arabic"', 'sans-serif'],
        arabic: ['"Noto Kufi Arabic"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ksau: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#15803d',
          600: '#0f6838',
          700: '#0b532d',
          800: '#083f22',
          900: '#052916',
          950: '#02170c',
          gold: '#9e7b2f',
          goldlight: '#fcf6c5',
          goldbright: '#c5a059'
        }
      }
    }
  }
}
