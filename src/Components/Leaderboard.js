import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: Converts Google Drive share links to direct image links
// Helper: Converts Google Drive share links to a high-quality thumbnail link
  const getDirectImageSrc = (url) => {
    if (!url) return null;
    
    // Check if it's a google drive link
    if (url.includes('drive.google.com')) {
      // Extract the ID
      const idMatch = url.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
      const id = idMatch ? (idMatch[1] || idMatch[2]) : null;
      if (id) {
        // CHANGED: Use the 'thumbnail' endpoint with size w1000 (width 1000px)
        // This is much more reliable for embedding than export=view
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
      }
    }
    // If it's a direct link (like imgur), just return it as is
    return url;
  };

  useEffect(() => {
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRlYfXayJkfwtIWcG5-w8_UEt66uGRqDLOf4SFBbtzuO_5zO9a7Uwv8a4-An3f9thC-5NtdCqAkiNzR/pub?output=csv&gid=918222027')
      .then(res => res.text())
      .then(csv => {
        const [headerLine, ...lines] = csv.trim().split('\n');
        const headers = headerLine.split(',').map(h => h.trim());

        const rawEntries = lines.map(line => {
          const cols = line.split(',');
          return headers.reduce((obj, key, i) => {
            obj[key] = cols[i] ? cols[i].trim() : '';
            return obj;
          }, {});
        });

        const groups = {};
        
        rawEntries.forEach(entry => {
          const challengeName = entry[headers[0]]; 
          const month = entry[headers[1]];
          const groupKey = `${month}::${challengeName}`;

          if (!groups[groupKey]) {
            groups[groupKey] = {
              month: month,
              challengeName: challengeName,
              imageUrl: null, // Initialize image container
              entries: []
            };
          }

          // Create a copy of the row data
          const entryData = { ...entry };

          // 1. Look for the ImageURL column
          // We look for a column strictly named "ImageURL"
          if (entryData['ImageURL']) {
            // If this group doesn't have an image yet, set it
            if (!groups[groupKey].imageUrl) {
              groups[groupKey].imageUrl = getDirectImageSrc(entryData['ImageURL']);
            }
          }

          // 2. Cleanup: Delete columns we don't want in the table
          delete entryData[headers[0]]; // Remove Challenge Name column
          delete entryData[headers[1]]; // Remove Month column
          delete entryData['ImageURL']; // Remove ImageURL column (so it doesn't show in table)
          
          groups[groupKey].entries.push(entryData);
        });

        const sortedGroups = Object.values(groups).sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateB - dateA;
        });

        setGroupedData(sortedGroups);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching CSV:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-bg" />
      <div className="leaderboard-content">
        <h1 className="main-title">Leaderboard</h1>
        
        {loading && <p>Loading leaderboard...</p>}

        {!loading && groupedData.map((group, index) => (
          <div key={index} className="challenge-section">
            <div className="challenge-header">
              <h2>{group.challengeName}</h2>
              <span className="challenge-month">{group.month}</span>
            </div>
            
            <table>
              <thead>
                <tr>
                  {/* Dynamically render headers based on remaining keys */}
                  {group.entries.length > 0 && Object.keys(group.entries[0]).map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.entries.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Check if this group has an image URL and render it */}
            {group.imageUrl && (
              <div className="challenge-image-container">
                <img 
                  src={group.imageUrl} 
                  alt={`${group.month} Challenge Highlight`} 
                  className="challenge-image"
                />
              </div>
            )}

          </div>
        ))}
        
        {!loading && groupedData.length === 0 && <p>No data found.</p>}
      </div>
    </div>
  );
};

export default Leaderboard;