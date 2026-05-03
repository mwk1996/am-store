// Notification service — notification model implemented in Phase 3
export const notificationService = {
  async create(
    _userId: string,
    _type: string,
    _title: string,
    _message: string,
    _meta?: Record<string, unknown>
  ): Promise<void> {
    // No-op until Phase 3
  },
  async getForUser(_userId: string, _page?: number, _limit?: number) {
    return [];
  },
  async markRead(_notificationId: string, _userId?: string): Promise<void> {
    // No-op until Phase 3
  },
};
