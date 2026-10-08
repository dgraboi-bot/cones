# Deferred Receiver PASS Feature

Recorded: 2026-10-08

Status: Deferred. No PASS feature code has been implemented. Revisit when there
is time for coordinated trial-flow and data-saving regression tests. The user
requested an assessment and chose to defer rather than risk the working flow.

## Purpose

Allow a telepathy Receiver who has no impression of the target to request a new
target without guessing. A passed trial must not count as a hit or miss.

## Requested Behavior

1. Add a standard PASS button to the Receiver's "Press here when done receiving."
   screen, before the alternatives are shown.
2. Pressing PASS returns the Receiver to "Press when ready to receive."
3. The Sender sees the usual target on the left and PASS as the Receiver's
   response on the right, with an OK button. Do not style PASS as a hit or miss.
4. Pressing OK returns the Sender to "Waiting for the receiver to be ready..."
5. A new target is selected for the next trial using the normal random selection
   procedure; it need not differ from the previous target.
6. No saved trial-response data is added for the passed trial during actual
   practice. Completed scored trials retain their existing saving behavior.

The requested Receiver tour message for this frame is:

"After you have had enough time to inspect and remember the contents of your
mind's eye, tap \"Press here...\" to say you are ready to choose between the
alternatives. Or if you feel you have no idea what the target was, push the
\"PASS\" switch to signal that you would like a new target. A \"PASS\" is not
counted as a hit or miss."

## Scope and Decisions Before Implementation

- The proposal concerns telepathy Receiver practice and the corresponding Sender
  display, including guided tours and Robot partners. Clairvoyance behavior is
  not specified and should remain unchanged unless separately requested.
- PASS must only be available before alternatives or the correct answer are
  revealed. It must not permit discarding a known incorrect response.
- Recommendation, not yet approved: show an aggregate pass count in reports so
  users can interpret performance calculated only from answered trials. Resolve
  how to retain that count without saving passed trial-response records before
  implementation; do not silently introduce new data retention.
- Decide how a Receiver readiness click made before the Sender acknowledges PASS
  is handled. Neither device should start a new round before the previous round
  has been safely resolved.
- Decide whether the Robot Receiver ever passes in the Sender tour or practice.
  A human Receiver passing with a Robot Sender should not require a human Sender
  acknowledgement.

## Implementation Considerations

This is not only a UI change. Add an explicit pass outcome and coordinate both
devices, the Sender acknowledgement, readiness for the next round, and saving
suppression. Human-partner sessions and local Robot simulations have different
state paths and must both be handled.

Relevant starting points in `telepathy.js`:

- `submitReceiverGuessAndReveal`: handles answers and locally simulated results.
- `appendTrialServerRecord`: appends saved trial records.
- `submitPostRoundChoice` and `clearPostRound`: coordinate continuation and ending.
- Sender post-round rendering and the guided Receiver/Sender tour steps.

Relevant starting points in `api.php`:

- `submit_guess`, post-round state handling, and `append_trial_record`.
- Session round lifecycle and trial-record validation.

Do not implement PASS as a fake guess or reuse "enough"/"another" without a
distinct outcome. Suppress saving on every relevant client and server path,
including retries, timeouts, and delayed synchronization.

## Required Verification

1. Test a human Receiver with a human Sender in two independent browser contexts
   for all four exercises, including repeated passes and a scored trial afterward.
2. Verify the PASS screen, Sender OK acknowledgement, readiness coordination,
   and normal new-target selection.
3. Test a human Receiver with a Robot Sender, plus both guided tours and any
   approved Robot Receiver behavior.
4. Confirm passed trials add no saved trial-response records and change neither
   hit/miss counts nor the denominator used for scored-trial performance.
5. Confirm PASS cannot be invoked after alternatives/reveal, by keyboard,
   double-click, delayed event, or repeated request.
6. Test ending/back navigation, partner disconnection, timeout, reconnect, and
   stale requests while a pass is awaiting acknowledgement.
7. Verify normal answered trials, saving preferences, feedback, and session
   continuation remain unchanged; check narrow-screen touch and keyboard input.

Use Playwright for the coordinated browser tests and global debug traces for
state transitions. Schedule this as a separate tested feature, not a quick
addition to a text-only release.
