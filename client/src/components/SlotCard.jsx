import { readingStatus } from '../lib/glucose.js';
import {
  IconCoffee,
  IconMoon,
  IconPlus,
  IconSun,
  IconSunrise,
} from './Icons.jsx';

const SLOT_ICONS = {
  morning: IconSunrise,
  after_breakfast: IconCoffee,
  after_lunch: IconSun,
  after_dinner: IconMoon,
};

export default function SlotCard({ slot, reading, onClick }) {
  const SlotIcon = SLOT_ICONS[slot.value];
  const status = reading ? readingStatus(reading.value) : null;

  return (
    <button
      type="button"
      className={`slot-card ${reading ? 'slot-card--filled' : 'slot-card--empty'}`}
      onClick={onClick}
    >
      {reading && <span className="sr-only">Edit reading.</span>}
      <span className="slot-card__icon">
        <SlotIcon size={20} />
      </span>

      <span className="slot-card__heading">
        <strong>{slot.label}</strong>
        <small>{slot.hint}</small>
      </span>

      {reading ? (
        <>
          <span className="slot-card__reading">
            <strong>{reading.value}</strong>
            <small>mg/dL</small>
          </span>
          <span className={`slot-card__status status--${status.key}`}>
            <i aria-hidden="true" />
            {status.label}
          </span>
        </>
      ) : (
        <>
          <span className="slot-card__reading slot-card__reading--empty">—</span>
          <span className="slot-card__add">
            <IconPlus size={15} />
            Add reading
          </span>
        </>
      )}
    </button>
  );
}
