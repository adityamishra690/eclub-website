import React, { useEffect, useState } from 'react';
import './Gallery.css';

// ==========================================
// YOUR KEYS
// ==========================================
const API_KEY = 'AIzaSyAGU_45FCNsh5M6tuc9mnUqQ8Uhf5Cdjgk'; 
const FOLDER_ID = '1SDMIBSuweTO3zHHKqZXy7nMpEMPhVOK9';
// ==========================================

const Gallery = () => {
  const [items, setItems] = useState([]); // Renamed from 'images' to 'items'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: Fisher-Yates Shuffle
  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  useEffect(() => {
    const fetchMediaFromDrive = async () => {
      try {
        // CHANGED: Query now asks for images OR videos
        const query = `'${FOLDER_ID}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`;
        
        // CHANGED: We request 'videoMediaMetadata' too
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,imageMediaMetadata,videoMediaMetadata)&key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        const processedItems = data.files.map(file => {
          const isVideo = file.mimeType.startsWith('video');
          
          // Get metadata from the correct property
          const metadata = isVideo ? file.videoMediaMetadata : file.imageMediaMetadata;
          
          // Fallback if metadata is missing (sometimes happens with new files)
          const width = metadata ? metadata.width : 1;
          const height = metadata ? metadata.height : 1;
          const aspectRatio = width / height;
          
          // INTELLIGENT SIZING LOGIC
          let sizeClass = 'item-small'; 
          
          if (aspectRatio < 0.75) {
            sizeClass = 'item-tall'; // Portrait
          } else if (aspectRatio > 1.3) {
             sizeClass = 'item-wide'; // Landscape
          } else if (width > 1200 && height > 1200) {
            sizeClass = 'item-big';  // High-res Square
          }

          return {
            id: file.id,
            // Drive generates thumbnails for videos too!
            src: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
            alt: file.name,
            sizeClass: sizeClass,
            isVideo: isVideo,
            // Link to open video in new tab (since autoplaying grid videos is heavy)
            videoLink: isVideo ? `https://drive.google.com/file/d/${file.id}/view` : null
          };
        });

        const randomizedItems = shuffleArray(processedItems);
        setItems(randomizedItems);
        setLoading(false);

      } catch (err) {
        console.error("Error fetching media:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMediaFromDrive();
  }, []);

  if (error) {
    return (
      <div className="gallery-container">
        <div className="gallery-bg" />
        <div className="gallery-content">
          <h1 className="gallery-title">Gallery</h1>
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-bg" />
      <div className="gallery-content">
        <h1 className="gallery-title">Gallery</h1>
        
        {loading && <p>Loading memories...</p>}

        {!loading && (
          <div className="gallery-grid">
            {items.map(item => (
              <div 
                key={item.id} 
                className={`gallery-item ${item.sizeClass}`}
                // If it's a video, clicking opens it. If image, it does nothing (or you can add lightbox)
                onClick={() => item.isVideo && window.open(item.videoLink, '_blank')}
              >
                <img 
                  src={item.src} 
                  alt={item.alt} 
                  className="gallery-img" 
                  loading="lazy" 
                />
                
                {/* Visual Overlay */}
                <div className="gallery-overlay">
                  {/* Show Play Button text only if it's a video */}
                  {item.isVideo && <span className="play-icon">▶</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;