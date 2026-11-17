import type { ImgHTMLAttributes } from "react";
import { useTheme } from "../lib/theme";
import lightLogo from "../assets/brand/logo-light.png";
import darkLogo from "../assets/brand/logo-dark.png";

export default function Logo(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { resolved } = useTheme();
  return <img {...props} src={resolved === "dark" ? darkLogo : lightLogo} />;
}