import { signIn } from "@/auth";

export default function SignIn() {
  return (
    <main style={{ maxWidth: "44ch", margin: "0 auto", padding: "18vh 20px" }}>
      <div className="wordmark" style={{ padding: 0, marginBottom: 18 }}>growth desk</div>
      <p className="plain" style={{ marginBottom: 24 }}>
        Drafts growth moves for Marskel, Deckle and Echoself. It never sends them.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/" });
        }}
      >
        <button className="btn primary" type="submit">Continue with GitHub</button>
      </form>
      <p className="plain" style={{ marginTop: 22, color: "var(--ink-faint)" }}>
        One account. The allowlist is a single GitHub login and it fails closed.
      </p>
    </main>
  );
}
