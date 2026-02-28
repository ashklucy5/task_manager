import type { FC } from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

const Skeleton: FC<SkeletonProps> = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full' 
}) => {
  return (
    <div 
      className={`bg-gray-200 rounded animate-pulse ${height} ${width} ${className}`}
    />
  );
};

export default Skeleton;