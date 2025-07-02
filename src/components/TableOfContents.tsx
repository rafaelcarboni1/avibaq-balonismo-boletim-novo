import { useEffect, useState } from "react";

export default function TableOfContents({ className = "", minHeadingLevel = 2, maxHeadingLevel = 3 }) {
  const [headings, setHeadings] = useState<any[]>([]);
  useEffect(() => {
    const selector = Array.from({ length: maxHeadingLevel - minHeadingLevel + 1 })
      .map((_, i) => `#policy-body h${i + minHeadingLevel}`)
      .join(",");
    setHeadings([...document.querySelectorAll(selector)]);
  }, []);
  return (
    <nav className={className}>
      <h3 className="font-semibold mb-2">Índice</h3>
      <ul className="space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="hover:text-primary">
              {h.textContent}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
} 