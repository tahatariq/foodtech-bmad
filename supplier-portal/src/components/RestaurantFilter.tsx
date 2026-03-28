interface Restaurant {
  id: string;
  name: string;
}

interface RestaurantFilterProps {
  restaurants: Restaurant[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function RestaurantFilter({
  restaurants,
  selectedId,
  onChange,
}: RestaurantFilterProps) {
  return (
    <div data-testid="restaurant-filter" style={{ marginBottom: '12px' }}>
      <label htmlFor="restaurant-select" style={{ marginRight: '8px' }}>
        Filter by restaurant:
      </label>
      <select
        id="restaurant-select"
        value={selectedId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">All Restaurants</option>
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
