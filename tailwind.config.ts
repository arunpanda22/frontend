// Path: tailwind.config.ts
import type { Config } from "tailwindcss"
import animatePlugin from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
            amazon: {
                DEFAULT: '#ff9900',
                dark: '#e88b00'
            },
            // Deep Space Blue - Palette 1 (Primary Brand Color)
            'deep-space': {
                50: '#E7F5FE',
                100: '#CFECFC',
                200: '#9ED8FA',
                300: '#6EC5F7',
                400: '#3DB1F5',
                500: '#0D9EF2',  // Main brand color
                600: '#0A7EC2',
                700: '#085F91',
                800: '#053F61',
                900: '#032030',
                950: '#021622',
            },
            // Aqua Breeze - Palette 2 (Accent/Secondary)
            'aqua': {
                50: '#E9FAFC',
                100: '#D3F5F8',
                200: '#A6EBF2',
                300: '#7AE2EB',
                400: '#4ED8E4',
                500: '#21CEDE',  // Main aqua color
                600: '#1BA5B1',
                700: '#147C85',
                800: '#0D5259',
                900: '#07292C',
                950: '#051D1F',
            },
			'powder-blue': {
				50: '#EEF2F6',
				100: '#DEE6ED',
				200: '#BCCCDC',
				300: '#9BB2CA',
				400: '#7999B9',
				500: '#587FA7',  // Main powder blue color
				600: '#466686',
				700: '#354C64',
				800: '#233343',
				900: '#121921',
				950: '#0C1217',
			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [animatePlugin, require("tailwindcss-animate")],
} satisfies Config

export default config