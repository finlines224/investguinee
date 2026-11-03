"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import FooterYear from "../FooterYear";
import {
  amountRanges,
  type CatalogProject,
} from "../../data/project-catalog";
import {
  getPublicProjects,
  type PublicProjectFacets,
  type PublicProjectPagination,
  type PublicProjectStats,
} from "../../lib/public-project-api";
import ProjectCard from "./ProjectCard";
import ProjectFilters, {
  emptyProjectFilters,
  type ProjectFilterState,
} from "./ProjectFilters";
import ProjectsHero from "./ProjectsHero";
import ProjectIcon from "./ProjectIcon";

type ProjectSort = "newest" | "oldest" | "amount-asc" | "amount-desc";

const pageSize = 3;

const sortOptions: { value: ProjectSort; label: string }[] = [
  { value: "newest", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "amount-asc", label: "Montant croissant" },
  { value: "amount-desc", label: "Montant décroissant" },
];

function getProjectSearchText(project: CatalogProject) {
  return [
    project.title,
    project.description,
    project.summary,
    project.sectors.join(" "),
    project.location,
    project.region,
    project.owner,
  ].join(" ").toLocaleLowerCase("fr");
}

function getActiveFilterCount(filters: ProjectFilterState) {
  return filters.sectors.length +
    Number(Boolean(filters.region)) +
    Number(Boolean(filters.stage)) +
    Number(Boolean(filters.amountRange));
}

export default function ProjectExplorer({
  initialQuery = "",
  projects,
  stats,
  loadError = "",
  favoriteProjectIds,
  onToggleFavorite,
  projectHrefBase = "/projets",
  showFooter = true,
  showHero = true,
  favoritesDisabled = false,
  serverCatalog = false,
  resultsEyebrow = "Projets publiés",
  resultsTitle = "Les opportunités du moment",
}: {
  initialQuery?: string;
  projects: CatalogProject[];
  stats: PublicProjectStats | null;
  loadError?: string;
  favoriteProjectIds?: number[];
  onToggleFavorite?: (project: CatalogProject) => void | boolean | Promise<void | boolean>;
  projectHrefBase?: string;
  showFooter?: boolean;
  showHero?: boolean;
  favoritesDisabled?: boolean;
  serverCatalog?: boolean;
  resultsEyebrow?: string;
  resultsTitle?: string;
}) {
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [draftFilters, setDraftFilters] = useState<ProjectFilterState>(emptyProjectFilters);
  const [filters, setFilters] = useState<ProjectFilterState>(emptyProjectFilters);
  const [sort, setSort] = useState<ProjectSort>("newest");
  const [page, setPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localFavorites, setLocalFavorites] = useState<number[]>([]);
  const [favoriteNotice, setFavoriteNotice] = useState("");
  const [remoteProjects, setRemoteProjects] = useState<CatalogProject[]>([]);
  const [remotePagination, setRemotePagination] =
    useState<PublicProjectPagination | null>(null);
  const [remoteFacets, setRemoteFacets] = useState<PublicProjectFacets | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(serverCatalog);
  const [remoteError, setRemoteError] = useState("");
  const [remoteRetryCount, setRemoteRetryCount] = useState(0);
  const favorites = favoriteProjectIds ?? localFavorites;
  const searchRef = useRef<HTMLInputElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLElement>(null);

  const availableSectors = useMemo(
    () =>
      serverCatalog && remoteFacets
        ? remoteFacets.sectors.map((facet) => facet.sector)
        : [...new Set(projects.flatMap((project) => project.sectors))].sort(),
    [projects, remoteFacets, serverCatalog],
  );
  const availableRegions = useMemo(
    () =>
      serverCatalog && remoteFacets
        ? remoteFacets.regions
        : [...new Set(projects.map((project) => project.region))].sort(),
    [projects, remoteFacets, serverCatalog],
  );
  const availableStages = useMemo(
    () =>
      serverCatalog && remoteFacets
        ? remoteFacets.stages
        : [...new Set(projects.map((project) => project.developmentStage))].sort(),
    [projects, remoteFacets, serverCatalog],
  );

  const sectorCounts = useMemo(() => {
    if (serverCatalog && remoteFacets) {
      return Object.fromEntries(
        remoteFacets.sectors.map((facet) => [facet.sector, facet.projectCount]),
      );
    }
    const counts: Record<string, number> = {};
    projects.forEach((project) => {
      project.sectors.forEach((sector) => {
        counts[sector] = (counts[sector] ?? 0) + 1;
      });
    });
    return counts;
  }, [projects, remoteFacets, serverCatalog]);

  useEffect(() => {
    if (!serverCatalog) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const selectedAmount = amountRanges.find(
        (range) => range.id === filters.amountRange,
      );
      setRemoteLoading(true);
      setRemoteError("");
      setRemoteProjects([]);
      setRemotePagination(null);
      void getPublicProjects({
        query,
        sectors: filters.sectors,
        region: filters.region,
        stage: filters.stage,
        minAmount: selectedAmount?.min,
        maxAmount:
          selectedAmount && Number.isFinite(selectedAmount.max)
            ? selectedAmount.max
            : undefined,
        sort,
        page,
        pageSize,
      })
        .then((catalog) => {
          if (cancelled) return;
          if (!catalog.pagination || !catalog.facets) {
            throw new Error("Le service n’a pas fourni les résultats paginés du catalogue.");
          }
          setRemoteProjects(catalog.projects);
          setRemotePagination(catalog.pagination);
          setRemoteFacets(catalog.facets);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setRemoteError(
            error instanceof Error
              ? error.message
              : "Le catalogue est momentanément indisponible.",
          );
        })
        .finally(() => {
          if (!cancelled) setRemoteLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters, page, query, remoteRetryCount, serverCatalog, sort]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const filterTrigger = filterButtonRef.current;
    const filterPanel = filterPanelRef.current;
    document.body.style.overflow = "hidden";
    filterPanel?.querySelector<HTMLButtonElement>(".project-filters__close")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
        return;
      }

      if (event.key !== "Tab" || !filterPanel) return;
      const focusable = filterPanel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      filterTrigger?.focus();
    };
  }, [mobileFiltersOpen]);

  const filteredProjects = useMemo(() => {
    if (serverCatalog) return remoteProjects;
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    const selectedAmount = amountRanges.find((range) => range.id === filters.amountRange);
    const matching = projects.filter((project) => {
      if (normalizedQuery && !getProjectSearchText(project).includes(normalizedQuery)) return false;
      if (filters.sectors.length && !filters.sectors.some((sector) => project.sectors.includes(sector))) return false;
      if (filters.region && project.region !== filters.region) return false;
      if (filters.stage && project.developmentStage !== filters.stage) return false;
      if (
        selectedAmount &&
        (project.amountRequested < selectedAmount.min ||
          project.amountRequested >= selectedAmount.max)
      ) {
        return false;
      }
      return true;
    });

    return matching.sort((first, second) => {
      switch (sort) {
        case "oldest":
          return first.publishedAt.localeCompare(second.publishedAt);
        case "amount-asc":
          return first.amountRequested - second.amountRequested;
        case "amount-desc":
          return second.amountRequested - first.amountRequested;
        case "newest":
        default:
          return second.publishedAt.localeCompare(first.publishedAt);
      }
    });
  }, [filters, projects, query, remoteProjects, serverCatalog, sort]);

  const resultCount = serverCatalog
    ? remotePagination?.totalResults ?? 0
    : filteredProjects.length;
  const pageCount = serverCatalog
    ? remotePagination?.totalPages ?? 1
    : Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const currentPage = serverCatalog
    ? remotePagination?.page ?? page
    : Math.min(page, pageCount);
  const firstVisiblePage = Math.max(
    1,
    Math.min(currentPage - 2, pageCount - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstVisiblePage + index,
  );
  const pageProjects = serverCatalog
    ? remoteProjects
    : filteredProjects.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      );
  const activeFiltersCount = getActiveFilterCount(filters);

  const applyFilters = () => {
    setFilters({ ...draftFilters, sectors: [...draftFilters.sectors] });
    setPage(1);
    setMobileFiltersOpen(false);
  };

  const resetFilters = () => {
    setQueryInput("");
    setQuery("");
    setDraftFilters(emptyProjectFilters);
    setFilters(emptyProjectFilters);
    setSort("newest");
    setPage(1);
    setMobileFiltersOpen(false);
    setFavoriteNotice("");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(queryInput.trim());
    setPage(1);
  };

  const toggleFavorite = async (project: CatalogProject) => {
    const isFavorite = favorites.includes(project.id);
    if (onToggleFavorite) {
      try {
        const saved = await onToggleFavorite(project);
        if (saved === false) return;
      } catch (error) {
        setFavoriteNotice(
          error instanceof Error
            ? error.message
            : "Impossible d’enregistrer ce favori.",
        );
        return;
      }
    } else {
      setLocalFavorites((current) =>
        isFavorite
          ? current.filter((id) => id !== project.id)
          : [...current, project.id],
      );
    }
    setFavoriteNotice(
      isFavorite
        ? `${project.title} a été retiré de vos favoris.`
        : `${project.title} a été ajouté à vos favoris.`,
    );
  };

  const focusSearch = () => {
    searchRef.current?.focus();
    document.getElementById("projects-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resultStart = resultCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(currentPage * pageSize, resultCount);
  const catalogErrorMessage = serverCatalog ? remoteError : loadError;

  return (
    <>
      <main className="projects-page">
        {showHero && <ProjectsHero stats={stats} />}

        <section className="projects-search-shell" id="projects-search" aria-label="Rechercher des projets">
          <form className="projects-search" onSubmit={submitSearch}>
            <div className="projects-search__input">
              <ProjectIcon name="search" size={21} />
              <input
                ref={searchRef}
                id="project-query"
                type="search"
                aria-label="Rechercher un projet"
                placeholder="Rechercher un projet, un secteur, une région..."
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
              />
              {queryInput && (
                <button
                  type="button"
                  className="projects-search__clear"
                  aria-label="Effacer la recherche"
                  onClick={() => {
                    setQueryInput("");
                    setQuery("");
                    setPage(1);
                  }}
                >
                  <ProjectIcon name="x" size={17} />
                </button>
              )}
            </div>
            <button className="projects-search__submit" type="submit">
              <ProjectIcon name="search" size={17} />
              Rechercher
            </button>
            <span className="projects-search__divider" aria-hidden="true" />
            <button
              ref={filterButtonRef}
              className={`projects-search__advanced${activeFiltersCount ? " projects-search__advanced--active" : ""}`}
              type="button"
              aria-expanded={mobileFiltersOpen || advancedOpen}
              onClick={() => {
                if (window.matchMedia("(max-width: 767px)").matches) {
                  setAdvancedOpen(true);
                  setMobileFiltersOpen(true);
                  return;
                }
                setAdvancedOpen((current) => !current);
              }}
            >
              <ProjectIcon name="sliders" size={18} />
              <span>Filtres avancés</span>
              {activeFiltersCount > 0 && <small>{activeFiltersCount}</small>}
              <ProjectIcon name="chevron" size={16} />
            </button>
          </form>
          <p className="projects-search__hint">Recherchez par nom, description, secteur, région ou porteur de projet.</p>
        </section>

        <div className="projects-catalog">
          <aside className="projects-sidebar">
            <div className="projects-sidebar__card">
              <ProjectFilters
                idPrefix="project-sidebar"
                value={draftFilters}
                onChange={setDraftFilters}
                onApply={applyFilters}
                onReset={resetFilters}
                sectorCounts={sectorCounts}
                availableSectors={availableSectors}
                availableRegions={availableRegions}
                availableStages={availableStages}
                showAdvanced={advancedOpen}
              />
              {!advancedOpen && (
                <button
                  className="projects-sidebar__advanced"
                  type="button"
                  onClick={() => setAdvancedOpen(true)}
                >
                  Afficher les filtres avancés <ProjectIcon name="chevron" size={15} />
                </button>
              )}
              {advancedOpen && (
                <button
                  className="projects-sidebar__collapse"
                  type="button"
                  onClick={() => setAdvancedOpen(false)}
                >
                  Masquer les filtres avancés <ProjectIcon name="chevron" size={15} />
                </button>
              )}
            </div>
          </aside>

          <section
            className="projects-results"
            aria-labelledby="project-results-heading"
            aria-busy={serverCatalog && remoteLoading}
          >
            <div className="projects-results__eyebrow">
              <span className="projects-results__live-dot" />
              {resultsEyebrow}
              <button type="button" onClick={focusSearch}>Modifier la recherche</button>
            </div>
            <div className="projects-results__toolbar">
              <div>
                <h2 id="project-results-heading">{resultsTitle}</h2>
                <p>
                  {serverCatalog && remoteLoading && resultCount === 0
                    ? "Chargement des projets…"
                    : `${resultCount} projet${resultCount > 1 ? "s" : ""} disponible${resultCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <label className="projects-sort">
                <span>Trier par</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as ProjectSort);
                    setPage(1);
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ProjectIcon name="chevron" size={15} />
              </label>
            </div>

            {favoriteNotice && (
              <p className="projects-favorite-notice" role="status">
                <ProjectIcon name="heart" size={16} filled />
                {favoriteNotice}
                {!onToggleFavorite && <Link href="/connexion">Connectez-vous pour synchroniser vos favoris.</Link>}
                <button type="button" aria-label="Masquer ce message" onClick={() => setFavoriteNotice("")}>
                  <ProjectIcon name="x" size={16} />
                </button>
              </p>
            )}

            {activeFiltersCount > 0 && (
              <div className="projects-active-filters" aria-label="Filtres appliqués">
                <span>{activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""} appliqué{activeFiltersCount > 1 ? "s" : ""}</span>
                <button type="button" onClick={resetFilters}>Tout effacer</button>
              </div>
            )}

            {catalogErrorMessage ? (
              <div className="projects-empty" role="alert">
                <h3>Le catalogue est indisponible</h3>
                <p>{catalogErrorMessage}</p>
                {serverCatalog && (
                  <button type="button" onClick={() => setRemoteRetryCount((count) => count + 1)}>
                    <ProjectIcon name="refresh" size={16} /> Réessayer
                  </button>
                )}
              </div>
            ) : serverCatalog && remoteLoading && pageProjects.length === 0 ? (
              <p className="projects-empty" role="status">Chargement des projets…</p>
            ) : pageProjects.length > 0 ? (
              <div className="projects-grid">
                {pageProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isFavorite={favorites.includes(project.id)}
                    onToggleFavorite={(project) => {
                      void toggleFavorite(project);
                    }}
                    projectHrefBase={projectHrefBase}
                    favoriteDisabled={favoritesDisabled}
                  />
                ))}
              </div>
            ) : (
              <div className="projects-empty" role="status">
                <span className="projects-empty__icon"><ProjectIcon name="search" size={24} /></span>
                <h3>Aucun projet ne correspond à votre recherche</h3>
                <p>Essayez d’autres termes ou réinitialisez les filtres pour parcourir le catalogue.</p>
                <button type="button" onClick={resetFilters}>
                  <ProjectIcon name="refresh" size={16} /> Réinitialiser la recherche
                </button>
              </div>
            )}

            {resultCount > 0 && !remoteLoading && (
              <nav className="projects-pagination" aria-label="Pagination des projets">
                <p>
                  Affichage de <strong>{resultStart}–{resultEnd}</strong> sur{" "}
                  <strong>{resultCount}</strong> projet{resultCount > 1 ? "s" : ""}
                </p>
                <div className="projects-pagination__controls">
                  <button
                    type="button"
                    aria-label="Page précédente"
                    disabled={currentPage === 1}
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                  >
                    <ProjectIcon name="arrow" size={16} />
                  </button>
                  {visiblePages.map((pageNumber) => (
                    <button
                      className={pageNumber === currentPage ? "projects-pagination__page--active" : ""}
                      type="button"
                      aria-label={`Page ${pageNumber}`}
                      aria-current={pageNumber === currentPage ? "page" : undefined}
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Page suivante"
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                  >
                    <ProjectIcon name="arrow" size={16} />
                  </button>
                </div>
              </nav>
            )}
          </section>
        </div>
      </main>

      {showFooter && (
        <footer className="projects-footer">
          <div className="projects-footer__inner">
            <p>© <FooterYear /> InvestGuinée — Projets publiés</p>
            <nav aria-label="Liens utiles">
              <Link href="/#confidentialite">Confidentialité</Link>
              <Link href="/#conditions">Conditions d’utilisation</Link>
              <Link href="/#contact">Contact</Link>
            </nav>
          </div>
        </footer>
      )}

      {mobileFiltersOpen && (
        <div className="project-filter-drawer">
          <button
            className="project-filter-drawer__backdrop"
            type="button"
            aria-label="Fermer les filtres"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <section
            className="project-filter-drawer__panel"
            id="project-filters"
            ref={filterPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filtres avancés"
          >
            <ProjectFilters
              idPrefix="project-mobile"
              value={draftFilters}
              onChange={setDraftFilters}
              onApply={applyFilters}
              onReset={resetFilters}
              sectorCounts={sectorCounts}
               availableSectors={availableSectors}
               availableRegions={availableRegions}
               availableStages={availableStages}
              onClose={() => setMobileFiltersOpen(false)}
              showAdvanced
            />
          </section>
        </div>
      )}
    </>
  );
}
