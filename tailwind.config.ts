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
		fontFamily: {
			sans: ["var(--font-inter)", "system-ui", "sans-serif"],
			montserrat: ["var(--font-montserrat)", "sans-serif"],
		},
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
			'jungle-teal': {
				50:  '#F0F4F3',  
				100: '#E2E9E6', 
				200: '#C4D4CD',  
				300: '#A7BEB4', 
				400: '#8AA89B',  
				500: '#6C9382',  
				600: '#577568',  
				700: '#41584E',  
				800: '#2B3B34',  
				900: '#161D1A',  
				950: '#0F1512',
			},
			ocean: {
				50:  "#EBF1FC",
				100: "#D7E3F9",
				200: "#ADC8F3",
				300: "#7EAEED",
				400: "#4F94DE",
				500: "#407AB8",
				600: "#316095",
				700: "#234871",
				800: "#163250",
				900: "#0A1C30",
			},
			gold: {
				50:  "#FFF9E5",
				100: "#FFF2CC",
				200: "#FFE699",
				300: "#FFD966",
				400: "#FFBF00",
				500: "#CC9900",
				600: "#997300",
				700: "#664D00",
				800: "#332600",
				900: "#241B00",
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
  		},
		boxShadow: {
			'icon': '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
		},
		
  	}
  },
  plugins: [animatePlugin, require("tailwindcss-animate")],
} satisfies Config

export default config