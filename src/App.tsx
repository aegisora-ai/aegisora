import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Logo from "./components/Logo";
import { useSession } from "./lib/useSession";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Shell from "./pages/Shell";
import Overview from "./pages/Overview";
import LiveActivity from "./pages/LiveActivity";
import Agents from "./pages/Agents";
import Policies from "./pages/Policies";
import Decisions from "./pages/Decisions";
import Approvals from "./pages/Approvals";
import Incidents from "./pages/Incidents";
import Evidence from "./pages/Evidence";
import Audit from "./pages/Audit";
import Traces from "./pages/Traces";
import Webhooks from "./pages/Webhooks";
import ApiKeys from "./pages/ApiKeys";
import Diagnostics from "./pages/Diagnostics";
import Settings from "./pages/Settings";
import AccessGate from "./pages/AccessGate";
import Notifications from "./pages/Notifications";
import Connect from "./pages/Connect";
import Security from "./pages/Security";
import Setup from "./pages/Setup";
import NotifyBridge from "./lib/NotifyBridge";
import { ExtensionHub } from "./extensions/ExtensionHub";

function Splash() {
  return <div className="center full"><Logo className="logo"  alt="Aegisora" /></div>;
}

function Gate({ children }: { children: ReactElement }) {
  const { session, loading } = useSession();
  if (loading) return <Splash />;
  return session ? <AccessGate><><NotifyBridge />{children}</></AccessGate> : <Navigate to="/login" replace />;
}

export default function App() {
  const { session, loading } = useSession();
  return (
    <Routes>
      <Route path="/" element={loading ? <Splash /> : session ? <Navigate to="/app" replace /> : <Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Gate><Shell /></Gate>}>
        <Route index element={<Overview />} />
        <Route path="live-activity" element={<LiveActivity />} />
        <Route path="agents" element={<Agents />} />
        <Route path="policies" element={<Policies />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="evidence" element={<Evidence />} />
        <Route path="audit" element={<Audit />} />
        <Route path="traces" element={<Traces />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="connectors" element={<ExtensionHub kind="connectors" />} />
        <Route path="presets" element={<ExtensionHub kind="presets" />} />
        <Route path="skills" element={<ExtensionHub kind="skills" />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="diagnostics" element={<Diagnostics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="connect" element={<Connect />} />
        <Route path="security" element={<Security />} />
        <Route path="setup" element={<Setup />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
