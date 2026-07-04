import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import './Challenge.css';

const Challenge = () => {
  const [challenge, setChallenge] = useState(null);

  useEffect(() => {
    Papa.parse(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlYfXayJkfwtIWcG5-w8_UEt66uGRqDLOf4SFBbtzuO_5zO9a7Uwv8a4-An3f9thC-5NtdCqAkiNzR/pub?output=csv',
      {
        download: true,
        header: true,
        skipEmptyLines: true,
        transform: (value) =>
          value.replace(/\\n/g, '\n').replace(/\r\n|\n|\r/g, '\n').trim(),
        complete: (result) => {
          const currentMonth = new Date().toISOString().slice(0, 7);
          const matched = result.data.find((r) => r.Month === currentMonth);
          console.log('Parsed Challenge:', matched);
          setChallenge(matched);
        },
        error: (error) => console.error('CSV Parsing Error:', error),
      }
    );
  }, []);

  return (
    <div className="challenge-container">
      <div className="challenge-bg" />
      <div className="challenge-content">
        <h1>Monthly Challenge</h1>
        {challenge ? (
          <>
            <h2>{challenge.Title}</h2>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 className="challenge-h1" {...props} />,
                h2: ({ node, ...props }) => <h2 className="challenge-h2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="challenge-h3" {...props} />,
                p: ({ node, ...props }) => <p className="challenge-description" {...props} />,
                a: ({ node, ...props }) => <a className="challenge-link" {...props} />,
                ul: ({ node, ...props }) => <ul className="challenge-list" {...props} />,
                ol: ({ node, ...props }) => <ol className="challenge-list" {...props} />,
                li: ({ node, ...props }) => <li className="challenge-list-item" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="challenge-quote" {...props} />,
                hr: () => <hr className="challenge-divider" />,
                code({ node, inline, className, children, ...props }) {
                  return !inline ? (
                    <SyntaxHighlighter style={vscDarkPlus} language="javascript" PreTag="div" {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="challenge-inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {challenge.Description}
            </ReactMarkdown>
            <a href={challenge.Link} target="_blank" rel="noreferrer">
              Submit Your Solution
            </a>
          </>
        ) : (
          <p>Loading or no challenge available...</p>
        )}
      </div>
    </div>
  );
};

export default Challenge;
