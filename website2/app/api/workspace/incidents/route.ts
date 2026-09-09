import { NextResponse } from "next/server";
import {
  listWorkspaceIncidents,
  getWorkspaceIncident,
} from "@/lib/incidents/queries";

const severities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

const statuses = [
  "OPEN",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "RESOLVED",
  "CLOSED",
] as const;

function isSeverity(
  value: string,
): value is (typeof severities)[number] {
  return (severities as readonly string[]).includes(value);
}

function isStatus(
  value: string,
): value is (typeof statuses)[number] {
  return (statuses as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const incidentId =
      url.searchParams.get("incidentId");

    if (incidentId) {
      const incident =
        await getWorkspaceIncident(
          incidentId,
        );

      if (!incident) {
        return NextResponse.json(
          {
            error: "INCIDENT_NOT_FOUND",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        incident,
      });
    }

    const status =
      url.searchParams.get("status");

    const severity =
      url.searchParams.get("severity");

    const limitParam =
      url.searchParams.get("limit");

    const limit =
      limitParam
        ? Number(limitParam)
        : 100;

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 200
    ) {
      return NextResponse.json(
        {
          error: "INVALID_LIMIT",
        },
        {
          status: 400,
        },
      );
    }

    if (
      status &&
      !isStatus(status)
    ) {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
        },
        {
          status: 400,
        },
      );
    }

    if (
      severity &&
      !isSeverity(severity)
    ) {
      return NextResponse.json(
        {
          error: "INVALID_SEVERITY",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await listWorkspaceIncidents({
        status:
          status && isStatus(status)
            ? status
            : undefined,

        severity:
          severity && isSeverity(severity)
            ? severity
            : undefined,

        limit,
      });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    if (
      message === "UNAUTHENTICATED"
    ) {
      return NextResponse.json(
        {
          error: "UNAUTHENTICATED",
        },
        {
          status: 401,
        },
      );
    }

    if (
      message === "NO_WORKSPACE_ACCESS"
    ) {
      return NextResponse.json(
        {
          error: "NO_WORKSPACE_ACCESS",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        error: "INCIDENT_API_FAILED",
        message,
      },
      {
        status: 500,
      },
    );
  }
}
