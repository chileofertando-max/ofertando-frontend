const isDevelopment = process.env.NODE_ENV === "development";

async function safeTrack(eventName: string, data?: Record<string, unknown>) {
  if (isDevelopment) {
    console.log(`[Meta Pixel] ${eventName}:`, data);
    return;
  }

  try {
    const ReactPixel = await import("react-facebook-pixel");
    const pixel = ReactPixel.default;
    if (typeof pixel !== "undefined" && pixel.track) {
      pixel.track(eventName, data);
    }
  } catch {
    // Silently fail if pixel is blocked
  }
}

export function usePixel() {
  const trackViewContent = (product: { id: string; name: string; price: number }) => {
    safeTrack("ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "CLP",
    });
  };

  const trackAddToCart = (product: { id: string; name: string; price: number }) => {
    safeTrack("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      value: product.price,
      currency: "CLP",
    });
  };

  const trackPurchase = (orderId: string, value: number) => {
    safeTrack("Purchase", {
      order_id: orderId,
      value,
      currency: "CLP",
    });
  };

  const trackInitiateCheckout = (value: number) => {
    safeTrack("InitiateCheckout", {
      value,
      currency: "CLP",
    });
  };

  const trackPageView = () => {
    safeTrack("PageView");
  };

  return {
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackInitiateCheckout,
    trackPageView,
  };
}
