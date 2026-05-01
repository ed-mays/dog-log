# Brief: Incident Capture

> Status: draft · Owner: Ed Mays · Created: 2026-05-01

## Problem

When a pet has a medical emergency — a seizure, a sudden collapse, a fight wound, a choking episode — the caregiver is the first responder, alone, often at 2am. Critical information (when it started, how long it lasted, severity, what they observed, whether it's getting worse) exists only in the caregiver's head for the duration of the event, and erodes the moment the event ends.

## Who feels it

Caregivers of pets with chronic conditions (epilepsy, cardiac, anaphylaxis-prone) or any pet during a one-off emergency. The acute persona is a single caregiver mid-event with one free hand, possibly in the dark, possibly distressed. They are not a clinician and they are not "logging data" — they are trying to help their animal and remember enough to tell the vet.

## Today's workaround

The caregiver fumbles between several tools: phone unlock, stopwatch app, notes app, contacts app to call the vet, sometimes a paper notepad. Each context switch costs attention and time. Most observations are never written down — they're recalled hours later from memory, which is unreliable for duration, sequence, and subjective severity. After the event the caregiver often intends to "write it up properly later" and never does.

## Desired outcome

One persistent surface the caregiver can reach without navigating, that captures elapsed time automatically, accepts severity and observations with minimal interaction cost, makes the vet's phone reachable from the same surface, and accepts free-text journaling without ever requiring it. The same surface stays open through the event and remains fully editable afterward, indefinitely. Capture speed beats data quality; an empty entry with just a timer is a valid entry, and no field is ever required.

## Non-goals

- A "drafts inbox" or unfinished-entry workflow.
- Reminders, nags, streaks, or "X days since last incident" framing.
- Native iOS, Apple Watch, Siri Shortcuts, or any platform leap beyond the existing PWA-shaped web app.

(UX-detail scoping decisions — voice dictation, activation-confirmation countdown, etc. — live in `01-spec.md` §7 where they have context.)

## Success signal

I — having lived through caring for an epileptic dog and building this from that experience — would have used this surface during a seizure instead of my stopwatch + notes + contacts juggling act. A secondary signal: a caregiver can produce a vet-ready summary of an event from app data alone, without relying on memory.

## Failure signal

We'd know we got this wrong if caregivers open the surface during an incident but still fall back to their stopwatch / notes / contacts apps mid-event, or if entries created during incidents are systematically deleted or abandoned afterward (suggesting the surface captured the wrong things, or trapped them in a format that didn't help later).

## Source material

- `~/.claude/projects/-Users-edmays-src-dog-log/memory/feedback_dog_log_design_model.md` — primary source for product constraints and user mental model.
- Wireframes: `~/.gstack/projects/ed-mays-dog-log/designs/pet-details-20260430-220703/wireframe-v3-incident.html`, `wireframe-v4-incident-types.html` — referenced by the spec/design phases, not the brief.
