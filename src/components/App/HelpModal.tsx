import React from 'react';
import { Modal } from '@/components/Modal';

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} title="Швидкий старт" width={720}>
    <div style={{ display: 'grid', gap: 10, lineHeight: 1.5 }}>
      <div>
        <strong>1) Вибери або створи бійця</strong>
        <div>У хедері обери «Боєць» або зайди у вкладку «Бійці» і натисни «Додати». У модалі вистав рівні 0–5. Рівень 0 = не призначено.</div>
      </div>
      <div>
        <strong>2) Налаштуй скіли бійця</strong>
        <div>У «Бійці» або у вкладці «Навички» (права панель) можна змінити рівень і призначення для вибраного бійця. Галочка синхронізована з рівнем.</div>
      </div>
      <div>
        <strong>3) Створи задачу</strong>
        <div>У вкладці «Задачі» обери бійця → «+ Створити задачу». Доступні лише призначені йому скіли. Вистав XP для кожного обраного скіла.</div>
      </div>
      <div>
        <strong>4) Процес задачі</strong>
        <div>Перенось статус: To Do → In Progress → Validation. На «Validation» натисни «Затвердити» і введи фінальні XP — вони додадуться у XP бійця.</div>
      </div>
      <div>
        <strong>Корисні дії</strong>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Імпорт/Експорт JSON — у хедері.</li>
          <li>Скинути до початкового seed — жовта кнопка в хедері.</li>
          <li>Очистити локальні дані (бійці/задачі/XP) — червона кнопка в хедері.</li>
          <li>Профілі — можна створювати і перемикати у хедері.</li>
        </ul>
      </div>
    </div>
  </Modal>
);
