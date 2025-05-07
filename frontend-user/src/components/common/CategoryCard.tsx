import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  link: string;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  icon, 
  title, 
  link, 
  className 
}) => {
  return (
    <Link
      to={link}
      className={cn(
        "flex flex-col items-center justify-center p-4 text-center rounded-lg border border-border",
        "bg-card text-card-foreground hover:border-primary",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <div className="mb-3">
        {icon}
      </div>
      <h3 className="text-base font-medium">{title}</h3>
    </Link>
  );
};

export default CategoryCard;