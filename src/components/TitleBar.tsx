import { Menu } from "lucide-react";

export default function TitleBar() {
  return (
    <div className="titlebar">
      <Menu size={16} />
      <span>Aegisora</span>
    </div>
  );
}