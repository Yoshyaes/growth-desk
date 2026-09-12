import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: "46ch", margin: "0 auto", padding: "18vh 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Not here</h1>
      <p className="plain" style={{ marginBottom: 20 }}>
        No such page. If you were looking for a move, the gate may have removed it from today&rsquo;s queue,
        which is working as intended.
      </p>
      <Link className="btn" href="/">Back to the desk</Link>
    </main>
  );
}
