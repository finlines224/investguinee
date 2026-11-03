"use client";

import Image from "next/image";
import { useState } from "react";
import { type ProjectDetail } from "../data";

type Props = { project: ProjectDetail };

export default function ProjectGallery({ project }: Props) {
  const allImages = [project.heroImage, ...project.gallery];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = () => setActive((a) => (a - 1 + allImages.length) % allImages.length);
  const next = () => setActive((a) => (a + 1) % allImages.length);

  return (
    <>
      <div className="pg-gallery">
        {/* Main image */}
        <div className="pg-gallery__main" onClick={() => setLightbox(true)}>
          <Image
            src={allImages[active]}
            alt={`Photo ${active + 1} du projet ${project.title}`}
            fill
            className="pg-gallery__main-img"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority={active === 0}
          />
          {/* Counter */}
          <div className="pg-gallery__counter" aria-label={`Image ${active + 1} sur ${allImages.length}`}>
            {active + 1} / {allImages.length}
          </div>
          {/* Nav arrows */}
          <button className="pg-gallery__arrow pg-gallery__arrow--prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Image précédente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="pg-gallery__arrow pg-gallery__arrow--next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Image suivante">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
          {/* Zoom icon */}
          <div className="pg-gallery__zoom" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="pg-gallery__thumbs" role="list" aria-label="Miniatures de la galerie">
          {allImages.map((img, i) => (
            <button
              key={i}
              role="listitem"
              className={`pg-gallery__thumb${i === active ? " pg-gallery__thumb--active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Voir photo ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
            >
              <Image src={img} alt="" fill style={{ objectFit: "cover" }} sizes="80px" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="pg-lightbox" onClick={() => setLightbox(false)} role="dialog" aria-modal="true" aria-label="Vue agrandie de l'image">
          <button className="pg-lightbox__close" onClick={() => setLightbox(false)} aria-label="Fermer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div className="pg-lightbox__img-wrap" onClick={(e) => e.stopPropagation()}>
            <Image src={allImages[active]} alt="" fill style={{ objectFit: "contain" }} sizes="100vw" />
          </div>
          <button className="pg-lightbox__nav pg-lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Image précédente">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="pg-lightbox__nav pg-lightbox__nav--next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Image suivante">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
