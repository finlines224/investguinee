"use client";

import ProjectIcon from "./ProjectIcon";
import { amountRanges } from "../../data/project-catalog";

export type ProjectFilterState = {
  sectors: string[];
  region: string;
  stage: string;
  amountRange: string;
};

export const emptyProjectFilters: ProjectFilterState = {
  sectors: [],
  region: "",
  stage: "",
  amountRange: "",
};

export default function ProjectFilters({
  idPrefix,
  value,
  onChange,
  onApply,
  onReset,
  sectorCounts,
  availableSectors,
  availableRegions,
  availableStages,
  onClose,
  showAdvanced = true,
}: {
  idPrefix: string;
  value: ProjectFilterState;
  onChange: (value: ProjectFilterState) => void;
  onApply: () => void;
  onReset: () => void;
  sectorCounts: Record<string, number>;
  availableSectors: string[];
  availableRegions: string[];
  availableStages: string[];
  onClose?: () => void;
  showAdvanced?: boolean;
}) {
  const allSelected = availableSectors.length > 0 && value.sectors.length === availableSectors.length;

  const toggleSector = (sector: string) => {
    const sectors = value.sectors.includes(sector)
      ? value.sectors.filter((item) => item !== sector)
      : [...value.sectors, sector];
    onChange({ ...value, sectors });
  };

  return (
    <div className="project-filters">
      <div className="project-filters__heading">
        <div>
          <span className="project-filters__eyebrow">Affinez votre recherche</span>
          <h2>Filtres</h2>
        </div>
        {onClose && (
          <button className="project-filters__close" type="button" onClick={onClose} aria-label="Fermer les filtres">
            <ProjectIcon name="x" size={20} />
          </button>
        )}
      </div>

      <section className="project-filter-group">
        <div className="project-filter-group__heading">
          <h3>Secteur d’activité</h3>
          <button
            type="button"
            onClick={() => onChange({
              ...value,
              sectors: allSelected ? [] : [...availableSectors],
            })}
          >
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </div>
        <div className="project-filter-options">
          {availableSectors.map((sector) => (
            <label className="project-filter-option" key={sector}>
              <input
                type="checkbox"
                checked={value.sectors.includes(sector)}
                onChange={() => toggleSector(sector)}
              />
              <span>{sector}</span>
              <small>({sectorCounts[sector] ?? 0})</small>
            </label>
          ))}
        </div>
      </section>

      {showAdvanced && (
        <section className="project-filter-group">
            <label className="project-filter-group__label" htmlFor={`${idPrefix}-region`}>Région</label>
            <select
              className="project-filter-select"
              id={`${idPrefix}-region`}
              value={value.region}
              onChange={(event) => onChange({ ...value, region: event.target.value })}
            >
              <option value="">Toutes les régions</option>
              {availableRegions.map((region) => <option key={region}>{region}</option>)}
            </select>
        </section>
      )}

      {showAdvanced && (
        <>
          <section className="project-filter-group">
            <label className="project-filter-group__label" htmlFor={`${idPrefix}-stage`}>Stade de développement</label>
            <select
              className="project-filter-select"
              id={`${idPrefix}-stage`}
              value={value.stage}
              onChange={(event) => onChange({ ...value, stage: event.target.value })}
            >
              <option value="">Tous les stades</option>
              {availableStages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </section>

          <section className="project-filter-group">
            <label className="project-filter-group__label" htmlFor={`${idPrefix}-amount`}>Montant recherché</label>
            <select
              className="project-filter-select"
              id={`${idPrefix}-amount`}
              value={value.amountRange}
              onChange={(event) => onChange({ ...value, amountRange: event.target.value })}
            >
              <option value="">Tous les montants</option>
              {amountRanges.map((range) => <option value={range.id} key={range.id}>{range.label}</option>)}
            </select>
          </section>
        </>
      )}

      <div className="project-filters__actions">
        <button className="project-filters__reset" type="button" onClick={onReset}>
          <ProjectIcon name="refresh" size={16} /> Réinitialiser
        </button>
        <button className="project-filters__apply" type="button" onClick={onApply}>
          <ProjectIcon name="filter" size={16} /> Appliquer
        </button>
      </div>
    </div>
  );
}
