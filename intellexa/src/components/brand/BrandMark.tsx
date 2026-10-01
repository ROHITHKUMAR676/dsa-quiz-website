import intellexaPurpleLogo from "../../assets/intellexa-ppbg.png";
import intellexaWhiteLogo from "../../assets/intellexa-whitebg.png";
import { useTheme } from "../../context/ThemeContext";

interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className = "" }: BrandMarkProps) {
  const { theme } = useTheme();

  return (
    <img
      src={theme === "light" ? intellexaWhiteLogo : intellexaPurpleLogo}
      alt="Intellexa"
      className={`block h-auto object-contain ${className}`}
    />
  );
}
