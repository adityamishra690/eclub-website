import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import CircuitBG from './cyber/CircuitBG';
import RadarBG from './cyber/RadarBG';
import Reveal from './cyber/Reveal';
import Cursor from './cyber/Cursor';

import './Challenge.css';

function daysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

const Challenge = () => {
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | found | empty | error
  const daysLeft = useMemo(daysLeftInMonth, []);

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
          setChallenge(matched || null);
          setStatus(matched ? 'found' : 'empty');
        },
        error: (error) => {
          console.error('CSV Parsing Error:', error);
          setStatus('error');
        },
      }
    );
  }, []);

  return (
    <div className="cg-root">
      <Cursor />
      {/* same drifting lime/cyan node constellation used on the homepage */}
      <CircuitBG />

      <section className="cg-hero">
        <RadarBG />
        <div className="cg-grid-overlay" aria-hidden="true" />
        <div className="cg-scanlines" aria-hidden="true" />
        <div className="cg-vignette" aria-hidden="true" />

        <span className="cg-hud cg-hud-tl">SYS // TARGET_LOCK</span>
        <span className="cg-hud cg-hud-tr">
          {daysLeft} {daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT THIS MONTH
        </span>

        <div className="cg-hero-content">
          <Reveal delay={0} y={16}>
            <p className="cg-eyebrow">&gt; MISSION_BRIEFING</p>
          </Reveal>

          <Reveal delay={0.1} y={24}>
            <h1 className="cg-title" data-text="CHALLENGE">
              CHALLENGE
            </h1>
          </Reveal>

          <Reveal delay={0.25} y={16}>
            <p className="cg-tagline">
              <span>BUILD</span>
              <span className="cg-dot">·</span>
              <span>SUBMIT</span>
              <span className="cg-dot">·</span>
              <span>CLIMB THE BOARD</span>
            </p>
          </Reveal>

          <Reveal delay={0.4} y={16}>
            <p className="cg-sub">
              One challenge, dropped every month. Solve it, submit it, and see
              your name move on the{' '}
              <a href="/leaderboard" className="cg-link">
                leaderboard
              </a>
              .
            </p>
          </Reveal>
        </div>

        <div className="cg-scroll-cue" aria-hidden="true">
          <span>SCROLL</span>
          <div className="cg-scroll-track">
            <div className="cg-scroll-dot" />
          </div>
        </div>
      </section>

      <div className="cg-body">
        <div className="cg-panel-wrap">
          <Reveal y={30}>
            <div className="cg-panel">
              <span className="cg-corner cg-corner-tl" />
              <span className="cg-corner cg-corner-br" />

              {status === 'loading' && (
                <div className="cg-status">
                  <p className="cg-status-line">&gt; FETCHING_CURRENT_CHALLENGE...</p>
                  <div className="cg-status-bar">
                    <div className="cg-status-bar-fill" />
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="cg-status">
                  <p className="cg-status-line cg-status-error">
                    &gt; CONNECTION_FAILED — could not load this month's challenge.
                  </p>
                </div>
              )}

              {status === 'empty' && (
                <div className="cg-status">
                  <p className="cg-status-line">&gt; NO_CHALLENGE_FOUND_FOR_THIS_MONTH</p>
                  <span className="cg-status-hint">Check back soon — a new one drops monthly.</span>
                </div>
              )}

              {status === 'found' && challenge && (
                <>
                  <span className="cg-kicker">ACTIVE_MISSION · {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <h2 className="cg-panel-title">{challenge.Title}</h2>

                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ node, children, ...rest }) => <h1 className="challenge-h1" {...rest}>{children}</h1>,
                      h2: ({ node, children, ...rest }) => <h2 className="challenge-h2" {...rest}>{children}</h2>,
                      h3: ({ node, children, ...rest }) => <h3 className="challenge-h3" {...rest}>{children}</h3>,
                      p: ({ node, ...props }) => <p className="challenge-description" {...props} />,
                      a: ({ node, children, ...rest }) => <a className="challenge-link" {...rest}>{children}</a>,
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

                  <a href={challenge.Link} target="_blank" rel="noreferrer" className="cg-submit">
                    SUBMIT YOUR SOLUTION →
                  </a>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default Challenge;
