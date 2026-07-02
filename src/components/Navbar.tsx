import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <img
          src="/UNAHUR-04-1080x675.png"
          alt="UNAHUR"
          className="brand-logo"
        />
        <span className="brand-text">UNAHUR Anti-Social Net</span>
      </Link>
    </header>
  );
}
