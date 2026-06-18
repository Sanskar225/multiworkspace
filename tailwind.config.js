/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#EEF1F5',
          dim: '#E3E8EF'
        },
        ink: {
          DEFAULT: '#141C2B',
          soft: '#3B4A60',
          faint: '#7C8AA0'
        },
        surface: '#FFFFFF',
        azure: {
          50: '#EAF1F8',
          100: '#CFE0F0',
          300: '#7FAAD0',
          500: '#2C5F8A',
          600: '#234D70',
          700: '#1B3B57'
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
          50: '#EAF3E4',
          100: '#CFE5C0',
          300: '#8FB87A',
          400: '#6E9461',
          500: '#4F7942',
          600: '#3F6135'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,28,43,0.06), 0 1px 1px rgba(20,28,43,0.04)',
        lift: '0 8px 24px rgba(20,28,43,0.12)',
        rail: 'inset 1px 0 0 rgba(20,28,43,0.08)'
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, rgba(20,28,43,0.10) 1px, transparent 1px)'
      },
      backgroundSize: {
        'dot-grid': '16px 16px'
      }
    }
  },
  plugins: []
}
