import Link from "next/link";
export default function ProjectsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ROOM TO GROW</div>
          <h1>Projects</h1>
          <p>Your tiny worlds will live here.</p>
        </div>
        <span className="badge neutral">Planned</span>
      </div>
      <section className="panel settings-panel">
        <h2>Project library comes next</h2>
        <p>
          This foundation release keeps one local sprite draft in IndexedDB.
          Multi-project management and .tamaproject import/export are outside
          Tasks 01–10.
        </p>
        <Link className="text-link" href="/studio">
          Open the sprite workspace →
        </Link>
      </section>
    </>
  );
}
