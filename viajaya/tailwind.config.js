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
        galardoneslogo:"#cb9246"

      },
      cursor: {
        custom: 'url("../src/assets/mascota.png"), auto',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'], // Definir la fuente Nunito
        dancing:['Dancing+Script']
      },
    },
  },
  plugins: [],
}
