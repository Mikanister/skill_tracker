export type Task = {
  id: string;
  text: string;
  done: boolean;
  description?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
};

export type Level = {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  tasks: Task[];
};

export type Skill = {
  id: string;
  name: string;
  description?: string;
  levels: Level[];
  tags?: string[];
  isArchived?: boolean;
  updatedAt?: number;
};

export type Category = {
  id: string;
  name: string;
  skills: Skill[];
};

export type SkillTree = {
  categories: Category[];
  version: number;
};

export type Mode = 'view' | 'edit';

export const STORAGE_KEY = 'skillrpg_ua_v2';

// New entities for fighters and user-level tasks with XP
export type Fighter = {
  id: string;
  name: string; // legacy display name
  fullName?: string;
  callsign?: string;
  rank?: string;
  unit?: string;
  notes?: string;
};

export type SkillKey = {
  categoryId: string;
  skillId: string;
};

// Legacy: 'draft'|'submitted'|'approved' kept for backward compatibility
export type UserTaskStatus = 'todo' | 'in_progress' | 'validation' | 'done' | 'draft' | 'submitted' | 'approved';

export type UserTask = {
  id: string;
  title: string;
  description?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  relatedSkills: SkillKey[];
  suggestedXp: Record<string, number>; // key: skillId, value: XP
  assignedTo: string; // fighterId
  status: UserTaskStatus;
  createdAt: number;
  submittedAt?: number;
  approvedAt?: number;
  approvedXp?: Record<string, number>;
};

export type FighterXpLedger = Record<string, number>; // key: skillId, value: accumulated XP

export type FighterSkills = Record<string, boolean>; // key: skillId, value: assigned

export type FighterSkillLevels = Record<string, 0|1|2|3|4|5|6|7|8|9|10>; // key: skillId, value: mastery level

// V2 Tasks with multiple assignees and per-fighter per-skill XP
export type TaskV2Status = 'todo' | 'in_progress' | 'validation' | 'done' | 'archived';

export type TaskV2AssigneeSkill = {
  skillId: string;
  categoryId: string;
  xpSuggested: number;
  xpApproved?: number;
};

export type TaskV2Assignee = {
  fighterId: string;
  skills: TaskV2AssigneeSkill[];
};

export type TaskStatusHistoryEntry = {
  fromStatus: TaskV2Status | null;
  toStatus: TaskV2Status;
  changedAt: number;
};

export type TaskComment = {
  id: string;
  author: string;
  message: string;
  createdAt: number;
};

export type TaskV2 = {
  id: string;
  title: string;
  description?: string;
  difficulty: 1|2|3|4|5;
  assignees: TaskV2Assignee[];
  status: TaskV2Status;
  createdAt: number;
  submittedAt?: number;
  approvedAt?: number;
  taskNumber?: number;
  history?: TaskStatusHistoryEntry[];
  comments?: TaskComment[];
};

