import React from 'react';
import clsx from 'clsx';
import { Category } from '@/types';

type CategorySidebarProps = {
  categories: Category[];
  selectedCategoryId: string | null;
  dropTargetCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onStartEditCategory: (category: Category) => void;
  onRequestCreateCategory: () => void;
  onDragOverCategory: (categoryId: string) => void;
  onDragLeaveCategory: () => void;
  onDropOnCategory: (categoryId: string) => void;
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  dropTargetCategoryId,
  onSelectCategory,
  onStartEditCategory,
  onRequestCreateCategory,
  onDragOverCategory,
  onDragLeaveCategory,
  onDropOnCategory
}) => (
  <aside className="skills-sidebar">
    <div className="skills-sidebar-header">
      <div className="text-xs text-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Категорії
      </div>
      <strong className="text-md text-strong">Каталог</strong>
    </div>
    <div className="skills-category-list">
      {categories.map(category => (
        <div key={category.id} className="skills-category-item">
          <button
            onClick={() => onSelectCategory(category.id)}
            onDragOver={event => {
              event.preventDefault();
              onDragOverCategory(category.id);
            }}
            onDragLeave={onDragLeaveCategory}
            onDrop={event => {
              event.preventDefault();
              onDropOnCategory(category.id);
            }}
            className={clsx('skills-category-btn', {
              'is-selected': category.id === selectedCategoryId,
              'is-drop-target': dropTargetCategoryId === category.id
            })}
          >
            <span className="skills-category-count">{category.skills?.length ?? 0}</span>
            <span style={{ flex: 1 }}>{category.name}</span>
          </button>
          <button
            onClick={() => onStartEditCategory(category)}
            className="icon-button"
            aria-label={`Редагувати категорію «${category.name}»`}
          >
            ✎
          </button>
        </div>
      ))}
    </div>
    <button onClick={onRequestCreateCategory} className="btn-accent-pill">
      + Нова категорія
    </button>
  </aside>
);
