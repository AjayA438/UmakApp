/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.js', './App.js', './src/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark green primary
        primary: '#14532D',
        'primary-700': '#1F5033',
        'primary-600': '#2A6540',
        'primary-500': '#3B7F51',
        'primary-400': '#5D9A6D',
        'primary-200': '#BAD7BF',
        'primary-100': '#DCEBDF',
        'primary-50': '#F0F7F1',
        // Light green-tinted app background
        tint: '#EFF6F0',
        card: '#FFFFFF',
        ink: '#0F1F14',
        muted: '#6B7280',
        line: '#E2EDE4',
        danger: '#B91C1C',
        'danger-tint': '#FEE2E2',
        warning: '#B45309',
        'warning-tint': '#FEF3C7',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        inter: ['Inter_400Regular', 'System'],
        'inter-medium': ['Inter_500Medium', 'System'],
        'inter-semibold': ['Inter_600SemiBold', 'System'],
        'inter-bold': ['Inter_700Bold', 'System'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(20, 83, 45, 0.08)',
        card: '0 2px 12px rgba(20, 83, 45, 0.06)',
        floating: '0 12px 32px rgba(20, 83, 45, 0.22)',
      },
    },
  },
  plugins: [],
};
