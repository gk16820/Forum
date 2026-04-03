import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const DOMAINS = [
  'Web/App Development',
  'AI / ML',
  'Digital Marketing',
  'Cloud Computing',
  'DevOps',
  'UI / UX Design',
  'Cybersecurity',
  'Data Science',
  'Blockchain',
  'Embedded Systems',
  'Game Development',
  'Mobile Development',
  'QA / Testing',
  'Other',
];

interface DomainSelectProps {
  value: string[];
  onChange: (val: string[]) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const DomainSelect = ({
  value = [],
  onChange,
  className = '',
  placeholder = 'Select Domain(s)',
}: DomainSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
       if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
       }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDomain = (d: string) => {
    if (value.includes(d)) {
      onChange(value.filter(v => v !== d));
    } else {
      onChange([...value, d]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:outline-none text-left flex justify-between items-center text-slate-500 font-medium bg-surface hover:border-slate-300 transition-all ${isOpen ? 'ring-2 ring-accent-500 border-accent-500 shadow-sm' : ''}`}
      >
        <span className="truncate">
          {value.length > 0 
            ? `${value.length} Domain(s) selected` 
            : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[70] overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1">
          {DOMAINS.map(d => (
            <label key={d} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 group">
              <input 
                type="checkbox" 
                checked={value.includes(d)}
                onChange={() => toggleDomain(d)}
                className="mr-3 h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500 transition-all cursor-pointer"
              />
              <span className={`text-sm font-medium ${value.includes(d) ? 'text-accent-600' : 'text-slate-600'} group-hover:text-primary transition-colors`}>
                {d}
              </span>
              {value.includes(d) && <Check className="ml-auto h-3.5 w-3.5 text-accent-600" />}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
