"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f8f5ef", color: "#26231f", fontFamily: "Georgia, serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ letterSpacing: ".28em", textTransform: "uppercase", fontSize: 12, color: "#9a7b45", fontFamily: "Arial, sans-serif" }}>Naaz Creation</p>
          <h1 style={{ fontWeight: 500, fontSize: 40, margin: "16px 0" }}>Something went wrong.</h1>
          <p style={{ fontFamily: "Arial, sans-serif", color: "#5b554c" }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 24, background: "#572e35", color: "#f8f5ef", border: 0, padding: "14px 28px", letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
