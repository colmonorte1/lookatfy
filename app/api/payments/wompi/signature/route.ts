import { NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { reference, amountInCents, currency } = await request.json();

    if (!reference || !amountInCents || !currency) {
      return NextResponse.json(
        { error: "Missing required fields: reference, amountInCents, currency" },
        { status: 400 }
      );
    }

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!integritySecret) {
      console.error("WOMPI_INTEGRITY_SECRET is not set in environment variables.");
      return NextResponse.json(
        { error: "Server configuration error: Missing integrity secret." },
        { status: 500 }
      );
    }

    const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;

    const hash = createHash("sha256");
    hash.update(concatenated);
    const signature = hash.digest("hex");

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Error generating Wompi signature:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
