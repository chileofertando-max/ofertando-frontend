"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { usePixel } from "@/hooks/usePixel";
import { Button } from "@/components/ui/Button";
import PagoTransferencia from "./PagoTransferencia";
import {
  COMUNAS_CHILE,
  getRegionByComuna,
  isRegionMetropolitana,
} from "@/data/chile-regiones-comunas";

interface CheckoutFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rut: string;
  direccion: string;
  ciudad: string;
  region: string;
}

type PaymentMethod = "webpay" | "transferencia";
type DeliveryMethod = "despacho" | "retiro";

type CouponDiscountType = "porcentaje" | "monto";

interface AppliedCoupon {
  code: string;
  type: CouponDiscountType;
  value: number;
  description?: string;
}

interface CouponValidationResponse {
  valid: boolean;
  message?: string;
  codigo?: string;
  tipo?: CouponDiscountType;
  valor?: number;
  subtotal?: number;
  descuento?: number;
  total?: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
}

const SHIPPING_RM_PER_ITEM = 3750;
const SHIPPING_OTHER_REGIONS_PER_ITEM = 5000;
const SHIPPING_RM_MAX_PER_ORDER = 21000;

function calculateTotalItemsQuantity(
  items: Array<{ quantity?: number | string }>
) {
  return items.reduce((total, item) => {
    return total + Math.max(1, Number(item.quantity || 1));
  }, 0);
}

function calculateShippingCost(
  region: string,
  totalItemsQuantity: number,
  deliveryMethod: DeliveryMethod
) {
  if (deliveryMethod === "retiro") {
    return 0;
  }

  if (!region) return null;

  const quantity = Math.max(1, totalItemsQuantity);

  if (isRegionMetropolitana(region)) {
    const calculatedShipping = SHIPPING_RM_PER_ITEM * quantity;
    return Math.min(calculatedShipping, SHIPPING_RM_MAX_PER_ORDER);
  }

  return SHIPPING_OTHER_REGIONS_PER_ITEM * quantity;
}

function calculateDiscountAmount(
  coupon: AppliedCoupon | null,
  subtotal: number
) {
  if (!coupon) return 0;

  let discount = 0;

  if (coupon.type === "porcentaje") {
    const percentage = Math.max(0, Math.min(coupon.value, 100));
    discount = Math.round(subtotal * (percentage / 100));
  }

  if (coupon.type === "monto") {
    discount = Math.round(coupon.value);
  }

  return Math.max(0, Math.min(discount, subtotal));
}

export function CheckoutForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("webpay");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("despacho");

  const [wantsPassword, setWantsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null
  );
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [formData, setFormData] = useState<CheckoutFormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rut: "",
    direccion: "",
    ciudad: "",
    region: "",
  });

  const { data: session, status } = useSession();
  const { items, total } = useCartStore();
  const { trackInitiateCheckout } = usePixel();

  const subtotal = total();
  const totalItemsQuantity = calculateTotalItemsQuantity(items);

  const shippingCost = calculateShippingCost(
    formData.region,
    totalItemsQuantity,
    deliveryMethod
  );

  const discountAmount = calculateDiscountAmount(appliedCoupon, subtotal);

  const finalAmount = Math.max(
    0,
    subtotal + (shippingCost ?? 0) - discountAmount
  );

  const deliveryTimeLabel =
    deliveryMethod === "retiro"
      ? "Disponible en 2 días"
      : "Promedio de entrega 2 a 3 días. Plazo estimado de 2 a 7 días máximo.";

  const shippingLabel =
    deliveryMethod === "retiro"
      ? "Retiro en tienda - disponible en 2 días"
      : shippingCost === null
        ? "Por confirmar"
        : `${formatPrice(
            shippingCost
          )} - promedio de entrega 2 a 3 días, plazo estimado 2 a 7 días máximo`;

  const shippingSummaryLabel =
    deliveryMethod === "retiro"
      ? `${formatPrice(shippingCost ?? 0)} - disponible en 2 días`
      : shippingCost === null
        ? "Por confirmar"
        : formatPrice(shippingCost);

  const isContactDataComplete =
    formData.nombre.trim() !== "" &&
    formData.apellido.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.telefono.trim() !== "" &&
    formData.rut.trim() !== "";

  const isShippingDataComplete =
    deliveryMethod === "retiro" ||
    (formData.direccion.trim() !== "" &&
      formData.ciudad.trim() !== "" &&
      formData.region.trim() !== "");

  const isBuyerDataComplete = isContactDataComplete && isShippingDataComplete;

  const carritoPagoTransferencia = items.map((item) => ({
    id: item.id,
    nombre: item.name,
    name: item.name,
    precio: Number(item.price || 0),
    price: Number(item.price || 0),
    cantidad: Number(item.quantity || 1),
    quantity: Number(item.quantity || 1),
    imagen: item.image,
    image: item.image,
    subtotal: Number(item.price || 0) * Number(item.quantity || 1),
  }));

  const compradorPagoTransferencia = {
    nombre: `${formData.nombre} ${formData.apellido}`.trim(),
    nombres: formData.nombre,
    apellido: formData.apellido,
    email: formData.email,
    correo: formData.email,
    telefono: formData.telefono,
    rut: formData.rut,
    direccion:
      deliveryMethod === "retiro" ? "Retiro en tienda" : formData.direccion,
    ciudad: deliveryMethod === "retiro" ? "Retiro en tienda" : formData.ciudad,
    region: deliveryMethod === "retiro" ? "Retiro en tienda" : formData.region,
    formaEntrega:
      deliveryMethod === "retiro" ? "Retiro en tienda" : "Despacho a domicilio",
    metodoEntrega: deliveryMethod,
    plazoEntrega: deliveryTimeLabel,
    envioEtiqueta: shippingLabel,
    subtotal,
    envio: shippingCost ?? 0,
    descuento: discountAmount,
    cupon: appliedCoupon?.code || "",
    total: finalAmount,
  };

  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout(total());
    }
  }, [items.length, total, trackInitiateCheckout]);

  useEffect(() => {
    if (session?.user?.email && status === "authenticated") {
      fetch("/api/user/shipping-data")
        .then((res) => res.json())
        .then((data) => {
          if (data.shippingData) {
            const comunaGuardada = data.shippingData.ciudad || "";
            const regionAutomatica = getRegionByComuna(comunaGuardada);

            setFormData((prev) => ({
              ...prev,
              nombre: data.shippingData.firstName || prev.nombre,
              apellido: data.shippingData.lastName || prev.apellido,
              email: data.shippingData.email || prev.email,
              telefono: data.shippingData.telefono || prev.telefono,
              rut: data.shippingData.rut || prev.rut,
              direccion: data.shippingData.direccion || prev.direccion,
              ciudad: comunaGuardada || prev.ciudad,
              region:
                regionAutomatica || data.shippingData.region || prev.region,
            }));
          }
        })
        .catch(console.error);
    }
  }, [session?.user?.email, status]);

  const clearBuyerData = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      rut: "",
      direccion: "",
      ciudad: "",
      region: "",
    });

    setWantsPassword(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    clearBuyerData();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleComunaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const comuna = e.target.value;
    const region = getRegionByComuna(comuna);

    setFormData((prev) => ({
      ...prev,
      ciudad: comuna,
      region,
    }));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setError("");
    setPaymentMethod(method);
  };

  const handleDeliveryMethodChange = (method: DeliveryMethod) => {
    setError("");
    setDeliveryMethod(method);
  };

  const handleApplyCoupon = async () => {
    setCouponError("");

    const normalizedCode = couponInput.trim().toUpperCase();

    if (!normalizedCode) {
      setCouponError("Ingresa un código de descuento.");
      return;
    }

    if (subtotal <= 0) {
      setCouponError("No hay productos válidos para aplicar descuento.");
      return;
    }

    setCouponLoading(true);

    try {
      const response = await fetch("/api/cupon-validar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo: normalizedCode,
          subtotal,
        }),
      });

      const data = (await response.json()) as CouponValidationResponse;

      if (!response.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.message || "El código ingresado no es válido.");
        return;
      }

      const couponType: CouponDiscountType =
        data.tipo === "monto" ? "monto" : "porcentaje";

      const couponValue = Number(data.valor || 0);
      const previewDiscount = Number(data.descuento || 0);

      if (previewDiscount <= 0) {
        setAppliedCoupon(null);
        setCouponError("Este código no genera descuento en este pedido.");
        return;
      }

      setAppliedCoupon({
        code: data.codigo || normalizedCode,
        type: couponType,
        value: couponValue,
        description: data.message || "Cupón aplicado correctamente.",
      });

      setCouponInput(data.codigo || normalizedCode);
    } catch (error) {
      console.error("Error aplicando cupón:", error);
      setAppliedCoupon(null);
      setCouponError("No se pudo validar el cupón. Intenta nuevamente.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (paymentMethod !== "webpay") {
      return;
    }

    if (items.length === 0) {
      setError("Tu carrito está vacío");
      return;
    }

    if (!isBuyerDataComplete) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (deliveryMethod === "despacho" && shippingCost === null) {
      setError("Selecciona una comuna para calcular el envío");
      return;
    }

    if (wantsPassword && password.trim().length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (wantsPassword && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const orderId = `ORD-${Date.now()}`;

    const orderFormData =
      deliveryMethod === "retiro"
        ? {
            ...formData,
            direccion: formData.direccion || "Retiro en tienda",
            ciudad: formData.ciudad || "Retiro en tienda",
            region: formData.region || "Retiro en tienda",
          }
        : formData;

    setIsLoading(true);

    try {
      trackInitiateCheckout(finalAmount);

      const response = await fetch("/api/transbank/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          orderId,
          returnUrl: window.location.origin,
          items,
          formData: orderFormData,
          shipping: {
            method: deliveryMethod,
            region: orderFormData.region,
            comuna: orderFormData.ciudad,
            cost: shippingCost,
            label: shippingLabel,
            deliveryTime: deliveryTimeLabel,
          },
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                type: appliedCoupon.type,
                value: appliedCoupon.value,
                discount: discountAmount,
              }
            : null,
          totals: {
            subtotal,
            shipping: shippingCost,
            discount: discountAmount,
            finalAmount,
          },
          accountData: {
            wantsPassword,
          },
        }),
      });

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || "Error al iniciar pago");
      }

      sessionStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          orderId,
          formData: orderFormData,
          amount: finalAmount,
          shipping: {
            method: deliveryMethod,
            region: orderFormData.region,
            comuna: orderFormData.ciudad,
            cost: shippingCost,
            label: shippingLabel,
            deliveryTime: deliveryTimeLabel,
          },
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                type: appliedCoupon.type,
                value: appliedCoupon.value,
                discount: discountAmount,
              }
            : null,
          totals: {
            subtotal,
            shipping: shippingCost,
            discount: discountAmount,
            finalAmount,
          },
          accountData: {
            wantsPassword,
          },
        })
      );

      const form = document.createElement("form");
      form.action = data.url;
      form.method = "POST";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = data.token;

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center">
        <div className="w-16 h-16 bg-[var(--border-subtle)] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
        </div>
        <p className="text-[var(--muted-foreground)]">Tu carrito está vacío.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
      <div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 lg:p-8">
          <h2 className="text-heading-lg text-[var(--foreground)] mb-6">
            Datos del comprador
          </h2>

          {status === "authenticated" && session?.user ? (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Sesión iniciada
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    Estás comprando como{" "}
                    <strong>{session.user.email || session.user.name}</strong>.
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    Si tienes datos guardados, los cargaremos automáticamente en
                    el formulario.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    ¿Ya tienes cuenta?
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Inicia sesión para cargar tus datos y revisar tus pedidos
                    después de la compra.
                  </p>
                </div>

                <Link href="/login?redirect=/checkout">
                  <Button type="button">Inicia sesión</Button>
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  o continúa como cliente nuevo
                </span>
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-[var(--foreground)] mb-2"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label
                  htmlFor="apellido"
                  className="block text-sm font-medium text-[var(--foreground)] mb-2"
                >
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--foreground)] mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="juan@email.cl"
                />
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-[var(--foreground)] mb-2"
                >
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input"
                  placeholder="+56 9 1234 5678"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="rut"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                RUT
              </label>
              <input
                type="text"
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                className="input"
                placeholder="12.345.678-9"
                required
              />
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] p-5">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Forma de entrega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    deliveryMethod === "despacho"
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="despacho"
                      checked={deliveryMethod === "despacho"}
                      onChange={() => handleDeliveryMethodChange("despacho")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        Despacho a domicilio
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Promedio de entrega 2 a 3 días. Plazo estimado de 2 a 7
                        días máximo.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    deliveryMethod === "retiro"
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="retiro"
                      checked={deliveryMethod === "retiro"}
                      onChange={() => handleDeliveryMethodChange("retiro")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        Retiro en tienda
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Sin costo de envío. Disponible en 2 días.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {deliveryMethod === "despacho" && (
              <>
                <div>
                  <label
                    htmlFor="direccion"
                    className="block text-sm font-medium text-[var(--foreground)] mb-2"
                  >
                    Dirección de envío
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    required={deliveryMethod === "despacho"}
                    className="input"
                    placeholder="Av. Principal 123, Depto 45"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="ciudad"
                      className="block text-sm font-medium text-[var(--foreground)] mb-2"
                    >
                      Comuna
                    </label>
                    <select
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleComunaChange}
                      className="input"
                      required={deliveryMethod === "despacho"}
                    >
                      <option value="">Selecciona tu comuna</option>
                      {COMUNAS_CHILE.map((item) => (
                        <option
                          key={`${item.region}-${item.comuna}`}
                          value={item.comuna}
                        >
                          {item.comuna}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="region"
                      className="block text-sm font-medium text-[var(--foreground)] mb-2"
                    >
                      Región
                    </label>
                    <input
                      type="text"
                      id="region"
                      name="region"
                      value={formData.region}
                      readOnly
                      className="input bg-[var(--background)] cursor-not-allowed"
                      placeholder="Se completará automáticamente"
                      required={deliveryMethod === "despacho"}
                    />
                  </div>
                </div>
              </>
            )}

            {deliveryMethod === "retiro" && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Seleccionaste retiro en tienda. No se cobrará envío en este
                pedido. Disponible en 2 días.
              </div>
            )}

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] p-5">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Datos de despacho
              </h3>

              <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <p>
                  <strong className="text-[var(--foreground)]">
                    Región Metropolitana:
                  </strong>{" "}
                  envío $3.750 por artículo, con tope máximo de $21.000 por
                  pedido.
                </p>
                <p>
                  <strong className="text-[var(--foreground)]">
                    Otras regiones:
                  </strong>{" "}
                  envío $5.000 por artículo, calculado según la cantidad
                  comprada y sin tope de envío.
                </p>
                <p>
                  <strong className="text-[var(--foreground)]">
                    Despacho a domicilio:
                  </strong>{" "}
                  promedio de entrega 2 a 3 días. Plazo estimado de 2 a 7 días
                  máximo.
                </p>
                <p>
                  <strong className="text-[var(--foreground)]">
                    Retiro en tienda:
                  </strong>{" "}
                  sin costo de envío. Disponible en 2 días.
                </p>
              </div>

              {deliveryMethod === "despacho" && formData.region && (
                <div className="mt-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] px-4 py-3 text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    Envío calculado para{" "}
                  </span>
                  <strong className="text-[var(--foreground)]">
                    {formData.ciudad}, {formData.region}
                  </strong>
                  <span className="text-[var(--muted-foreground)]">: </span>
                  <strong className="text-[var(--accent)]">
                    {shippingLabel}
                  </strong>
                </div>
              )}

              {deliveryMethod === "retiro" && (
                <div className="mt-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] px-4 py-3 text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    Entrega seleccionada:{" "}
                  </span>
                  <strong className="text-[var(--accent)]">
                    {shippingLabel}
                  </strong>
                </div>
              )}
            </div>

            {status !== "authenticated" && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] p-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsPassword}
                    onChange={(e) => {
                      setWantsPassword(e.target.checked);
                      setError("");

                      if (!e.target.checked) {
                        setPassword("");
                        setConfirmPassword("");
                      }
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--foreground)]">
                      ¿Quieres agregar contraseña para revisar tus pedidos?
                    </span>
                    <span className="block mt-1 text-sm text-[var(--muted-foreground)]">
                      Es opcional. Puedes comprar sin contraseña y crearla más
                      adelante desde “Mi cuenta”.
                    </span>
                  </span>
                </label>

                {wantsPassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-[var(--foreground)] mb-2"
                      >
                        Contraseña
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        placeholder="Mínimo 8 caracteres"
                        required={wantsPassword}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-[var(--foreground)] mb-2"
                      >
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input"
                        placeholder="Repite tu contraseña"
                        required={wantsPassword}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">
                Método de pago
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    paymentMethod === "webpay"
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="webpay"
                      checked={paymentMethod === "webpay"}
                      onChange={() => handlePaymentMethodChange("webpay")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        Webpay
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Pago en línea mediante Transbank.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    paymentMethod === "transferencia"
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transferencia"
                      checked={paymentMethod === "transferencia"}
                      onChange={() =>
                        handlePaymentMethodChange("transferencia")
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        Transferencia bancaria
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        La orden queda pendiente hasta confirmar el pago.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {paymentMethod === "webpay" && (
              <>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                      Pagar con Webpay
                    </>
                  )}
                </Button>

                <p className="text-xs text-[var(--muted)] text-center mt-4">
                  Al hacer clic en &quot;Pagar con Webpay&quot;, serás
                  redirigido a la plataforma segura de Transbank.
                </p>
              </>
            )}
          </form>

          {paymentMethod === "transferencia" && (
            <div className="mt-6">
              {!isBuyerDataComplete ? (
                <div className="p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
                  Completa todos los datos del comprador para registrar la orden
                  por transferencia bancaria.
                </div>
              ) : deliveryMethod === "despacho" && shippingCost === null ? (
                <div className="p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
                  Selecciona una comuna para calcular el envío.
                </div>
              ) : wantsPassword && password.trim().length < 8 ? (
                <div className="p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
                  La contraseña debe tener al menos 8 caracteres.
                </div>
              ) : wantsPassword && password !== confirmPassword ? (
                <div className="p-4 bg-[var(--destructive-muted)] border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
                  Las contraseñas no coinciden.
                </div>
              ) : (
                <PagoTransferencia
                  carrito={carritoPagoTransferencia}
                  comprador={compradorPagoTransferencia}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lg:pl-4">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 lg:p-8 sticky top-24">
          <h2 className="text-heading-md text-[var(--foreground)] mb-6">
            Resumen del pedido
          </h2>

          <div className="space-y-4 mb-6 max-h-72 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-14 h-14 bg-[var(--border-subtle)] rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Cantidad: {item.quantity}
                  </p>
                </div>

                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[var(--muted-foreground)]">Envío</span>
              <span className="font-medium text-right">
                {shippingSummaryLabel}
              </span>
            </div>

            {!appliedCoupon && (
              <div className="pt-2">
                <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
                  ¿Tienes un cupón de descuento?
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    disabled={couponLoading}
                    className="input flex-1 text-sm uppercase disabled:opacity-60"
                    placeholder="Cod. Desc"
                  />

                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                  >
                    {couponLoading ? "Validando..." : "Aplicar"}
                  </Button>
                </div>

                {couponError && (
                  <p className="mt-2 text-xs text-[var(--destructive)]">
                    {couponError}
                  </p>
                )}
              </div>
            )}

            {appliedCoupon && discountAmount > 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-3">
                <div className="flex items-center justify-between text-sm text-green-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      Desc. {appliedCoupon.code}
                    </span>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-medium text-green-700 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>

                  <span className="font-semibold text-green-700">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-green-700">
                  Cupón aplicado correctamente.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-[var(--border)]">
              <span className="font-semibold text-[var(--foreground)]">
                Total final
              </span>
              <span className="text-xl font-bold text-[var(--foreground)]">
                {formatPrice(finalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[var(--success-muted)] rounded-xl">
            <div className="flex items-center gap-2 text-sm text-[var(--success)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>
                Compra protegida con opciones de pago seguras: Webpay o
                transferencia bancaria.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
