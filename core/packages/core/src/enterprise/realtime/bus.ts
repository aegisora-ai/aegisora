import type {
  EnterpriseRealtimeEvent,
  EnterpriseRealtimeListener,
  EnterpriseRealtimeWriter,
} from "./types";

export class EnterpriseRealtimeBus {
  private readonly listeners = new Set<EnterpriseRealtimeListener>();

  constructor(
    private readonly writer?: EnterpriseRealtimeWriter,
  ) {}

  async publish(
    event: EnterpriseRealtimeEvent,
  ): Promise<void> {
    if (this.writer) {
      await this.writer.publish(event);
    }

    for (const listener of this.listeners) {
      listener(event);
    }
  }

  subscribe(
    listener: EnterpriseRealtimeListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  listenerCount(): number {
    return this.listeners.size;
  }
}
