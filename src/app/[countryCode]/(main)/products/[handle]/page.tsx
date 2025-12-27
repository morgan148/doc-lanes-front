export const dynamic = 'force-dynamic'
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

// Helper to filter images based on variant
function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  // 1. Safety check for product images
  if (!product.images || product.images.length === 0) return []

  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  
  // 2. Medusa variants don't always have images by default. 
  // We check if it exists and has length before mapping.
  if (!variant || !("images" in variant) || !Array.isArray(variant.images) || !variant.images.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i: any) => [i.id, true]))
  return product.images.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const region = await getRegion(countryCode)

  if (!region) notFound()

  const product = await listProducts({
    countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) notFound()

  return {
    title: `${product.title} | Medusa Store`,
    description: product.description ?? `${product.title}`,
    openGraph: {
      title: `${product.title} | Medusa Store`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const { countryCode, handle } = await props.params
  const { v_id: selectedVariantId } = await props.searchParams
  
  const region = await getRegion(countryCode)
  if (!region) notFound()

  const pricedProduct = await listProducts({
    countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  // FIX: Check if product exists BEFORE passing it to helper functions
  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={countryCode}
      images={images}
    />
  )
}