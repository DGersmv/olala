"use client"

import { useState } from "react"
import { X, Check } from "lucide-react"
import { BUDGET_OPTIONS, type BudgetId } from "@/lib/olala-constants"

interface CatalogModalProps {
  onClose: () => void
  onSelect: (budget: BudgetId, photoUrl: string) => void
  currentBudget?: BudgetId
  currentPhoto?: string
}

export function CatalogModal({ onClose, onSelect, currentBudget, currentPhoto }: CatalogModalProps) {
  const [activeBudget, setActiveBudget] = useState<BudgetId>(currentBudget ?? "medium")
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhoto ?? "")

  const activeOption = BUDGET_OPTIONS.find((b) => b.id === activeBudget)!

  const handleConfirm = () => {
    if (!selectedPhoto) return
    onSelect(activeBudget, selectedPhoto)
    onClose()
  }

  return (
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
              Выберите категорию и понравившийся букет
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
            {activeOption.photos.map((src, i) => {
              const isSelected = selectedPhoto === src
              return (
                <button
                  key={i}
                  onClick={() => setSelectedPhoto(isSelected ? "" : src)}
                  className="group relative aspect-square cursor-pointer overflow-hidden border-2 transition-all"
                  style={{
                    borderColor: isSelected ? activeOption.color : "transparent",
                    boxShadow: isSelected ? `0 0 0 2px ${activeOption.color}44` : "none",
                  }}
                >
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
                        className="flex size-10 items-center justify-center rounded-full"
                        style={{ background: activeOption.color }}
                      >
                        <Check className="size-5 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {selectedPhoto && (
            <p className="mt-3 text-[11px] opacity-40">
              Выбран стиль-референс для флориста. Окончательный букет будет создан с учётом сезонности и наличия цветов.
            </p>
          )}
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
  )
}
