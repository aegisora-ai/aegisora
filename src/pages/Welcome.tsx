import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import TitleBar from "../components/TitleBar";

export default function Welcome() {
  return (
    <div className="window">
      <TitleBar />
      <main className="center">
        <Logo className="logo"  alt="Aegisora" />
        <h1 className="serif">Aegisora <em>for</em> Windows</h1>
        <p className="mute">The fastest way to govern your AI agents</p>
      </main>
      <div className="bottom">
        <Link className="btn" to="/login">Get started</Link>
        <p className="foot">Built by Aegisora</p>
      </div>
    </div>
  );
}