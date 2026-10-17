import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Search } from "lucide-react";
import logo from "../assets/logo";
import TitleBar from "../components/TitleBar";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { NAV } from "../nav";

export default function Shell() {
  const nav = useNavigate();
  const { session } = useSession();
  async function signOut() {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  }
  return (
    <div className="window">
      <TitleBar />
      <div className="shell">
        <aside className="side">
          <div className="brand"><img src={logo} alt="" /><div><b>Mosell</b><small>Control</small></div></div>
          <nav>
            {NAV.map((g) => (
              <div className="nav-group" key={g.group}>
                <div className="nav-title">{g.group}</div>
                {g.items.map((i) => (
                  <NavLink
                    key={i.label}
                    to={i.path === "" ? "/app" : `/app/${i.path}`}
                    end={i.path === ""}
                    className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
                  >
                    <i.icon size={15} />
                    {i.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="main-col">
          <header className="top">
            <div className="search"><Search size={14} /> Search <kbd>Ctrl K</kbd></div>
            <div className="spacer" />
            <span className="mute small-text">{session?.user.email}</span>
            <button className="icon-btn" onClick={signOut} title="Sign out"><LogOut size={15} /></button>
          </header>
          <div className="content"><Outlet /></div>
        </div>
      </div>
    </div>
  );
}