import { NextRequest, NextResponse } from "next/server";
import type { Strategy } from "@/lib/types";

// In-memory storage for strategies - in production this would be a database
let STRATEGIES: Map<string, Strategy> = new Map();

export const runtime = "nodejs";

// GET /api/strategies - Retrieve all strategies or a specific one
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const strategy = STRATEGIES.get(id);
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }
    return NextResponse.json(strategy);
  }

  // Return all strategies
  const allStrategies = Array.from(STRATEGIES.values());
  return NextResponse.json({ strategies: allStrategies, total: allStrategies.length });
}

// POST /api/strategies - Create a new strategy
export async function POST(req: NextRequest) {
  try {
    const strategy: Strategy = await req.json();

    // Validate strategy structure
    if (!strategy.id || !strategy.name || !strategy.blocks) {
      return NextResponse.json({ error: "Invalid strategy structure" }, { status: 400 });
    }

    // Store the strategy
    STRATEGIES.set(strategy.id, strategy);

    return NextResponse.json({ success: true, strategy }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// PUT /api/strategies - Update an existing strategy
export async function PUT(req: NextRequest) {
  try {
    const strategy: Strategy = await req.json();

    if (!strategy.id) {
      return NextResponse.json({ error: "Strategy ID required" }, { status: 400 });
    }

    if (!STRATEGIES.has(strategy.id)) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    // Update the strategy
    STRATEGIES.set(strategy.id, strategy);

    return NextResponse.json({ success: true, strategy });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// DELETE /api/strategies - Delete a strategy
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Strategy ID required" }, { status: 400 });
  }

  if (!STRATEGIES.has(id)) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  STRATEGIES.delete(id);

  return NextResponse.json({ success: true });
}