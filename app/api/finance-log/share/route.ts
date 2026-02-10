import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { khataParty } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// POST /api/finance-log/share - Generate shareable link for a party
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { partyId, sendEmail } = await req.json();

        if (!partyId) {
            return NextResponse.json(
                { error: "Party ID is required" },
                { status: 400 }
            );
        }

        // Verify the party belongs to the user
        const party = await db.query.khataParty.findFirst({
            where: and(
                eq(khataParty.id, partyId),
                eq(khataParty.userId, session.user.id)
            ),
        });

        if (!party) {
            return NextResponse.json(
                { error: "Party not found or unauthorized" },
                { status: 404 }
            );
        }

        // Generate a unique share token
        const shareToken = crypto.randomBytes(32).toString("hex");

        // Update party with share token
        await db
            .update(khataParty)
            .set({
                shareToken,
                shareTokenCreatedAt: new Date(),
            })
            .where(eq(khataParty.id, partyId));

        // Generate shareable URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
        const shareUrl = `${baseUrl}/finance-log/view/${shareToken}`;

        // If email is requested and party has email, send it
        if (sendEmail && party.email) {
            // TODO: Implement email sending here
            // For now, we'll just return the info
            return NextResponse.json({
                shareUrl,
                shareToken,
                emailSent: false,
                message: "Share link generated. Email functionality coming soon!",
                partyEmail: party.email,
            });
        }

        return NextResponse.json({
            shareUrl,
            shareToken,
            message: "Share link generated successfully"
        });
    } catch (error) {
        console.error("Share link generation error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate share link",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
