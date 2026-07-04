import { NextRequest, NextResponse } from "next/server";
import { searchTrips } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  if (!from || !to || !date) {
    return NextResponse.json(
      { error: "Missing required params: from, to, date" },
      { status: 400 }
    );
  }

  const result = await searchTrips({ from, to, date });

  if (!result) {
    return NextResponse.json(
      { error: "Invalid route or cities" },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
