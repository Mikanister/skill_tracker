import React from 'react';
import { SectionCard } from '@/components/SectionCard';

type StatsSectionProps = {
  fightersCount: number;
  categoriesCount: number;
  skillsCount: number;
  tasksCount: number;
};

type StatCardProps = {
  label: string;
  value: number;
  accent: 'teal' | 'blue' | 'violet' | 'amber';
};

const StatCard: React.FC<StatCardProps> = ({ label, value, accent }) => (
  <div className={`stat-card stat-card--${accent}`}>
    <span className="stat-card__label">{label}</span>
    <div className="stat-card__row">
      <strong className="stat-card__value">{value}</strong>
      <div className="stat-card__bar">
        <div className="stat-card__bar-fill" />
      </div>
    </div>
  </div>
);

export const StatsSection: React.FC<StatsSectionProps> = ({ fightersCount, categoriesCount, skillsCount, tasksCount }) => (
  <SectionCard title="Статистика" description="Огляд поточного стану бази навичок.">
    <div className="stat-grid">
      <StatCard label="Бійців" value={fightersCount} accent="teal" />
      <StatCard label="Категорій" value={categoriesCount} accent="blue" />
      <StatCard label="Навичок" value={skillsCount} accent="violet" />
      <StatCard label="Задач" value={tasksCount} accent="amber" />
    </div>
  </SectionCard>
);
