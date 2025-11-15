// app/branding/logos.ts
export const logos = {
  primary: '/Branding/LogoOficial3.png',      // hero principal (fundo vermelho, círculo)
  primaryOnBlack: '/Branding/LogoOficial4.png',
  primaryOnWhite: '/Branding/LogoOficial3.png',
  monoBlack: '/Branding/LogoOficial2.png',
  monoWhite: '/Branding/LogoOficial5.png',
} as const;

export type LogoKey = keyof typeof logos;
