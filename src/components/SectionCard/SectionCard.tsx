import React from 'react';

type SectionCardProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
  children: React.ReactNode;
};

const renderTitle = (title: React.ReactNode) => {
  if (typeof title === 'string') {
    return <h3 className="text-md text-strong">{title}</h3>;
  }
  return title;
};

const renderDescription = (description: React.ReactNode) => {
  if (typeof description === 'string') {
    return <p className="text-sm text-muted">{description}</p>;
  }
  return description;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  variant = 'default',
  className,
  children
}) => {
  const classes = ['section-card'];
  if (variant === 'danger') classes.push('section-card--danger');
  if (className) classes.push(className);

  return (
    <section className={classes.join(' ')}>
      <div className="section-heading">
        {renderTitle(title)}
        {description && renderDescription(description)}
      </div>
      {children}
    </section>
  );
};
