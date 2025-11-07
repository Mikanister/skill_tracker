import { Category } from '@/types';

type Props = {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
};

export function CategoryList({ categories, selectedCategoryId, onSelect }: Props) {
  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Сфери</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map(c => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                marginBottom: 6,
                background: c.id === selectedCategoryId ? '#e6f0ff' : '#f7f7f7',
                border: '1px solid #dcdcdc',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

