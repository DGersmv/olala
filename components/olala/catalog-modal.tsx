"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Check, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { BUDGET_OPTIONS, type BudgetId } from "@/lib/olala-constants"
import type { CatalogPhotos } from "@/lib/catalog-photos"
import { getCatalogItem } from "@/lib/catalog-items"

interface CatalogModalProps {
  onClose: () => void
  onSelect: (budget: BudgetId, photoUrl: string) => void
  currentBudget?: BudgetId
  currentPhoto?: string
  catalogPhotos: CatalogPhotos
}

export function CatalogModal({ onClose, onSelect, currentBudget, currentPhoto, catalogPhotos }: CatalogModalProps) {
  const [activeBudget, setActiveBudget] = useState<BudgetId>(currentBudget ?? "medium")
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhoto ?? "")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const activeOption = BUDGET_OPTIONS.find((b) => b.id === activeBudget)!
  const photos = catalogPhotos[activeBudget] ?? []

  const openLightbox = (i: number) => setLightboxIndex(i)
  const closeLightbox = () => setLightboxIndex(null)

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }, [photos.length])

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length))
  }, [photos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "Escape") closeLightbox()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightboxIndex, prev, next])

  const handleConfirm = () => {
    if (!selectedPhoto) return
    onSelect(activeBudget, selectedPhoto)
    onClose()
  }

  const selectFromLightbox = () => {
    if (lightboxIndex === null) return
    setSelectedPhoto(photos[lightboxIndex])
    closeLightbox()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-8 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="animate-fade-up w-full max-w-[700px] border border-border bg-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-7 py-5">
            <div>
              <h3 className="font-serif text-2xl font-normal">Каталог букетов</h3>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest opacity-40">
                Нажмите на фото, чтобы рассмотреть подробнее
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex border-b border-border">
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setActiveBudget(b.id)
                  setSelectedPhoto("")
                  closeLightbox()
                }}
                className="flex-1 cursor-pointer border-none py-3.5 text-center font-sans text-[11px] uppercase tracking-widest transition-all"
                style={{
                  background: activeBudget === b.id ? b.color : "transparent",
                  color: activeBudget === b.id ? "#fff" : "inherit",
                  opacity: activeBudget === b.id ? 1 : 0.5,
                }}
              >
                <span className="block font-normal">{b.label}</span>
                <span className="block text-[10px] opacity-75">{b.price}</span>
              </button>
            ))}
          </div>

          {/* Photos grid */}
          <div className="p-6">
            <p className="mb-3 text-[11px] uppercase tracking-widest opacity-40">
              {activeOption.desc}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((src, i) => {
                const isSelected = selectedPhoto === src
                const item = getCatalogItem(src)
                return (
                  <button
                    key={i}
                    onClick={() => openLightbox(i)}
                    className="group cursor-pointer border-2 bg-secondary/30 text-left transition-all"
                    style={{
                      borderColor: isSelected ? activeOption.color : "transparent",
                      boxShadow: isSelected ? `0 0 0 2px ${activeOption.color}44` : "none",
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={src}
                        alt={`Букет ${activeOption.label} ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `${activeOption.color}33` }}
                        >
                          <div
                            className="flex size-8 items-center justify-center rounded-full"
                            style={{ background: activeOption.color }}
                          >
                            <Check className="size-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-2">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-serif text-[13px] font-normal leading-tight">
                          {item?.title ?? `Букет ${i + 1}`}
                        </span>
                        <span
                          className="flex-shrink-0 font-sans text-[11px] font-normal"
                          style={{ color: activeOption.color }}
                        >
                          {item?.price ?? "—"}
                        </span>
                      </div>
                      {item?.description && (
                        <p className="mt-0.5 font-sans text-[10px] leading-relaxed opacity-40">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-4 flex items-start gap-2 border border-border bg-secondary/40 px-4 py-3">
              <Info className="mt-0.5 size-3.5 flex-shrink-0 opacity-40" />
              <p className="text-[11px] leading-relaxed opacity-50">
                Фото — референс стиля и настроения букета. Флорист подберёт актуальные сезонные цветы и при необходимости может заменить отдельные позиции на равноценные, сохраняя общую композицию.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-7 py-5">
            <button
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent font-sans text-sm uppercase tracking-widest opacity-40 transition-opacity hover:opacity-70"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedPhoto}
              className="cursor-pointer px-8 py-3 font-sans text-sm uppercase tracking-widest text-white transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: selectedPhoto ? activeOption.color : "#ccc" }}
            >
              Выбрать этот стиль
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-screen w-full max-w-3xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 cursor-pointer border-none bg-black/40 p-2 text-white/70 transition-colors hover:text-white"
            >
              <X className="size-5" />
            </button>

            {/* Image */}
            <div className="relative flex items-center justify-center px-14">
              <button
                onClick={prev}
                className="absolute left-2 cursor-pointer border-none bg-black/40 p-3 text-white/70 transition-colors hover:text-white"
              >
                <ChevronLeft className="size-6" />
              </button>

              <img
                key={lightboxIndex}
                src={photos[lightboxIndex]}
                alt={`Букет ${activeOption.label} ${lightboxIndex + 1}`}
                className="max-h-[70vh] w-full object-contain"
              />

              <button
                onClick={next}
                className="absolute right-2 cursor-pointer border-none bg-black/40 p-3 text-white/70 transition-colors hover:text-white"
              >
                <ChevronRight className="size-6" />
              </button>
            </div>

            {/* Bottom panel */}
            <div className="mt-4 px-4">
              {/* Title + price */}
              {(() => {
                const item = getCatalogItem(photos[lightboxIndex])
                return item ? (
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-lg font-normal text-white">{item.title}</p>
                      <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-white/50">
                        {item.description}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 font-sans text-base font-normal"
                      style={{ color: activeOption.color }}
                    >
                      {item.price}
                    </span>
                  </div>
                ) : null
              })()}

              <div className="flex items-center justify-between">
                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="cursor-pointer border-none p-0 transition-all"
                      style={{
                        width: i === lightboxIndex ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === lightboxIndex ? activeOption.color : "rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>

                {/* Counter + select */}
                <div className="flex items-center gap-4">
                  <span className="font-sans text-[11px] text-white/40">
                    {lightboxIndex + 1} / {photos.length}
                  </span>
                  <button
                    onClick={selectFromLightbox}
                    className="cursor-pointer px-6 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white transition-opacity hover:opacity-80"
                    style={{ background: activeOption.color }}
                  >
                    {selectedPhoto === photos[lightboxIndex] ? "✓ Выбрано" : "Выбрать этот букет"}
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-3 px-4 pb-4 text-center text-[10px] leading-relaxed text-white/30">
              Флорист может заменить отдельные цветы на равноценные с сохранением стиля композиции
            </p>
          </div>
        </div>
      )}
    </>
  )
}
