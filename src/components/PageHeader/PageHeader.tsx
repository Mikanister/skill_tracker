import React from 'react';

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
};

const renderTitle = (title: React.ReactNode) => {
  if (typeof title === 'string') {
    return <h2 className="page-title">{title}</h2>;
  }
  return title;
};

const renderDescription = (description: React.ReactNode) => {
  if (typeof description === 'string') {
    return <p className="page-subtitle">{description}</p>;
  }
  return description;
};

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children }) => (
  <header className="page-header">
    {renderTitle(title)}
    {description && renderDescription(description)}
    {children}
  </header>
);
