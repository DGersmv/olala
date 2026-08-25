import { UnderConstructionScreen } from "@/components/olala/under-construction-screen"
import { getCatalogPhotos } from "@/lib/catalog-photos"

export default function Home() {
  const catalogPhotos = getCatalogPhotos()
  return <UnderConstructionScreen catalogPhotos={catalogPhotos} />
}
