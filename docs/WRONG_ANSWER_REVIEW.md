# Wrong-answer review

The existing `wrong-answers.v1` key is retained. Legacy entries without a stage
or due date are stage zero and immediately due; their mistake counts are kept.

- A wrong submitted response is immediately due and resets the stage to zero.
- The first correct submitted response schedules the question 24 hours later.
- A correct response at or after that deadline graduates the question.
- Early correct responses do not advance the stage or move the deadline.
- Unanswered questions never change the queue.

The original handoff proposed both two successes and 1/3-day intervals. This
implementation chooses two successes separated by at least one day; it does
not add a third success requirement. Due dates use elapsed milliseconds, not
calendar midnight. The home page and review entry recheck the current time.

Wrong reasons use a separate, local `wrong-reasons.v1` key under the existing
path-specific storage prefix. Each question retains its latest reason, including
after graduation. Home statistics describe these per-question labels, not the
number of attempts. No study history or question-bank data is rewritten.

The review session selects only due questions, optionally filtered by Part.
Listening transcripts and accent tags are shown during review; the existing
playback/retry controls remain available. Pausing does not update the queue;
only submitting a test changes the spaced-review stage.
