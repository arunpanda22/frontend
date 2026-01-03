import localFont from "next/font/local";


export const inter = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Regular.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const montserrat = localFont({
  src: [
    {
      path: "../../public/fonts/Montserrat-VariableFont_wght.woff2",
      weight: "100 900", // Variable font supports all weights
      style: "normal",
    },
    // {
    //   path: "../public/fonts/Montserrat-Italic-VariableFont_wght.woff2",
    //   weight: "100 900",
    //   style: "italic",
    // },
  ],
  variable: "--font-montserrat",
  display: "swap",
});