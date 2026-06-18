/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#EEF1EF',
          dim: '#E4E8E5'
        },
        ink: {
          DEFAULT: '#15231F',
          soft: '#3C4A45',
          faint: '#7C8884'
        },
        surface: '#FFFFFF',
        jade: {
          50: '#EAF3F0',
          100: '#CFE5DD',
          300: '#7FB3A2',
          500: '#2F6F62',
          600: '#255A50',
          700: '#1C453E'
        },
        brass: {
          100: '#F3E7CE',
          300: '#D9BC85',
          500: '#C9A66B',
          600: '#AD8A50'
        },
        ember: {
          100: '#FBE3D5',
          400: '#E2703A',
          500: '#C85A28',
          600: '#A8481E'
        },
        moss: {
          400: '#6E9461',
          500: '#4F7942'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,35,31,0.06), 0 1px 1px rgba(21,35,31,0.04)',
        lift: '0 8px 24px rgba(21,35,31,0.12)',
        rail: 'inset 1px 0 0 rgba(21,35,31,0.08)'
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, rgba(21,35,31,0.10) 1px, transparent 1px)'
      },
      backgroundSize: {
        'dot-grid': '16px 16px'
      }
    }
  },
  plugins: []
}
