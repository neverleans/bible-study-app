import { Test, TestingModule } from '@nestjs/testing';
import { GuestClaimService } from './guest-claim.service';
import { DRIZZLE } from '../../database/database.module';

const GUEST = '11111111-1111-4111-8111-111111111111';
const ACCOUNT = '22222222-2222-4222-8222-222222222222';

describe('GuestClaimService', () => {
  let service: GuestClaimService;
  const values = jest.fn();
  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };
  const mockDb = { transaction: jest.fn() };

  const userQuery = (rows: unknown[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(rows),
  });
  const rowsQuery = (rows: unknown[]) => ({ from: jest.fn().mockResolvedValue(rows) });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
    mockTx.delete.mockResolvedValue([]);
    values.mockReturnValue({ onConflictDoNothing: () => ({ returning: () => Promise.resolve([{ id: 'c1' }]) }) });
    // A plain insert is awaited directly; make the returned object thenable too.
    mockTx.insert.mockImplementation(() => ({
      values: (v: unknown) => {
        const chain = values(v);
        return Object.assign(Promise.resolve([]), chain);
      },
    }));
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestClaimService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(GuestClaimService);
  });

  it('does nothing when the guest id is the account itself', async () => {
    await expect(service.claim(ACCOUNT, ACCOUNT.toUpperCase())).resolves.toEqual({
      quizAttempts: 0,
      reviewCards: 0,
      reflections: 0,
    });
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('does not touch an id that is not a guest: unknown or a real account', async () => {
    mockTx.select.mockReturnValueOnce(userQuery([]));
    await expect(service.claim(ACCOUNT, GUEST)).resolves.toMatchObject({ reflections: 0 });

    mockTx.select.mockReturnValueOnce(userQuery([{ email: 'alguem@exemplo.com', passwordHash: 'hash' }]));
    await expect(service.claim(ACCOUNT, GUEST)).resolves.toMatchObject({ reflections: 0 });

    // A real account can also have a guest-looking email, but it has a password.
    mockTx.select.mockReturnValueOnce(userQuery([{ email: `${GUEST}@local.dev`, passwordHash: 'hash' }]));
    await expect(service.claim(ACCOUNT, GUEST)).resolves.toMatchObject({ reflections: 0 });

    expect(mockTx.insert).not.toHaveBeenCalled();
    expect(mockTx.delete).not.toHaveBeenCalled();
  });

  it('moves attempts, cards and reflections to the account and deletes the guest copies', async () => {
    mockTx.select
      .mockReturnValueOnce(userQuery([{ email: `${GUEST}@local.dev`, passwordHash: null }]))
      .mockReturnValueOnce(rowsQuery([{ id: 'a1', userId: GUEST, quizId: 'q1', score: 3, total: 5 }]))
      .mockReturnValueOnce(
        rowsQuery([
          { id: 'c1', userId: GUEST, sourceKey: 'verse:1:1' },
          { id: 'c2', userId: GUEST, sourceKey: 'verse:1:2' },
        ]),
      )
      .mockReturnValueOnce(rowsQuery([{ id: 'r1', userId: GUEST, content: 'texto' }]));

    const result = await service.claim(ACCOUNT, GUEST);

    // One card already existed in the account (conflict), so only one is reported as moved.
    expect(result).toEqual({ quizAttempts: 1, reviewCards: 1, reflections: 1 });
    // Rows are rewritten for the account, without the old ids.
    const written = values.mock.calls.map((c) => c[0]);
    expect(written[0]).toEqual([{ userId: ACCOUNT, quizId: 'q1', score: 3, total: 5 }]);
    expect(written[1][0]).toEqual({ userId: ACCOUNT, sourceKey: 'verse:1:1' });
    expect(written[2]).toEqual([{ userId: ACCOUNT, content: 'texto' }]);
    // Context switches guest -> account -> guest, and the guest copies are deleted.
    expect(mockTx.execute).toHaveBeenCalledTimes(3);
    expect(mockTx.delete).toHaveBeenCalledTimes(3);
  });

  it('returns nothing and writes nothing when the guest has no study data', async () => {
    mockTx.select
      .mockReturnValueOnce(userQuery([{ email: `${GUEST}@local.dev`, passwordHash: null }]))
      .mockReturnValueOnce(rowsQuery([]))
      .mockReturnValueOnce(rowsQuery([]))
      .mockReturnValueOnce(rowsQuery([]));
    await expect(service.claim(ACCOUNT, GUEST)).resolves.toEqual({ quizAttempts: 0, reviewCards: 0, reflections: 0 });
    expect(mockTx.insert).not.toHaveBeenCalled();
  });
});
