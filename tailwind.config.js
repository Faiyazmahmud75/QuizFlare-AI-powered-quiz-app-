module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
        animation: {
            'bounce-short': 'bounce-short 1s ease-out 1',
        },
        keyframes: {
            'bounce-short': {
                '0%, 100%': {
                    transform: 'translateY(0)',
                    animationTimingFunction: 'cubic-bezier(0.8,0,1,1)'
                },
                '50%': {
                    transform: 'translateY(-15px)',
                    animationTimingFunction: 'cubic-bezier(0,0,0.2,1)'
                },
            }
        }
    },
  },
  plugins: [],
}