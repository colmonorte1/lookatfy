"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import {
  CreditCard,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { buildLocalDate } from "@/utils/timezone";

// Let TypeScript know about the Wompi WidgetCheckout class on the window object
declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Helper to wrap useSearchParams in Suspense
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTimezonePref, setUserTimezonePref] = useState<string | null>(null);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // User Form State
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "", // ReadOnly
    phone: "",
    notes: "",
  });

  const [addons, setAddons] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [acceptPolicyChecked, setAcceptPolicyChecked] = useState(false);
  const [acceptPersonalChecked, setAcceptPersonalChecked] = useState(false);
  const [acceptLinks, setAcceptLinks] = useState<{ policy?: string; personal?: string }>({});

  const [loadingUser, setLoadingUser] = useState(true);

  // Validated price from database (to prevent URL manipulation)
  const [validatedPrice, setValidatedPrice] = useState<number | null>(null);
  const [validatedCurrency, setValidatedCurrency] = useState<string | null>(null);
  const [priceValidationError, setPriceValidationError] = useState<string | null>(null);

  const [intent, setIntent] = useState<{
    title?: string;
    price?: number;
    currency?: string;
    image?: string;
    serviceId?: string;
    expertId?: string;
    date?: string;
    time?: string;
  } | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_intent");
      if (raw) setIntent(JSON.parse(raw));
    } catch {}
  }, []);

  const serviceTitle = (intent?.title ?? searchParams.get("title")) || "Servicio Profesional";
  const expertName = searchParams.get("expert") || "Experto Lookatfy";
  const price = intent?.price ?? parseFloat(searchParams.get("price") || "0");
  const date = (intent?.date ?? searchParams.get("date")) || "";
  const time = (intent?.time ?? searchParams.get("time")) || "";
  const currency = (intent?.currency ?? searchParams.get("currency")) || "USD";
  const image = (intent?.image ?? searchParams.get("image")) || "";
  const serviceId = intent?.serviceId ?? searchParams.get("serviceId");
  const expertId = intent?.expertId ?? searchParams.get("expertId");

  const formatAmount = (cur: string, amount: number) => {
    if (cur === "COP") {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
    }
    if (cur === "EUR") {
      return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  // Use validated price if available, otherwise fallback to URL price
  const displayPrice = validatedPrice !== null ? validatedPrice : price;
  const displayCurrency = validatedCurrency !== null ? validatedCurrency : currency;

  // Fetch User Info on Mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Try to fetch profile details
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
          name: profile?.first_name || profile?.full_name?.split(" ")[0] || "",
          surname: profile?.last_name || profile?.full_name?.split(" ").slice(1).join(" ") || "",
          phone: profile?.phone || "",
        }));
        setUserTimezonePref((profile as any)?.timezone || null);
        let targetCountry = profile?.country || "";
        try {
          if (!targetCountry && expertId) {
            const { data: expertRow } = await supabase
              .from("experts")
              .select("country")
              .eq("id", expertId)
              .single();
            targetCountry = String(expertRow?.country || "");
          }
        } catch {}
        try {
          const { data: svc } = await supabase
            .from("admin_services")
            .select("id,name,price,country_code,active");
          const list = (svc || [])
            .filter((s: any) => !!s.active && (!s.country_code || s.country_code === targetCountry))
            .map((s: any) => ({ id: String(s.id), name: String(s.name), price: Number(s.price) }));
          setAddons(list);
        } catch {}
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, []);

  // Validate service price on mount (prevent URL manipulation)
  useEffect(() => {
    const validatePrice = async () => {
      if (!serviceId) {
        setPriceValidationError("ID de servicio no válido");
        return;
      }

      try {
        const supabase = createClient();
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("price, currency")
          .eq("id", serviceId)
          .single();

        if (serviceError || !serviceData) {
          setPriceValidationError("No se pudo validar el precio del servicio");
          return;
        }

        const dbPrice = Number(serviceData.price);
        const dbCurrency = String(serviceData.currency);

        // Check if URL price matches database price
        if (Math.abs(dbPrice - price) > 0.01 || dbCurrency !== currency) {
          console.warn("Price mismatch detected:", {
            urlPrice: price,
            dbPrice,
            urlCurrency: currency,
            dbCurrency,
          });
          setPriceValidationError("El precio del servicio no coincide. Mostrando precio correcto.");
        }

        // Always use database price
        setValidatedPrice(dbPrice);
        setValidatedCurrency(dbCurrency);
      } catch (error) {
        console.error("Error validating price:", error);
        setPriceValidationError("Error al validar el precio");
      }
    };

    validatePrice();
  }, [serviceId, price, currency]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchAcceptance = async () => {
      try {
        const isProd = process.env.NODE_ENV === "production";
        const base = isProd ? "https://api.wompi.co/v1" : "https://sandbox.wompi.co/v1";
        const pub = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "";
        if (!pub) return;
        const res = await fetch(`${base}/merchants/${pub}`, { cache: "no-store" });
        const data = await res.json();
        const policy = String(data?.data?.presigned_acceptance?.permalink || "");
        const personal = String(data?.data?.presigned_personal_data_auth?.permalink || "");
        setAcceptLinks({ policy, personal });
      } catch {}
    };
    fetchAcceptance();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceId || !expertId || !date || !time) {
      showToast("Faltan datos de la reserva.", "error");
      return;
    }

    if (!acceptPolicyChecked || !acceptPersonalChecked) {
      showToast("Debes aceptar los términos y condiciones para continuar.", "warning");
      return;
    }

    if (typeof window.WidgetCheckout === "undefined") {
      showToast("El widget de pago no ha cargado. Refresca la página.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("Debes iniciar sesión para reservar.", "warning");
        router.push("/login?next=/checkout");
        setIsProcessing(false);
        return;
      }

      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("price, currency")
        .eq("id", serviceId)
        .single();

      if (serviceError || !serviceData) {
        showToast("Error al validar el servicio. Intenta de nuevo.", "error");
        setIsProcessing(false);
        return;
      }

      const dbPrice = Number(serviceData.price);
      const dbCurrency = String(serviceData.currency);

      if (Math.abs(dbPrice - price) > 0.01 || dbCurrency !== currency) {
        showToast("Error: El precio no es válido. Recarga la página.", "error");
        setIsProcessing(false);
        return;
      }

      const userTz =
        userTimezonePref ||
        (() => {
          try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
          } catch {
            return "UTC";
          }
        })();
      const { data: expertRow } = await supabase
        .from("experts")
        .select("timezone")
        .eq("id", expertId)
        .single();
      const expertTz = String(expertRow?.timezone || "UTC");

      const [y, m, d] = date.split("-").map(Number);
      const [hh, mm] = time.split(":").map(Number);
      const startAtUTC = buildLocalDate(y, m, d, hh, mm, expertTz);
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

      const { data: bookingRow, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          expert_id: expertId,
          service_id: serviceId,
          date,
          time,
          start_at: startAtUTC.toISOString(),
          expert_timezone: expertTz,
          user_timezone: userTz,
          status: "pending",
          price: dbPrice,
          currency,
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (bookingError) throw bookingError;
      const bookingId = String(bookingRow.id);

      if (selectedAddons.length) {
        const rows = addons
          .filter((a) => selectedAddons.includes(a.id))
          .map((a) => ({ booking_id: bookingId, admin_service_id: a.id, price: a.price }));
        if (rows.length) await supabase.from("booking_addons").insert(rows);
      }

      const serviceFee = dbCurrency === "COP" ? 2000 : 2;
      const addonsTotal = addons
        .filter((a) => selectedAddons.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);
      const total = dbPrice + serviceFee + addonsTotal;

      const wompiCurrency = "COP";
      let totalInCOP = total;

      if (dbCurrency !== "COP") {
        const rateRes = await fetch(`/api/payments/exchange-rate?from=${dbCurrency}`);
        if (!rateRes.ok) throw new Error("Error obteniendo tasa de cambio");
        const rateData = await rateRes.json();
        if (!rateData.rate || rateData.rate <= 0)
          throw new Error(`Tasa de cambio inválida para ${dbCurrency}`);
        totalInCOP = Math.round(total * rateData.rate);
      }

      const amountInCents = Math.round(totalInCOP * 100);
      const reference = bookingId;
      const integritySecret = process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET || "";
      if (!integritySecret) {
        showToast(
          "Error de configuración: La clave de integridad de Wompi no está configurada.",
          "error",
        );
        throw new Error("Missing Wompi integrity secret");
      }

      const concatenated = `${reference}${amountInCents}${wompiCurrency}${integritySecret}`;
      const encoder = new TextEncoder();
      const dataToHash = encoder.encode(concatenated);
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataToHash);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const checkout = new window.WidgetCheckout({
        currency: wompiCurrency,
        amountInCents: amountInCents,
        reference: reference,
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "",
        signature: { integrity: signature },
        redirectUrl: `${window.location.origin}/checkout/return?id=${bookingId}`,
        customerData: {
          email: formData.email,
          fullName: `${formData.name} ${formData.surname}`.trim(),
        },
      });

      checkout.open(function (result: any) {
        setIsProcessing(false);
        const transaction = result.transaction;
        console.log("Transaction ID: ", transaction.id);
        console.log("Transaction object: ", transaction);
        // The user will be redirected by Wompi via the redirectUrl
        // No need to router.push here unless the modal is closed without payment
      });
    } catch (error) {
      console.error(error);
      showToast("Hubo un error al preparar el pago. Por favor intenta de nuevo.", "error");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container" style={{ padding: "2rem 1rem", maxWidth: "1200px" }}>
      <Script src="https://checkout.wompi.co/widget.js" strategy="afterInteractive" />
      <Link
        href="#"
        onClick={() => router.back()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "2rem",
          color: "rgb(var(--text-secondary))",
          textDecoration: "none",
        }}
      >
        <ChevronLeft size={18} /> Volver al detalle
      </Link>

      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Finalizar Reserva</h1>

      {/* Removed security warning banner per request; validation remains silent */}

      <div
        className="checkout-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}
      >
        <style>{`
                    @media (min-width: 900px) {
                        .checkout-grid {
                            grid-template-columns: 1fr 400px !important;
                            gap: 4rem !important;
                        }
                    }
                `}</style>

        {/* Left Column: Customer Information */}
        <div>
          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgb(var(--primary))",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                1
              </div>
              Información del Cliente
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgb(var(--border))",
                    background: "rgb(var(--surface))",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  Apellidos
                </label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Tus apellidos"
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgb(var(--border))",
                    background: "rgb(var(--surface))",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                title="No puedes cambiar el email desde aquí"
                placeholder="ejemplo@correo.com"
                className="form-input"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgb(var(--border))",
                  background: "rgb(var(--surface-hover))",
                  cursor: "not-allowed",
                  color: "rgb(var(--text-secondary))",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+34 600 000 000"
                className="form-input"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgb(var(--border))",
                  background: "rgb(var(--surface))",
                }}
              />
            </div>

            <p style={{ fontSize: "0.8rem", color: "rgb(var(--text-muted))" }}>
              * Confirmaremos tu reserva a tu correo electrónico.
            </p>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgb(var(--text-secondary))",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                2
              </div>
              Notas Adicionales
            </h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="¿Tienes alguna petición especial para el experto?"
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgb(var(--border))",
                background: "rgb(var(--surface))",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Right Column: Summary & Payment */}
        <div>
          <div
            style={{
              background: "rgb(var(--surface))",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgb(var(--border))",
              position: "sticky",
              top: "2rem",
            }}
          >
            {/* Summary Section */}
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              Resumen de Reserva
            </h3>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              {(() => {
                const imageSrc =
                  image && image.trim()
                    ? image
                    : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80";
                return (
                  <img
                    src={imageSrc}
                    alt={serviceTitle}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                );
              })()}
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    lineHeight: "1.3",
                    marginBottom: "0.25rem",
                    fontSize: "0.95rem",
                  }}
                >
                  {serviceTitle}
                </div>
                <div style={{ fontSize: "0.85rem", color: "rgb(var(--text-secondary))" }}>
                  con {expertName}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Calendar size={16} color="rgb(var(--primary))" />
                <span>{date || "Fecha no seleccionada"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Clock size={16} color="rgb(var(--primary))" />
                <span>{time || "Hora no seleccionada"}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgb(var(--border))", margin: "1rem 0" }} />
            {addons.length > 0 && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Servicios opcionales
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {addons.map((a) => (
                      <label
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                          border: `1px solid ${selectedAddons.includes(a.id) ? "rgb(var(--primary))" : "rgb(var(--border))"}`,
                          borderRadius: "var(--radius-md)",
                          padding: "0.5rem 0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(a.id)}
                            onChange={(e) => {
                              setSelectedAddons((prev) =>
                                e.target.checked
                                  ? [...prev, a.id]
                                  : prev.filter((id) => id !== a.id),
                              );
                            }}
                          />
                          <span>{a.name}</span>
                        </div>
                        <span>{formatAmount(currency, a.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid rgb(var(--border))", margin: "1rem 0" }} />
              </>
            )}

            {/* Payment Section */}
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <CreditCard size={18} /> Pago
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ marginTop: "0rem", paddingTop: "0rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <span style={{ color: "rgb(var(--text-secondary))" }}>Subtotal</span>
                  <span>{formatAmount(displayCurrency, displayPrice)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <span style={{ color: "rgb(var(--text-secondary))" }}>Tarifa de Servicio</span>
                  <span>{formatAmount(displayCurrency, displayCurrency === "COP" ? 2000 : 2)}</span>
                </div>
                {selectedAddons.length > 0 &&
                  addons
                    .filter((a) => selectedAddons.includes(a.id))
                    .map((a) => (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span style={{ color: "rgb(var(--text-secondary))" }}>{a.name}</span>
                        <span>{formatAmount(displayCurrency, a.price)}</span>
                      </div>
                    ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "1rem",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  <span>Total</span>
                  <span>
                    {formatAmount(
                      displayCurrency,
                      displayPrice +
                        (displayCurrency === "COP" ? 2000 : 2) +
                        addons
                          .filter((a) => selectedAddons.includes(a.id))
                          .reduce((sum, a) => sum + a.price, 0),
                    )}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "block", fontWeight: 500 }}>Aceptaciones requeridas</label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={acceptPolicyChecked}
                    onChange={(e) => setAcceptPolicyChecked(e.target.checked)}
                  />
                  <span>He leído y acepto</span>
                  {acceptLinks.policy ? (
                    <a
                      href={acceptLinks.policy}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "rgb(var(--primary))" }}
                    >
                      Términos y condiciones
                    </a>
                  ) : (
                    <span style={{ color: "rgb(var(--text-secondary))" }}>
                      Términos y condiciones
                    </span>
                  )}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={acceptPersonalChecked}
                    onChange={(e) => setAcceptPersonalChecked(e.target.checked)}
                  />
                  <span>Autorizo el tratamiento de mis datos personales</span>
                  {acceptLinks.personal ? (
                    <a
                      href={acceptLinks.personal}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "rgb(var(--primary))" }}
                    >
                      Autorización de datos
                    </a>
                  ) : (
                    <span style={{ color: "rgb(var(--text-secondary))" }}>
                      Autorización de datos
                    </span>
                  )}
                </label>
              </div>

              <Button
                fullWidth
                size="lg"
                disabled={isProcessing}
                onClick={handlePayment}
                style={{ marginTop: "0.5rem" }}
              >
                {isProcessing ? "Procesando..." : "Confirmar y Pagar"}
              </Button>

              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "rgb(var(--text-muted))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <ShieldCheck size={12} /> Pagos seguros con Wompi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: "400px",
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                background: "rgb(var(--surface))",
                border: "1px solid rgb(var(--border))",
                borderLeft: `4px solid ${
                  toast.type === "success"
                    ? "rgb(var(--success))"
                    : toast.type === "error"
                      ? "rgb(var(--error))"
                      : toast.type === "warning"
                        ? "rgb(var(--warning))"
                        : "rgb(var(--primary))"
                }`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                borderRadius: "8px",
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                animation: "toastSlideIn 0.3s ease-out",
              }}
            >
              {toast.type === "success" ? (
                <CheckCircle size={20} style={{ color: "rgb(var(--success))", flexShrink: 0 }} />
              ) : toast.type === "error" ? (
                <XCircle size={20} style={{ color: "rgb(var(--error))", flexShrink: 0 }} />
              ) : (
                <AlertCircle
                  size={20}
                  style={{
                    color: toast.type === "warning" ? "rgb(var(--warning))" : "rgb(var(--primary))",
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ flex: 1, fontSize: "0.9rem", color: "rgb(var(--text-main))" }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "rgb(var(--text-secondary))",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
    </div>
  );
}
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "4rem", textAlign: "center" }}>
          Cargando checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
