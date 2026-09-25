import {
  ContinuitySealEngine,
} from "@aegisora/core";

import type {
  ContinuitySeal,
  ContinuitySealInput,

  ContinuitySealVerification,
} from "@aegisora/core";

type ContinuitySealEffectInput =
  Parameters<
    ContinuitySealEngine["reconcileEffect"]
  >[1];

export interface ContinuitySealLedgerEntry {
  readonly type:
    | "created"
    | "verified"
    | "reconciled";

  readonly sealId: string;

  readonly timestamp: string;

  readonly verification?:
    ContinuitySealVerification;

  readonly reconciliation?:
    ContinuitySealVerification;
}

export class ContinuitySealRuntime {
  private readonly engine =
    new ContinuitySealEngine();

  private readonly seals =
    new Map<
      string,
      ContinuitySeal
    >();

  private readonly ledger:
    ContinuitySealLedgerEntry[] = [];

  create(
    input: ContinuitySealInput,
  ): ContinuitySeal {
    const seal =
      this.engine.create(
        input,
      );

    this.seals.set(
      seal.sealId,
      seal,
    );

    this.ledger.push({
      type:
        "created",

      sealId:
        seal.sealId,

      timestamp:
        new Date().toISOString(),
    });

    return seal;
  }

  verify(
    seal: ContinuitySeal,
    current: ContinuitySealInput,
  ): ContinuitySealVerification {
    const verification =
      this.engine.verify(
        seal,
        current,
      );

    this.ledger.push({
      type:
        "verified",

      sealId:
        seal.sealId,

      timestamp:
        new Date().toISOString(),

      verification,
    });

    return verification;
  }

  reconcileEffect(
    seal: ContinuitySeal,
    actual: ContinuitySealEffectInput,
  ): ContinuitySealVerification {
    const reconciliation =
      this.engine.reconcileEffect(
        seal,
        actual,
      );

    this.ledger.push({
      type:
        "reconciled",

      sealId:
        seal.sealId,

      timestamp:
        new Date().toISOString(),

      reconciliation,
    });

    return reconciliation;
  }

  get(
    sealId: string,
  ): ContinuitySeal | undefined {
    return this.seals.get(
      sealId,
    );
  }

  list(): readonly ContinuitySeal[] {
    return Array.from(
      this.seals.values(),
    );
  }

  getLedger():
    readonly ContinuitySealLedgerEntry[] {
    return [
      ...this.ledger,
    ];
  }

  clear(): void {
    this.seals.clear();
    this.ledger.length = 0;
  }
}