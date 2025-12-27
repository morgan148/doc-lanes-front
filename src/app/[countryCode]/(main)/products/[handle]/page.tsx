import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

// 1. Force dynamic rendering (No build-time fetching)
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

function getImagesForVariant(product: HttpTypes.StoreProduct, selectedVariantId?: string) {
  if (!product?.images?.length) return []
  if (!selectedVariantId || !product.variants) return product.images

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  // Medusa 2.0 variant images check
  if (!variant || !("images" in variant) || !Array.isArray(variant.images) || !variant.images.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i: any) => [i.id, true]))
  return product.images.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const product = await listProducts({
    countryCode,
    queryParams: { handle },
  }).then((res: any) => res.response?.products?.[0] || res.products?.[0])

  if (!product) return { title: "Product Not Found" }

  return {
    title: `${product.title} | Medusa Store`,
    openGraph: { images: product.thumbnail ? [product.thumbnail] : [] },
  }
}

export default async function ProductPage(props: Props) {
  const { countryCode, handle } = await props.params
  const { v_id: selectedVariantId } = await props.searchParams
  
  const [region, pricedProduct] = await Promise.all([
    getRegion(countryCode),
    listProducts({
      countryCode,
      queryParams: { handle },
    }).then((res: any) => res.response?.products?.[0] || res.products?.[0])
  ])

  if (!region || !pricedProduct) {
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