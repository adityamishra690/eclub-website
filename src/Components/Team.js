import React from "react";
import "./Team.css";
import data from "../database/data.json";

const Card = ({ title, items, featured = false }) => {
  return (
    <section className="team-section">
      <h2 className="section-title">{title}</h2>

      <div className="team-grid">
        {items.map((item, index) => (
          <div
            className={`team-card ${featured ? "featured-card" : ""}`}
            key={item.id ?? item.name}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="image-wrapper">
              <img
                src={item.image}
                alt={item.name}
                className="team-image"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "/fallback-avatar.png";
                }}
              />
            </div>

            <div className="team-content">
              <h4 className="member-name">{item.name}</h4>
              <p className="member-role">{item.vertical}</p>

              {(item.facebook || item.email) && (
                <div className="social-links">
                  {item.facebook &&
                    item.facebook.trim() !== "#" &&
                    item.facebook.trim() !== "" && (
                      <a
                        href={item.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.name} Instagram profile`}
                      >
                        <i className="fa fa-instagram"></i>
                      </a>
                    )}

                  {item.email && (
                    <a
                      href={`mailto:${item.email}`}
                      aria-label={`Email ${item.name}`}
                    >
                      <i className="fa fa-envelope"></i>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

function App() {
  return (
    <div className="team-page">
      <div className="team-hero">
        <h1>Meet Our Team</h1>

        <p>
          You can access information about the current members of the
          Electronics Club team below. Contact details are provided so you can
          easily reach the appropriate team member for guidance, projects,
          events, or club-related queries.
        </p>
      </div>

      <Card title="Coordinators" items={data.coordi} featured={true} />

      <Card title="Coordinators 25-26" items={data.pastcoordi} />

      <Card title="Secretaries" items={data.manager} />
    </div>
  );
}

export default App;
export { Card };