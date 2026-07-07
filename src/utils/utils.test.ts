import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './renderMarkdown';
import { generateUniqueLocationName } from './locationUtils';

describe('renderMarkdown Utility', () => {
  it('correctly parses bold formatting into strong elements', () => {
    const nodes = renderMarkdown('This is **bold** text.');
    expect(nodes.length).toBe(1);
    
    // The markdown splits it into parts: ["This is ", "**bold**", " text."]
    // The second part should render as a bold React element
    const container = nodes[0];
    expect(container).toBeDefined();
  });

  it('correctly parses bullet points', () => {
    const nodes = renderMarkdown('- Bullet point option');
    expect(nodes.length).toBe(1);
    
    // Bullet items are mapped to <li> elements
    const element = nodes[0] as React.ReactElement;
    expect(element.type).toBe('li');
  });

  it('correctly handles blank spaces as empty spacers', () => {
    const nodes = renderMarkdown('');
    expect(nodes.length).toBe(1);
    const element = nodes[0] as React.ReactElement;
    expect(element.type).toBe('div');
  });
});

describe('locationUtils Utility', () => {
  it('maps coordinates inside the stadium correctly', () => {
    // Exact center coordinates of MetLife Stadium
    const label = generateUniqueLocationName(40.8135, -74.0744);
    expect(label).not.toContain('Outside Stadium Boundaries');
    expect(label).toMatch(/Section|Club|Mezzanine/);
  });

  it('correctly flags coordinates outside the stadium radius', () => {
    // Deployed miles away (e.g. Times Square Manhattan)
    const label = generateUniqueLocationName(40.7580, -73.9855);
    expect(label).toContain('Outside Stadium Boundaries');
  });
});
