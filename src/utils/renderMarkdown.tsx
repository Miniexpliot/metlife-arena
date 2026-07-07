import React from 'react';

/**
 * Converts a subset of markdown into React elements.
 *
 * Supported syntax:
 *  - **bold** → <strong>
 *  - Lines starting with "- " or "* " → <li>
 *  - Lines matching "N. " → <li>
 *  - Empty lines → spacer <div>
 *  - All other lines → <p>
 *
 * Kept as a pure utility (no component state dependency) so it can be
 * memoized or tested independently of App render cycles.
 */
export function renderMarkdown(text: string): React.ReactNode[] {
  // Safety guard: prevent crash if text is undefined/null (blank screen bug)
  if (!text || typeof text !== 'string') {
    return [<p key="fallback" className="text-slate-400 text-sm italic">No content available.</p>];
  }
  return text.split('\n').map((line, idx) => {
    let isBullet = false;
    let content = line;

    if (line.startsWith('- ') || line.startsWith('* ')) {
      isBullet = true;
      content = line.substring(2);
    } else if (line.match(/^\d+\.\s/)) {
      isBullet = true;
      content = line.replace(/^\d+\.\s/, '');
    }

    // Split on **bold** markers and render each part accordingly
    const parts = content.split(/(\*\*.*?\*\*)/);
    const parsedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={pIdx}
            className="font-semibold text-slate-900 bg-indigo-50 px-1 rounded border border-indigo-100"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={idx} className="ml-5 list-disc pl-1 mb-1.5 text-slate-700 text-sm leading-relaxed">
          {parsedLine}
        </li>
      );
    }

    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }

    return (
      <p key={idx} className="text-slate-700 text-sm leading-relaxed mb-2">
        {parsedLine}
      </p>
    );
  });
}
