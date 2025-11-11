import React, { useMemo, useState } from 'react';
import { Category, Fighter, Skill, UserTask, UserTaskStatus } from '@/types';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { TaskBoardHeader } from './Header';
import { TaskCard } from './Kanban/TaskCard';
import { STATUS_COLUMNS, normalizeStatus, NormalizedStatus } from './Kanban/types';

export type CreateTaskPayload = {
  title: string;
  description?: string;
  difficulty?: 1|2|3|4|5;
  links: { skillId: string; categoryId: string; xp: number }[];
};

export type TaskBoardProps = {
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelectFighter: (id: string | null) => void;
  categories: Category[];
  tasks: UserTask[];
  fighterSkills: Record<string, Record<string, boolean>>;
  onCreateTask: (payload: CreateTaskPayload) => void;
  onUpdateStatus: (taskId: string, status: UserTaskStatus) => void;
  onApproveTask: (taskId: string, approvedXp: Record<string, number>) => void;
};

type SkillIndexEntry = {
  skill: Skill;
  categoryId: string;
};

type SkillIndex = Map<string, SkillIndexEntry>;

type ActionFactoryArgs = {
  status: NormalizedStatus;
  task: UserTask;
  onUpdateStatus: TaskBoardProps['onUpdateStatus'];
  onApproveTask: TaskBoardProps['onApproveTask'];
  skillIndex: SkillIndex;
};

const buildSkillIndex = (categories: Category[]): SkillIndex => {
  const index = new Map<string, SkillIndexEntry>();
  categories.forEach(category => {
    category.skills.forEach(skill => {
      index.set(skill.id, { skill, categoryId: category.id });
    });
  });
  return index;
};

const toSkillChips = (task: UserTask, skillIndex: SkillIndex) =>
  task.relatedSkills.map(({ skillId }) => {
    const entry = skillIndex.get(skillId);
    const xp = task.approvedXp?.[skillId] ?? task.suggestedXp[skillId] ?? 0;
    return {
      id: skillId,
      label: entry?.skill.name ?? 'Невідома навичка',
      xp
    };
  });

const buildTaskActions = ({ status, task, onUpdateStatus, onApproveTask, skillIndex }: ActionFactoryArgs): React.ReactNode => {
  if (status === 'todo') {
    return (
      <>
        <button onClick={() => onUpdateStatus(task.id, 'in_progress')}>В роботу</button>
        <button onClick={() => onUpdateStatus(task.id, 'validation')}>На перевірку</button>
      </>
    );
  }

  if (status === 'in_progress') {
    return (
      <>
        <button onClick={() => onUpdateStatus(task.id, 'validation')}>На перевірку</button>
        <button onClick={() => onUpdateStatus(task.id, 'todo')}>Відкласти</button>
      </>
    );
  }

  if (status === 'validation') {
    return (
      <>
        <button
          onClick={() => {
            const approved: Record<string, number> = {};
            for (const { skillId } of task.relatedSkills) {
              const skillName = skillIndex.get(skillId)?.skill.name ?? 'невідома навичка';
              const suggested = task.suggestedXp[skillId] ?? 0;
              const input = prompt(`XP для ${skillName}`, String(suggested));
              if (input == null) return;
              approved[skillId] = Math.max(0, Number(input) || 0);
            }
            onApproveTask(task.id, approved);
          }}
        >
          Затвердити
        </button>
        <button onClick={() => onUpdateStatus(task.id, 'in_progress')}>Повернути</button>
      </>
    );
  }

  return null;
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  fighters,
  selectedFighterId,
  onSelectFighter,
  categories,
  tasks,
  fighterSkills,
  onCreateTask,
  onUpdateStatus,
  onApproveTask
}) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const skillIndex = useMemo(() => buildSkillIndex(categories), [categories]);

  const tasksForFighter = useMemo(
    () => tasks.filter(task => task.assignedTo === selectedFighterId),
    [tasks, selectedFighterId]
  );

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TaskBoardHeader
        fighters={fighters}
        selectedFighterId={selectedFighterId}
        onSelectFighter={onSelectFighter}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      <div>
        <h3 style={{ margin: '8px 0' }}>Задачі (Kanban)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {STATUS_COLUMNS.map(column => {
            const columnTasks = tasksForFighter.filter(task => normalizeStatus(task.status) === column.key);
            return (
              <div key={column.key} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, minHeight: 200 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{column.title}</div>
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    difficulty={task.difficulty ?? undefined}
                    description={task.description ?? undefined}
                    skillChips={toSkillChips(task, skillIndex)}
                    actions={buildTaskActions({
                      status: column.key,
                      task,
                      onUpdateStatus,
                      onApproveTask,
                      skillIndex
                    })}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <CreateTaskModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        fighter={fighters.find(fighter => fighter.id === selectedFighterId)}
        categories={categories}
        fighterSkills={fighterSkills}
        onCreate={({ title, description, difficulty, links }) => {
          onCreateTask({ title, description, difficulty, links });
        }}
      />
    </div>
  );
};
