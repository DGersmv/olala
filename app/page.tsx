import { OlalaApp } from "@/components/olala/olala-app"
import { getCatalogPhotos } from "@/lib/catalog-photos"

export default function Home() {
  const catalogPhotos = getCatalogPhotos()
  return <OlalaApp catalogPhotos={catalogPhotos} />
}
