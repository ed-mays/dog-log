# Brief: Incident Capture

> Status: draft · Owner: Ed Mays · Created: 2026-05-01

## Problem

When a pet has a medical emergency — a seizure, a sudden collapse, a fight wound, a choking episode — the caregiver is the first responder, alone, often at 2am. Critical information (when it started, how long it lasted, severity, what they observed, whether it's getting worse) exists only in the caregiver's head for the duration of the event, and erodes the moment the event ends. The information that matters most to a vet later is the information hardest to capture in the moment.

## Who feels it

Caregivers of pets with chronic conditions (epilepsy, cardiac, allergies) or any pet during a one-off emergency. The acute persona is a single caregiver mid-event with one free hand, possibly in the dark, possibly distressed. They are not a clinician and they are not "logging data" — they are trying to help their animal and remember enough to tell the vet.

## Today's workaround

The caregiver fumbles between four to six tools: phone unlock, stopwatch app, notes app, contacts app to call the vet, sometimes a paper notepad. Each context switch costs attention and time. Most observations are never written down — they're recalled hours later from memory, which is unreliable for duration, sequence, and subjective severity. After the event the caregiver often intends to "write it up properly later" and never does.

## Desired outcome

One persistent surface the caregiver can reach in one tap, that captures elapsed time automatically, accepts severity and observations with single taps, puts the vet's phone number one tap away, and accepts free-text journaling without ever requiring it. The same surface stays open through the event and remains fully editable afterward, indefinitely. Capture speed beats data quality; an empty entry with just a timer is a valid entry.

## Non-goals

- A "drafts inbox" or unfinished-entry workflow.
- Reminders, nags, streaks, or "X days since last incident" framing.
- Required fields of any kind during capture.
- Voice dictation in v1.
- Native iOS, Apple Watch, Siri Shortcuts, or any platform leap beyond the existing PWA-shaped web app.
- A confirmation countdown on emergency activation in v1.

## Success signal

The original user — who lived through caring for an epileptic dog and built this from that experience — would have used this surface during a seizure instead of their stopwatch + notes + contacts juggling act. A secondary signal: a caregiver can produce a vet-ready summary of an event from app data alone, without relying on memory.

## Source material

- `~/.claude/projects/-Users-edmays-src-dog-log/memory/feedback_dog_log_design_model.md` — primary source for product constraints and user mental model.
- Wireframes: `~/.gstack/projects/ed-mays-dog-log/designs/pet-details-20260430-220703/wireframe-v3-incident.html`, `wireframe-v4-incident-types.html` — referenced by the spec/design phases, not the brief.
