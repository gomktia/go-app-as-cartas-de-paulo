import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const Section: React.FC<SectionProps> = ({ title, subtitle, children, actionButton }) => {
  return (
    <section className="py-8 md:py-12 border-b border-zinc-900 last:border-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-zinc-500 mt-1 uppercase text-sm font-medium tracking-widest">{subtitle}</p>
          )}
        </div>
        
        {actionButton && (
          <button 
            onClick={actionButton.onClick}
            className="group px-4 py-2 bg-transparent border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white rounded transition-all duration-300 flex items-center gap-2 text-sm font-bold uppercase tracking-wide w-fit animate-pulse hover:animate-none"
          >
            {actionButton.label}
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  );
};

export default Section;