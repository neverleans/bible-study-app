import { Injectable, Inject } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { users, quizAttempts, reviewCards, reflections } from '../../database/schema';
import { ClaimGuestResultDto } from './dto/guest-claim.dto';

const NOTHING: ClaimGuestResultDto = { quizAttempts: 0, reviewCards: 0, reflections: 0 };

/**
 * Brings what a visitor did before signing in (quiz attempts, review cards, reflections) into the
 * account. Row-level security only lets a request see its own user's rows, so the move reads as the
 * guest, writes as the account and then deletes as the guest, all in one transaction.
 *
 * The guest id works as a secret: it is a random UUID that only the visitor's browser knows. Only
 * rows of real guest users are moved (created by this app with the `<id>@local.dev` email and no
 * password), never another account's.
 */
@Injectable()
export class GuestClaimService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async claim(userId: string, guestId: string): Promise<ClaimGuestResultDto> {
    const guest = guestId.toLowerCase();
    if (guest === userId.toLowerCase()) return { ...NOTHING };

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ email: users.email, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, guest))
        .limit(1);
      // Unknown ids and real accounts look the same from outside: nothing to claim.
      if (!row || row.passwordHash !== null || row.email.toLowerCase() !== `${guest}@local.dev`) {
        return { ...NOTHING };
      }

      const as = (id: string) => tx.execute(sql`SELECT set_config('app.current_user_id', ${id}, true)`);

      await as(guest);
      const attempts = await tx.select().from(quizAttempts);
      const cards = await tx.select().from(reviewCards);
      const notes = await tx.select().from(reflections);
      if (attempts.length + cards.length + notes.length === 0) return { ...NOTHING };

      await as(userId);
      if (attempts.length > 0) {
        await tx.insert(quizAttempts).values(attempts.map(({ id: _id, ...rest }) => ({ ...rest, userId })));
      }
      let movedCards = 0;
      if (cards.length > 0) {
        const inserted = await tx
          .insert(reviewCards)
          .values(cards.map(({ id: _id, ...rest }) => ({ ...rest, userId })))
          // The account may already have the same verse or question: keep what it has.
          .onConflictDoNothing()
          .returning({ id: reviewCards.id });
        movedCards = inserted.length;
      }
      if (notes.length > 0) {
        await tx.insert(reflections).values(notes.map(({ id: _id, ...rest }) => ({ ...rest, userId })));
      }

      await as(guest);
      await tx.delete(quizAttempts);
      await tx.delete(reviewCards);
      await tx.delete(reflections);

      return { quizAttempts: attempts.length, reviewCards: movedCards, reflections: notes.length };
    });
  }
}
