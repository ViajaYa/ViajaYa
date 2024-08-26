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
        ColorAzul:"#2be0e9 "

      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'], // Definir la fuente Nunito
        dancing:['Dancing+Script']
      },
    },
  },
  plugins: [],
}
