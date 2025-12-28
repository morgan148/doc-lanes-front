import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

// 👇 Your tokenizer component (based on where you said you created it)
import FluidPayTokenizer from "@modules/checkout/components/fluidpay-tokenizer/fluidpay-tokenizer"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode

  /**
   * OPTIONAL: If provided, PaymentContainer can render the FluidPay tokenizer UI
   * directly when paymentProviderId === "fluidpay".
   *
   * If you don’t pass these props, nothing breaks.
   */
  onFluidPayToken?: (token: string) => void
  fluidPayReady?: boolean
  fluidPayError?: string | null
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
  onFluidPayToken,
  fluidPayReady,
  fluidPayError,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const isSelected = selectedPaymentOptionId === paymentProviderId
  const isFluidPay = paymentProviderId === "fluidpay"

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
        {
          "border-ui-border-interactive": isSelected,
        }
      )}
    >
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-x-4">
          <Radio checked={isSelected} />
          <Text className="text-base-regular">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="justify-self-end text-ui-fg-base">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>

      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}

      {/* Existing children render (Stripe uses this pattern) */}
      {children}

      {/* OPTIONAL inline FluidPay UI (safe + does nothing unless you pass handler) */}
      {isFluidPay && isSelected && onFluidPayToken && (
        <div className="my-4 transition-all duration-150 ease-in-out">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">
            Enter your card details:
          </Text>

          <FluidPayTokenizer
            onToken={(token) => onFluidPayToken(token)}
          />

          {fluidPayReady === false && (
            <Text className="text-ui-fg-subtle mt-2">
              Loading payment form...
            </Text>
          )}

          {fluidPayError && (
            <Text className="text-ui-fg-error mt-2">
              {fluidPayError}
            </Text>
          )}
        </div>
      )}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Enter your card details:
            </Text>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}

/**
 * FluidPay version of StripeCardContainer.
 * Use this the same way StripeCardContainer is used, but for providerId === "fluidpay".
 */
export const FluidPayTokenizerContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  onToken,
  ready = true,
  error = null,
}: Omit<PaymentContainerProps, "children"> & {
  onToken: (token: string) => void
  ready?: boolean
  error?: string | null
}) => {
  const isSelected = selectedPaymentOptionId === paymentProviderId

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {isSelected && (
        <div className="my-4 transition-all duration-150 ease-in-out">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">
            Enter your card details:
          </Text>

          <FluidPayTokenizer onToken={onToken} />

          {!ready && (
            <Text className="text-ui-fg-subtle mt-2">
              Loading payment form...
            </Text>
          )}

          {error && (
            <Text className="text-ui-fg-error mt-2">
              {error}
            </Text>
          )}
        </div>
      )}
    </PaymentContainer>
  )
}