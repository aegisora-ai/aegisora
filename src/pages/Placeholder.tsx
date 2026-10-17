export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <h2 className="page-title">{title}</h2>
      <div className="card"><p className="mute">This section is being migrated from the Aegisora dashboard.</p></div>
    </>
  );
}