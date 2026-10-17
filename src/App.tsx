import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import logo from "./assets/logo";
import { useSession } from "./lib/useSession";
import { NAV } from "./nav";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Shell from "./pages/Shell";
import Overview from "./pages/Overview";
import Placeholder from "./pages/Placeholder";

function Splash() {
  return <div className="center full"><img className="logo" src={logo} alt="Mosell" /></div>;
}

function Gate({ children }: { children: ReactElement }) {
  const { session, loading } = useSession();
  if (loading) return <Splash />;
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { session, loading } = useSession();
  const items = NAV.flatMap((g) => g.items).filter((i) => i.path !== "");
  return (
    <Routes>
      <Route path="/" element={loading ? <Splash /> : session ? <Navigate to="/app" replace /> : <Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Gate><Shell /></Gate>}>
        <Route index element={<Overview />} />
        {items.map((i) => (
          <Route key={i.path} path={i.path} element={<Placeholder title={i.label} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}