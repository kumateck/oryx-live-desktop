# Proposal: live updates when records change (`EntityChanged` events)

Status: **draft for review**, 2026-10-16. Needs a change to `oryx-backend`, which is shared with Oryx Next; nothing here is implemented.

## Problem

Oryx Live refreshes what a user's own saves change (cache tags, see `docs/api-codegen.md`). It cannot see changes made by anyone else: another user, another window, Oryx Next, or a background job. Today those appear when a page is opened again on data older than 30 seconds, when the window regains focus, or after a reconnect. A page left open on a desk, such as a goods receipt note, the approvals queue or a distribution, can show a stale status until then. In a regulated ERP that is a source of wrong decisions ("waiting for approval" after it was approved) and of duplicate work.

## Proposal

When the backend saves, it publishes **which records changed, never their content**. The notification gateway relays that to signed-in clients, and each client refreshes only the screens showing those records.

```text
SaveChanges ──▶ EntityChangedEvent {modelType, id, change}  (MassTransit, RabbitMQ fan-out)
                    │
                    ▼
     notification gateway: own queue, validate, coalesce 500 ms
                    │  Socket.IO "entities-changed" [{modelType, id}]
                    ▼
     client: modelType → cache resource → invalidate {resource, id} and its lists
                    │
                    ▼
     only the queries on screen for those records are read again
```

This follows two patterns the system already has: production-step updates (`ProductionActivityStepStatusChangedEvent`), published with MassTransit and relayed as `activity-updated`, and notifications, relayed through the same gateway.

## Backend (`oryx-backend`)

### 1. The event

`DOMAIN/Events/EntityChangedEvent.cs`

```csharp
namespace DOMAIN.Events;

/// <summary>Records changed by one save. Identifiers only: clients read the records themselves, with their own permissions.</summary>
public class EntityChangedEvent
{
    public List<EntityChange> Changes { get; set; } = [];
    public Guid? ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

public class EntityChange
{
    /// <summary>The aggregate the client knows, e.g. "PurchaseOrder" (not "PurchaseOrderItem").</summary>
    public string ModelType { get; set; } = "";
    public Guid ModelId { get; set; }
    public string Change { get; set; } = ""; // Added | Modified | Deleted
}
```

MassTransit publishes it to the fan-out exchange `DOMAIN.Events:EntityChangedEvent`.

### 2. Capturing changes: one EF Core interceptor

`INFRASTRUCTURE/Context/EntityChangeInterceptor.cs`, registered with `options.AddInterceptors(...)` beside the context. It reads the change tracker in `SavingChangesAsync`, which `ApplicationDbContext.SaveEntity()` already walks, and publishes in `SavedChangesAsync`, after the database accepted the save.

```csharp
public class EntityChangeInterceptor(IPublishEndpoint publish, ICurrentUserService user, EntityChangeOptions options)
    : SaveChangesInterceptor
{
    private readonly AsyncLocal<List<EntityChange>> pending = new();

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken ct = default)
    {
        pending.Value = data.Context!.ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Select(e => options.RootOf(e))            // child rows map to their aggregate, see below
            .Where(c => c is not null && options.Publishes(c.ModelType))
            .DistinctBy(c => (c!.ModelType, c.ModelId))
            .ToList()!;
        return base.SavingChangesAsync(data, result, ct);
    }

    public override async ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData data, int result, CancellationToken ct = default)
    {
        var changes = pending.Value;
        pending.Value = null;
        if (changes is { Count: > 0 })
            await publish.Publish(new EntityChangedEvent { Changes = changes, ChangedByUserId = user.UserId }, ct);
        return await base.SavedChangesAsync(data, result, ct);
    }
}
```

**Aggregates, not rows.** Clients show a purchase order, not its items. `EntityChangeOptions` maps child entities to their root, for example `PurchaseOrderItem → PurchaseOrder` (by `PurchaseOrderId`) and `ShipmentInvoiceItem → ShipmentInvoice`. It starts with the documents users watch: purchase orders, requisitions, shipments and invoices, billing sheets, GRNs and material batches, ATRs and form responses, production schedules and activities, approvals, stock transfers and adjustments. Anything unmapped publishes as its own type, and the client ignores types it does not know.

**Exclusions.** `EntityChangeOptions` excludes high-volume or private tables: audit logs, notifications, attachments' file rows, attendance imports, token and session tables. A soft delete (`DeletedAt` set) is published as `Deleted`.

### 3. Delivery guarantees

- **Explicit transactions.** `SavedChangesAsync` runs before an outer `BeginTransaction` commits. If that transaction rolls back, clients refresh and find nothing changed, which is harmless. To publish only on commit, use MassTransit's EF Core transactional outbox (`AddEntityFrameworkOutbox<ApplicationDbContext>(o => o.UseBusOutbox())`). That needs a migration for its outbox tables, so it is a separate decision.
- **At-most-once is acceptable.** A lost event costs freshness, not correctness. Clients still refetch on page open, window focus and reconnect.
- **Volume.** One message per `SaveChanges` (a batch), not one per row.

### 4. Tests (`tests/APP.Tests`)

- A save that adds a purchase order with items publishes one event with one `PurchaseOrder` change.
- Excluded types publish nothing.
- A failed save publishes nothing.
- `ChangedByUserId` is the current user.

These follow `ProductionActivityStepEventPublisherTests`.

## Gateway (`apps/gateway`)

- `messages.ts`: add `entityExchange = "DOMAIN.Events:EntityChangedEvent"` and `readEntityChanges(raw)`. It keeps only well-formed `{ modelType, modelId: guid }` pairs, at most 200 per message, and drops the rest.
- `main.ts`: bind a third exclusive queue, the same way as the board exchange.
- `server.ts`: coalesce for 500 ms, removing duplicates, then emit `entities-changed` `{ changes: [{ modelType, id }], by }` to signed-in sockets. Like `activity-updated`, it carries identifiers only.
- **Visibility (decision needed).** Identifiers reveal that a record changed, not what it contains, and clients read the record with their own permissions.
  - Default: send to every signed-in socket. This is what production updates do today.
  - Stricter option: send each change only to users who may view that model type. The gateway would map `modelType` to a view permission, using the permissions it already learns when it authenticates a socket.

## Client (`apps/web`)

- `shared/notifications/live-connection.ts`: handle `entities-changed`.
- `shared/api/cache-effects.ts`: `approvalDocuments` becomes the general `modelResources` table (model type to cache resources), shared by approvals and live changes.
- On a message, dispatch `api.util.invalidateTags` with `{resource, id}` and that resource's `LIST` for each known change. Only queries on screen are read again; the rest are marked stale and read when next opened.
- **Own saves.** Skip changes whose `by` is the current user within 5 seconds of one of their own successful saves; cache tags already refreshed those.
- **Unsaved edits.** A form being edited does not reload over the user's input. Forms keep their values and say "This record was changed by someone else" with a button to reload.

## Rollout

1. Backend behind `Realtime:EntityChanges:Enabled` (default off), deployed to the demo backend.
2. Gateway and client changes; the client handles the event's absence, so the order of deployment does not matter.
3. Turn the flag on for the testing site. Watch message rate, gateway CPU and refetch counts for a week, then decide about production.

## Effort

| Part | Estimate |
| --- | --- |
| Backend event, interceptor, aggregate map, tests | 1–1.5 days |
| Gateway relay and coalescing, tests | 0.5 day |
| Client invalidation, own-save suppression, form notice, tests | 0.5–1 day |
| Outbox (optional) | 0.5 day plus a migration |

## Decisions for the reviewer

1. May `oryx-backend` publish this event? It is additive and does not change behaviour for Oryx Next.
2. Visibility: every signed-in user (like production updates), or filtered by view permission?
3. Publish after save (simple), or only after commit through the outbox (needs a migration)?
