import { Link } from "react-router-dom";
import logo from "../assets/logo";
import TitleBar from "../components/TitleBar";

export default function Welcome() {
  return (
    <div className="window">
      <TitleBar />
      <main className="center">
        <img className="logo" src={logo} alt="Mosell" />
        <h1 className="serif">Mosell <em>for</em> Windows</h1>
        <p className="mute">The fastest way to govern your AI agents</p>
      </main>
      <div className="bottom">
        <Link className="btn" to="/login">Get started</Link>
        <p className="foot">Built by Aegisora</p>
      </div>
    </div>
  );
}