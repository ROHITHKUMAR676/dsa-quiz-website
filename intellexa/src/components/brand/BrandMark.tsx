import intellexaPurpleLogo from "../../assets/intellexa-ppbg.png";
import intellexaWhiteLogo from "../../assets/intellexa-whitebg.png";
import { useTheme } from "../../context/ThemeContext";

interface BrandMarkProps {
  className?: string;
  onLoad?: () => void;
}

export default function BrandMark({ className = "", onLoad }: BrandMarkProps) {
  const { theme } = useTheme();

  return (
    <img
      src={theme === "light" ? intellexaWhiteLogo : intellexaPurpleLogo}
      alt="Intellexa"
      onLoad={onLoad}
      className={`block h-auto object-contain ${className}`}
    />
  );
}
