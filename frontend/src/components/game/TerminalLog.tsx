import type { RefObject } from 'react';

interface TerminalLogProps {
  logs: string[];
  logRef: RefObject<HTMLDivElement | null>;
}

export function TerminalLog({ logs, logRef }: TerminalLogProps) {
  return (
    <div className="terminal-scroll-log" ref={logRef} style={{ overflowY: 'auto' }}>
      {logs.map((log, index) => (
        <div 
          key={`log-row-${index}`} 
          style={{ color: index === logs.length - 1 ? 'var(--accent)' : 'var(--text)' }}
          dangerouslySetInnerHTML={{ __html: log }} 
        />
      ))}
    </div>
  );
}