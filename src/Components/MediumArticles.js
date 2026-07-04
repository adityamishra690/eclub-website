import React from "react";

const articles = [
  {
    title: "Photonic Circuits",
    link: "https://medium.com/electronics-club-iitk/photonic-circuits-4b49f7744b34",
    description: "An introduction to integrated photonics and how light can be used for on-chip computation and communication.",
  },
  {
    title: "ARM vs AMD: A Journey Through Architectures, Innovations, and the AI Frontier",
    link: "https://medium.com/electronics-club-iitk/arm-vs-amd-a-journey-through-architectures-innovations-and-the-ai-frontier-9cb825eb617f",
    description: "Comparative insights into CPU architectures and their evolving roles in AI workloads.",
  },
  {
    title: "The Magic of SSDs: Unpacking the Technology Behind Solid-State Drives",
    link: "https://medium.com/electronics-club-iitk/the-magic-of-ssds-unpacking-the-technology-behind-solid-state-drives-90e275682fb2",
    description: "Demystifying how SSDs work under the hood, from NAND flash to controllers.",
  },
];

const MediumArticles = () => {
  return (
    <div style={{ padding: "24px", minHeight: "60vh" }}>
      <h1 style={{ color: "#bbdf4d", marginBottom: 8 }}>Medium Articles</h1>
      <p style={{ color: "#aaa", marginBottom: 24 }}>
        Curated articles by Electronics Club, IIT Kanpur on Medium.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {articles.map((a) => (
          <a
            key={a.link}
            href={a.link}
            style={{ textDecoration: "none", color: "inherit" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              style={{
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: 16,
                background: "#0e0e0e",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#bbdf4d")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            >
              <div style={{ fontWeight: 700, fontSize: 18, color: "#eaeaea" }}>{a.title}</div>
              <div style={{ marginTop: 8, color: "#cfd2d6", lineHeight: 1.4 }}>{a.description}</div>
              <div style={{ marginTop: 12, color: "#bbdf4d", fontSize: 14 }}>Read on Medium →</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default MediumArticles;
