/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',  
  ],
  theme: {
    extend: {
      colors:{
        botonPopup: "#573b58",
        fondoPopup: "#421261",
        ColorMorado: "#b85aa1",
        ColorAzul:"#2be0e9 ",
        BotonNaranja: "#f7944f",
        BotonAmarillo:"#e4e13e",
        BotonMorado: "#7d0091",
        BotonValija:"#ffe102",
        FondoTit:"#4b5563",
        MoradoSuave:"#dc86c7",
        moradito:"#cdb2d5",
        galardones:"#1d1c55",
        galardoneslogo:"#cb9246",
        secondary: "#421261",
        verde:"#FEE202"

      },
      cursor: {
        custom: 'url("../src/assets/mascota.png"), auto',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'], // Definir la fuente Nunito
        dancing:['Dancing+Script']
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideIn': 'slideIn 0.4s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      // ✅ Definir los keyframes
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
        },
        slideIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        slideUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(30px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        bounceSoft: {
          '0%, 100%': { 
            transform: 'translateY(0)' 
          },
          '50%': { 
            transform: 'translateY(-5px)' 
          },
        },
        wiggle: {
          '0%, 100%': { 
            transform: 'rotate(-3deg)' 
          },
          '50%': { 
            transform: 'rotate(3deg)' 
          },
        }
      },
      // ✅ Agregar transiciones personalizadas
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      // ✅ Duraciones de transición personalizadas
      transitionDuration: {
        '0': '0ms',
        '2000': '2000ms',
      }
    },
  },
  plugins: [],
}
