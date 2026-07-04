import React from 'react';
import './Projects.css';
import data from '../database/projects.json';

const ProjectCard = ({ title, description, imagePath, pdfPath }) => {
  return (
    <div className="project-card">
      <div className="project-image">
        <img src={require(`../database/${imagePath}`)} alt={title} />
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      {pdfPath ? (
        <a
          href={require(`../database/${pdfPath}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="modBtn"
        >
          Read More <i className="fa fa-long-arrow-right"></i>
        </a>
      ) : (
        <button className="modBtn" disabled>
          Read More <i className="fa fa-long-arrow-right"></i>
        </button>
      )}
    </div>
  );
};

function App() {
  const projectsByYear = {};
  const [selectedYear, setSelectedYear] = React.useState('25'); // Default to '2025'

  const YearTabs = ({ years, onSelectYear }) => {
    return (
      <div className="year-tabs">
        {years.map(year => (
          <button key={year} onClick={() => onSelectYear(year)}>
            Summers' {year}
          </button>
        ))}
      </div>
    );
  };

  const handleSelectYear = (year) => {
    setSelectedYear(year);
  };

  // Group projects by year
  data.Projects.forEach((project) => {
    const year = project.year;
    if (!projectsByYear[year]) {
      projectsByYear[year] = [];
    }
    projectsByYear[year].push(project);
  });

  // Get years in reverse chronological order
  const sortedYears = Object.keys(projectsByYear).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <h1 className="project-heading">Projects</h1>
      <YearTabs years={sortedYears} onSelectYear={handleSelectYear} />
      <div className="project-container">
        {projectsByYear[selectedYear]?.map((project, index) => (
          <React.Fragment key={`${project.title}-${project.year}`}>
            <ProjectCard
              title={project.title}
              description={project.description}
              imagePath={project.imagePath}
              pdfPath={project.pdfPath}
            />
            {((index + 1) % 3 === 0) && <div style={{ flexBasis: '100%', height: '0' }}></div>}
          </React.Fragment>
        )) || <p>No projects available for {selectedYear}</p>}
      </div>
    </>
  );
}

export default App;
export { ProjectCard };