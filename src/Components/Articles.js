import React from 'react';
import './Articles.css';
import data from '../database/articles.json'; // Ensure this path is correct

const ArticleCard = ({ title, description, imagePath, url }) => {
  return (
    <div className="article-card">
      <img src={require(`../database/${imagePath}`)} alt={title} />
      <h1>{title}</h1>
      <p>{description}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="readBtn"
        >
          Read Article <i className="fa fa-long-arrow-right"></i>
        </a>
      ) : (
        <button className="readBtn" disabled>
          Coming Soon
        </button>
      )}
    </div>
  );
};

function Articles() {
  const [selectedYear, setSelectedYear] = React.useState('2025');
  const articlesByYear = {};

  // Group articles by year
  data.Articles.forEach((article) => {
    const year = article.year;
    if (!articlesByYear[year]) {
      articlesByYear[year] = [];
    }
    articlesByYear[year].push(article);
  });

  // Sorted years
  const sortedYears = Object.keys(articlesByYear).sort((a, b) => b.localeCompare(a));

  return (
    /* This wrapper applies the background and centering logic without affecting the Navbar */
    <div className="article-page-container">
      <h1 className="article-heading">Articles Archive</h1>
      
      <div className="article-tabs">
        {sortedYears.map((year) => (
          <button 
            key={year} 
            onClick={() => setSelectedYear(year)}
            style={{
              backgroundColor: selectedYear === year ? '#BBDF4D' : '',
              color: selectedYear === year ? 'rgba(17, 25, 40, 0.75)' : ''
            }}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="article-container">
        {articlesByYear[selectedYear]?.map((article, index) => (
          <React.Fragment key={`${article.title}-${article.year}`}>
            <ArticleCard
              title={article.title}
              description={article.description}
              imagePath={article.imagePath}
              url={article.url}
            />
            {/* Creates a new row every 3 items for clean alignment */}
            {((index + 1) % 3 === 0) && <div style={{ flexBasis: '100%', height: '0' }}></div>}
          </React.Fragment>
        )) || <p>No articles available for {selectedYear}</p>}
      </div>
    </div>
  );
}

export default Articles;
export { ArticleCard };