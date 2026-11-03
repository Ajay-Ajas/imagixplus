import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { useSettings } from "../hooks/hooks";

export function LogoImage({ className = "" }: { className?: string }) {
  const { site } = useSettings();
  return <img className={`logo-img ${className}`} src={site.logoUrl || logo} alt="IMAGIX+" width={1003} height={207} decoding="async" />;
}
export const Logo = () => (
  <Link to="/" className="logo-link" aria-label="IMAGIX+ home"><LogoImage /></Link>
);
