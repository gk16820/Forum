import { ChevronDown } from 'lucide-react';

export const DOMAINS = [
  'Software / Application Dev',
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
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const DomainSelect = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'Select your domain',
}: DomainSelectProps) => {
  const baseClass =
    'w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 bg-white appearance-none';

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`${baseClass} ${className} ${!value ? 'text-slate-400' : ''} pr-10`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {DOMAINS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
};
