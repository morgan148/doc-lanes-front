import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"

import { HttpTypes } from "@medusajs/types"

// Force dynamic rendering (no build-time API calls)
export const dynamic = "force-dynamic"

type Props = {
  params: {
    countryCode: string
    handle: string
  }
  searchParams: {
    v_id?: string
  }
}

/**
 * Resolve images for selected variant (Storefront v2 compatible)
 */
function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  if (!product?.images?.length) return []

  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants.find(
    (v) => v.id === selectedVariantId
  )

  if (
    !variant ||
    !("images" in variant) ||
    !Array.isArray((variant as any).images) ||
    !(variant as any).images.length
  ) {
    return product.images
  }

  const imageIds = new Set(
    (variant as any).images.map((i: any) => i.id)
  )

  return product.images.filter((img) => imageIds.has(img.id))
}

/**
 * Metadata (runs dynamically)
 */
export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { countryCode, handle } = params

  const product = await listProducts({
    countryCode,
    queryParams: { handle },
  }).then(
    (res: any) =>
      res?.response?.products?.[0] ??
      res?.products?.[0]
  )

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.title} | Store`,
    openGraph: {
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

/**
 * Product page
 */
export default async function ProductPage({
  params,
  searchParams,
}: Props) {
  const { countryCode, handle } = params
  const { v_id } = searchParams

  const [region, product] = await Promise.all([
    getRegion(countryCode),
    listProducts({
      countryCode,
      queryParams: { handle },
    }).then(
      (res: any) =>
        res?.response?.products?.[0] ??
        res?.products?.[0]
    ),
  ])

  if (!region || !product) {
    notFound()
  }

  const images = getImagesForVariant(product, v_id)

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={countryCode}
      images={images}
    />
  )
}