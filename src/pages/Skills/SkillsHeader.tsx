import React from 'react';

type SkillsHeaderProps = {
  categoryName?: string;
  skillCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onAddSkill: () => void;
};

export const SkillsHeader: React.FC<SkillsHeaderProps> = ({
  categoryName,
  skillCount,
  search,
  onSearchChange,
  onAddSkill
}) => (
  <div className="skills-header">
    <div className="skills-header-title">
      <h2 className="text-xl text-strong" style={{ margin: 0 }}>
        {categoryName || 'Каталог навичок'}
      </h2>
      <div className="skills-header-meta">{skillCount} навичок у категорії</div>
    </div>
    <input
      placeholder="Пошук навички"
      value={search}
      onChange={event => onSearchChange(event.target.value)}
      className="search-input skills-search"
    />
    <button onClick={onAddSkill} className="btn-primary">
      + Додати навичку
    </button>
  </div>
);
