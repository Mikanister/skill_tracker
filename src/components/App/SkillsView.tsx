import React from 'react';
import { Mode, SkillTree, Category, Skill, FighterSkills, FighterSkillLevels } from '@/types';
import { getCategoryProgress } from '@/utils';
import { CategoryList } from '@/components/CategoryList';
import { SkillList } from '@/components/SkillList';
import { SkillDetail } from '@/components/SkillDetail';

type SkillsViewProps = {
  tree: SkillTree;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  selectedCategory?: Category;
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string | null) => void;
  selectedSkill?: Skill;
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onToggleArchived: (value: boolean) => void;
  onCreateSkill: (name: string) => void;
  mode: Mode;
  onUpdateSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  selectedFighterId: string | null;
  fighterSkills: Record<string, FighterSkills>;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onToggleSkillAssignment: (fighterId: string, skillId: string, assigned: boolean) => void;
};

export const SkillsView: React.FC<SkillsViewProps> = ({
  tree,
  selectedCategoryId,
  onSelectCategory,
  selectedCategory,
  selectedSkillId,
  onSelectSkill,
  selectedSkill,
  search,
  onSearchChange,
  showArchived,
  onToggleArchived,
  onCreateSkill,
  mode,
  onUpdateSkill,
  onDeleteSkill,
  selectedFighterId,
  fighterSkills,
  fighterSkillLevels,
  onToggleSkillAssignment
}) => (
  <>
    <section style={{ borderRight: '1px solid #eee', minWidth: 0 }}>
      <CategoryList
        categories={tree.categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={categoryId => onSelectCategory(categoryId)}
      />
      <div style={{ padding: 12, borderTop: '1px solid #eee' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Прогрес категорій</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
          {tree.categories.map(category => {
            const progress = getCategoryProgress(category);
            return (
              <li key={category.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{category.name}</span>
                <span>{progress.pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>

    <section style={{ borderRight: '1px solid #eee', minWidth: 0 }}>
      <div style={{ padding: 12, display: 'flex', gap: 6 }}>
        <input
          placeholder="Пошук (назва або тег)"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #dcdcdc', borderRadius: 6 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showArchived} onChange={event => onToggleArchived(event.target.checked)} />
          Архів
        </label>
      </div>
      <SkillList
        category={selectedCategory}
        selectedSkillId={selectedSkillId}
        onSelect={skillId => onSelectSkill(skillId)}
        onCreateSkill={onCreateSkill}
        showArchived={showArchived}
        search={search}
      />
    </section>

    {selectedSkill && (
      <section style={{ minWidth: 0 }}>
        <SkillDetail
          skill={selectedSkill}
          mode={mode}
          onChange={onUpdateSkill}
          onDelete={onDeleteSkill}
          selectedFighterId={selectedFighterId}
          fighterSkills={fighterSkills}
          fighterSkillLevels={fighterSkillLevels}
          onToggleSkill={onToggleSkillAssignment}
        />
      </section>
    )}
  </>
);
