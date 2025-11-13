import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        'src/**/index.ts',
        'src/utils/skills.ts',
        'src/utils/tasks/index.ts',
        'src/utils.ts',
        'src/hooks/useFighterState.ts',
        'src/hooks/useTaskBoard.ts',
        'src/hooks/useTaskState.ts',
        'src/hooks/useMultiAssignForm.ts',
        'src/hooks/useSkillTreeState.ts',
        'src/pages/Fighters.tsx',
        'src/pages/Home.tsx',
        'src/pages/Settings.tsx',
        'src/pages/Skills.tsx',
        'src/components/TaskBoard/TaskViewModalSections.tsx',
        'src/components/TaskModal.tsx',
        'src/components/CreateTaskModal.tsx',
        'src/components/MultiAssignTaskModal.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
