/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html",
    "./*.html",
  ],
    theme: {
        extend: {
            fontFamily: {
                'playfair': ['Playfair Display', 'serif'],
                'montserrat': ['Montserrat', 'sans-serif'],
            },
            colors: {
                'velvra': {
                    'charcoal': '#1a1a1a',
                    'gold': '#d4af37',
                    'cream': '#f8f6f0',
                    'pearl': '#fefcf7',
                    'beige': '#e8dcc6',
                    'stone': '#a8a196',
                    'brand' : '#f8e9d3',
                    'velvra-gold-dark': '#B8941F',
                    'velvra-gold-light': '#E5C547'
                }
            },
            animation: {
                'slide-up': 'slideUp 0.6s ease-out',
                'fade-in': 'fadeIn 0.8s ease-in-out',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'fadeInUp': 'fadeInUp 0.8s cubic-bezier(0.23, 1, 0.320, 1)',
                'scaleIn': 'scaleIn 0.5s cubic-bezier(0.23, 1, 0.320, 1)',
                'scale-inSeller': 'scaleIn 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'shimmer': 'shimmer 2s infinite',
                'bounce-subtle': 'bounceSubtle 0.6s ease-out'
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' }
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleInSeller: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-4px)' }
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
                }
            },
            backdropBlur: {
                'xs': '2px',
            }
        }
    },
  plugins: [],
}
