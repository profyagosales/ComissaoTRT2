// app/config/logos.ts

// Caminhos exatos dos arquivos na pasta public/Branding
export const logos = {
  // 1) Círculo vermelho/preto (principal)
  primary: "/Branding/LogoOficial1.png",

  // 2) Versão PB (neutra)
  mono: "/Branding/LogoOficial2.png",

  // 3) Logo em fundo vermelho
  onRed: "/Branding/LogoOficial3.png",

  // 4) Logo em fundo preto
  onBlack: "/Branding/LogoOficial4.png",

  // 5) Logo invertida (branco/preto)
  inverted: "/Branding/LogoOficial5.png",
} as const;

export type LogoKey = keyof typeof logos;
