import React from "react";
import './section1.css';

const Recent = (props) => {
  const { imageUrl, eventName, description, link } = props;

  return (
    <div className="horizontal-section">
      <p className="eventname">{eventName}</p>

      <div className="horizontal">
        <div className="image-container">
          <img src={imageUrl} alt="Event" />
        </div>

        <div className="text-container">
          <div className="description-scroll">
            <p>{description}</p>
          </div>

          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer">
              <button className="cta-button">View More</button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recent;
