import type { ChangeEvent } from "react";
import type { MeetingQuery } from "../lib/meetings";
import styles from "./MeetingFilters.module.css";

type MeetingFiltersProps = {
  query: MeetingQuery;
  onQueryChange: (updates: Partial<MeetingQuery>) => void;
  onClear: () => void;
};

export function MeetingFilters({ query, onQueryChange, onClear }: MeetingFiltersProps) {
  const hasActiveFilters = Boolean(query.search || query.participant || query.dateFrom || query.dateTo || query.sortOrder === "oldest");
  const updateText = (field: "search" | "participant") => (event: ChangeEvent<HTMLInputElement>) => onQueryChange({ [field]: event.target.value });

  return (
    <div className={styles.filters}>
      <label className={`${styles.field} ${styles.searchField}`}>
        <span>Search meetings</span>
        <input type="search" value={query.search} onChange={updateText("search")} placeholder="Search by title" />
      </label>
      <label className={styles.field}>
        <span>Participant</span>
        <input type="search" value={query.participant} onChange={updateText("participant")} placeholder="Filter by name" />
      </label>
      <label className={styles.field}>
        <span>From</span>
        <input type="date" value={query.dateFrom} max={query.dateTo || undefined} onChange={(event) => onQueryChange({ dateFrom: event.target.value })} />
      </label>
      <label className={styles.field}>
        <span>To</span>
        <input type="date" value={query.dateTo} min={query.dateFrom || undefined} onChange={(event) => onQueryChange({ dateTo: event.target.value })} />
      </label>
      <label className={styles.field}>
        <span>Sort</span>
        <select value={query.sortOrder} onChange={(event) => onQueryChange({ sortOrder: event.target.value as MeetingQuery["sortOrder"] })}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
      {hasActiveFilters && <button className={styles.clearButton} type="button" onClick={onClear}>Clear filters</button>}
    </div>
  );
}
