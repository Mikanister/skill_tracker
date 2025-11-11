import React from 'react';
import { SectionCard } from '@/components/SectionCard/SectionCard';

type ExportImportSectionProps = {
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
};

export const ExportImportSection: React.FC<ExportImportSectionProps> = ({
  onExportJson,
  onExportCsv,
  onImportChange,
  fileInputRef
}) => (
  <SectionCard title="Експорт/Імпорт" description="Збережіть резервну копію або імпортуйте поточні дані.">
    <div className="action-grid">
      <div className="button-group">
        <button onClick={onExportJson} className="btn-primary">
          📥 Експорт JSON
        </button>
        <button onClick={onExportCsv} className="btn-secondary">
          📊 Експорт CSV (бійці)
        </button>
      </div>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onImportChange}
          style={{ display: 'none' }}
          id="import-file"
        />
        <label htmlFor="import-file" className="file-trigger">
          <button onClick={() => fileInputRef.current?.click()} className="btn-success-soft">
            📤 Імпорт JSON
          </button>
        </label>
      </div>
    </div>
  </SectionCard>
);
