"""Deterministic local-development seed data for the Fireflies Clone database.

Running this module replaces all records in the current schema with the same
five realistic meetings. It is intended for local development only.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.init_db import init_db
from app.db.models import (
    ActionItem,
    Meeting,
    Participant,
    Summary,
    SummaryTopic,
    TranscriptSegment,
    meeting_participants,
)
from app.db.session import SessionLocal


MEETING_SEEDS: list[dict[str, Any]] = [
    {
        "title": "Q3 Product Roadmap Review",
        "meeting_date": datetime(2026, 9, 2, 10, 0),
        "duration_seconds": 3600,
        "participants": ["Maya Chen", "Daniel Ortiz", "Priya Shah", "Sofia Martinez", "Noah Williams"],
        "summary": (
            "The team aligned on a focused Q3 roadmap: ship collaborative review in September, "
            "follow with transcript search improvements in October, and validate the analytics beta "
            "with a limited cohort before broad release. The main dependency is a reliable permissions model."
        ),
        "segments": [
            ("Maya Chen", "Thanks for joining. The goal today is to leave with a realistic Q3 sequence, not just a feature wish list."),
            ("Sofia Martinez", "From customer interviews, collaborative review is the clearest retention lever. Teams want managers to comment on a call before sharing a recap."),
            ("Daniel Ortiz", "Engineering can support that in September if we keep the first release to comments, mentions, and notifications. Shared workspaces can come later."),
            ("Priya Shah", "That scope also gives design room to make the review state obvious without redesigning the entire meeting page."),
            ("Noah Williams", "The permissions work is the risk. We should decide whether comments inherit meeting access or can be shared independently."),
            ("Maya Chen", "Let's keep comments tied to meeting access for v1. We can learn whether independent sharing is actually needed before adding another permission layer."),
            ("Sofia Martinez", "That will make the launch message cleaner. I can position it as a faster review loop for existing meeting collaborators."),
            ("Daniel Ortiz", "With that decision, the backend estimate is three weeks and the client work is about two. We need final interaction specs by next Friday."),
            ("Priya Shah", "I will run a short prototype test on Thursday. I especially want feedback on resolved comments and notification wording."),
            ("Noah Williams", "For October, transcript search can improve with speaker filters and exact timestamp links. The indexing pipeline is already capable of both."),
            ("Maya Chen", "Great. Let's treat search as the second milestone, with a small analytics beta running in parallel for ten design partners."),
            ("Sofia Martinez", "I have six likely beta customers already. I will ask customer success to nominate four more with active meeting volume."),
            ("Daniel Ortiz", "Analytics beta needs event definitions before implementation. Otherwise we will collect data that cannot answer the adoption questions."),
            ("Priya Shah", "I'll pair with Maya on the success metrics and make sure the beta dashboard does not look like a polished promise."),
            ("Maya Chen", "Perfect. We have a sequence: review collaboration, search upgrades, then a controlled analytics beta. I'll publish the roadmap notes today."),
        ],
        "topics": [
            ("Q3 priority", "Collaborative review is the first roadmap milestone because it addresses a clear retention need."),
            ("Scope and permissions", "Version one keeps comments within existing meeting access to avoid a new sharing model."),
            ("October initiatives", "Transcript search upgrades and a ten-customer analytics beta follow the September launch."),
        ],
        "actions": [
            ("Publish the updated Q3 roadmap and milestone dates.", "Maya Chen", True),
            ("Complete usability testing for the comment and resolution flow.", "Priya Shah", False),
            ("Recruit ten design partners for the analytics beta.", "Sofia Martinez", False),
        ],
    },
    {
        "title": "Payments Platform Sprint Planning",
        "meeting_date": datetime(2026, 9, 8, 9, 30),
        "duration_seconds": 3300,
        "participants": ["Daniel Ortiz", "Noah Williams", "Priya Shah", "Ethan Kim", "Maya Chen"],
        "summary": (
            "The payments team committed to retry visibility, webhook replay, and error-state cleanup for the next sprint. "
            "The checkout experiment was deferred until telemetry is reliable, and the team agreed to reserve capacity for production support."
        ),
        "segments": [
            ("Daniel Ortiz", "This sprint has to reduce support tickets around failed payment retries. We need a plan that helps both customers and on-call engineers."),
            ("Ethan Kim", "The data shows most confusion happens after a retry succeeds. Customers see the original failure but not the final state until they refresh."),
            ("Noah Williams", "We can expose a retry timeline in the payment detail view and add an event when the state settles. The service already records every attempt."),
            ("Priya Shah", "I want to separate temporary failures from terminal failures visually. If we use the same red state for both, the timeline will not build confidence."),
            ("Maya Chen", "What is the smallest useful slice we can ship? We should avoid rebuilding the entire payments console in one sprint."),
            ("Daniel Ortiz", "Timeline, current status, and a link to the related webhook payload. That covers the primary support workflow without changing checkout."),
            ("Noah Williams", "Webhook replay is a separate but small story. We need an audit trail and a guardrail so a customer cannot replay the same event repeatedly."),
            ("Ethan Kim", "Please include a replay event in analytics. We need to know whether users are fixing real delivery failures or experimenting."),
            ("Priya Shah", "For the error states, I can deliver designs by Wednesday. I will use plain language like 'retrying automatically' instead of raw gateway codes."),
            ("Daniel Ortiz", "Let's reserve two points for production support. The billing migration is still creating unpredictable questions for the on-call rotation."),
            ("Maya Chen", "Agreed. We will defer the checkout conversion experiment until the retry telemetry is in place and we can interpret the results."),
            ("Noah Williams", "The service changes are low risk, but I need one day from platform to review the idempotency behavior for replay."),
            ("Ethan Kim", "I will write the event specification today so engineering and analytics are working from the same definitions."),
            ("Priya Shah", "I will also add empty and loading states. Support agents often open these records before the retry worker has finished."),
            ("Daniel Ortiz", "Good. The sprint goal is clear: make payment recovery understandable and safely actionable, then measure the outcome."),
        ],
        "topics": [
            ("Retry visibility", "Show a clear payment timeline and final settlement state to reduce support confusion."),
            ("Webhook replay", "Provide controlled replay with an audit trail and idempotency review."),
            ("Sprint capacity", "Reserve support capacity and defer the checkout experiment until telemetry is dependable."),
        ],
        "actions": [
            ("Implement the payment retry timeline and final-state event.", "Noah Williams", False),
            ("Deliver error-state and loading-state designs for payment details.", "Priya Shah", False),
            ("Document analytics events for retries and webhook replays.", "Ethan Kim", True),
        ],
    },
    {
        "title": "Northstar Client Launch Check-in",
        "meeting_date": datetime(2026, 9, 12, 15, 0),
        "duration_seconds": 3000,
        "participants": ["Liam Brooks", "Ava Patel", "Maya Chen", "Daniel Ortiz"],
        "summary": (
            "The Northstar launch remains on track for September 28. The client needs a final attendee import, a focused admin training, "
            "and confirmation of SSO testing. The team agreed to use a limited pilot group before enabling the workspace company-wide."
        ),
        "segments": [
            ("Liam Brooks", "Northstar confirmed their executive sponsor is comfortable with the September 28 target, but they want the first week to feel tightly managed."),
            ("Ava Patel", "That matches my conversation with their operations lead. They asked for a pilot of twenty-five users before we open access to the full workspace."),
            ("Maya Chen", "A pilot is sensible. Are there any product gaps that would prevent those users from recording, finding, and sharing their meetings?"),
            ("Daniel Ortiz", "The only technical dependency is their SSO certificate rotation. We have the metadata, but we need their identity team to complete the test sign-in."),
            ("Liam Brooks", "I can escalate that with their project manager. They are also asking whether we can import their existing executive attendee list."),
            ("Ava Patel", "We can do a one-time CSV import if they provide names and work emails in the approved format. I will send them a template today."),
            ("Maya Chen", "For the admin training, let's keep it practical: workspace settings, sharing permissions, and how to find the first meeting recap."),
            ("Daniel Ortiz", "I would like a technical dry run after SSO is complete. That gives us time to catch provisioning issues before the pilot users arrive."),
            ("Liam Brooks", "The sponsor also asked for success criteria. I suggested weekly active users, recorded meetings, and the number of summaries shared internally."),
            ("Ava Patel", "Those are good. I will add a qualitative check-in after week one so we learn whether managers trust the notes and action items."),
            ("Maya Chen", "Let's make the pilot feel like a supported launch, not a test they have to manage alone. A short office hour would help."),
            ("Daniel Ortiz", "No technical objection. We can monitor SSO logs and workspace creation during the office hour."),
            ("Liam Brooks", "I will confirm the pilot names, final attendee import, and SSO owner by Friday. That keeps the September 28 date realistic."),
            ("Ava Patel", "I will draft the launch checklist with owners and include the office-hour invitation in the welcome message."),
            ("Maya Chen", "Excellent. We have a clear path: validate SSO, import attendees, train admins, then support a focused pilot before expansion."),
        ],
        "topics": [
            ("Pilot launch", "Northstar will begin with twenty-five users before enabling the full workspace."),
            ("SSO and data import", "Certificate testing and a one-time attendee CSV import are the remaining technical launch dependencies."),
            ("Adoption support", "Admin training, office hours, and shared success criteria will guide the first launch week."),
        ],
        "actions": [
            ("Send Northstar the approved attendee-import template.", "Ava Patel", True),
            ("Confirm the SSO testing owner and completion date.", "Liam Brooks", False),
            ("Schedule a technical SSO dry run after test sign-in succeeds.", "Daniel Ortiz", False),
        ],
    },
    {
        "title": "Acquisition Campaign Strategy",
        "meeting_date": datetime(2026, 9, 17, 11, 0),
        "duration_seconds": 2700,
        "participants": ["Sofia Martinez", "Maya Chen", "Liam Brooks", "Priya Shah"],
        "summary": (
            "Marketing chose a manager-focused acquisition campaign centered on turning messy meetings into accountable follow-through. "
            "The team will test two landing-page messages, pair them with customer proof, and use sales feedback to qualify campaign leads."
        ),
        "segments": [
            ("Sofia Martinez", "The campaign needs one sharp promise. Our strongest message is not recording meetings; it is helping managers turn conversations into accountable follow-through."),
            ("Maya Chen", "I agree, but we should ground that in a concrete product moment. The summary and action-item view make the promise believable."),
            ("Liam Brooks", "Sales hears a related pain from operations leaders. They lose decisions in long calls, then spend the next week asking who owns what."),
            ("Priya Shah", "Visually, we can show a before-and-after story: a noisy transcript on one side and a concise recap with owners on the other."),
            ("Sofia Martinez", "I want to test two headlines. One is about fewer follow-up meetings; the other is about making every decision visible."),
            ("Maya Chen", "Let's avoid promising perfect accuracy. We can say the product helps teams capture and review decisions, which is both strong and honest."),
            ("Liam Brooks", "For proof, I can ask two customers for short quotes. A quote from a manager will resonate more than a generic productivity statistic."),
            ("Priya Shah", "The landing page should make the workflow obvious before asking for a demo. I will keep the interaction lightweight and mobile-safe."),
            ("Sofia Martinez", "Channel mix will be LinkedIn, retargeting, and our newsletter. We will not spread budget into search until we know which message converts."),
            ("Maya Chen", "Can we connect the campaign to product activation? A lead should see an example recap within the first session, not only marketing copy."),
            ("Liam Brooks", "Yes. Sales can use a demo workspace with a sample leadership meeting, then tailor the conversation to the prospect's meeting habits."),
            ("Priya Shah", "I will create a small illustration set for the campaign rather than relying on screenshots that are difficult to read at ad size."),
            ("Sofia Martinez", "Success will be qualified demo requests, not raw clicks. We should review lead quality twice a week while the test is live."),
            ("Maya Chen", "Let's run the first test for two weeks, then make a decision with conversion, activation, and sales feedback together."),
            ("Sofia Martinez", "Done. I will write the brief today and bring the two message variants back for review before creative production starts."),
        ],
        "topics": [
            ("Campaign promise", "Position the product as a way to turn conversations into visible decisions and owned follow-through."),
            ("Creative experiment", "Test two manager-focused messages with customer proof and a clear recap-to-action workflow."),
            ("Measurement", "Optimize for qualified demo requests, activation signals, and sales feedback rather than click volume."),
        ],
        "actions": [
            ("Write the campaign brief and two landing-page message variants.", "Sofia Martinez", False),
            ("Request manager-focused customer quotes for campaign proof.", "Liam Brooks", False),
            ("Create the before-and-after recap illustration set.", "Priya Shah", True),
        ],
    },
    {
        "title": "Engineering Team Retrospective",
        "meeting_date": datetime(2026, 9, 24, 16, 0),
        "duration_seconds": 2400,
        "participants": ["Daniel Ortiz", "Noah Williams", "Ethan Kim", "Priya Shah"],
        "summary": (
            "The engineering team identified unclear ownership during incident response and late design feedback as the main sources of friction. "
            "They agreed to rotate an incident coordinator, introduce earlier design checkpoints, and protect a weekly reliability improvement block."
        ),
        "segments": [
            ("Daniel Ortiz", "Let's focus on what changed our throughput this sprint. We shipped the planned work, but the incident on Tuesday created more stress than it should have."),
            ("Noah Williams", "The technical fix was straightforward. The difficult part was deciding who was coordinating updates while three people investigated separate symptoms."),
            ("Ethan Kim", "From my side, the metrics dashboard was useful, but I did not know whether to post findings in the incident channel or wait for an engineer to ask."),
            ("Priya Shah", "I saw a similar gap on the design review. I received final feedback after implementation had started, which turned a small copy change into rework."),
            ("Daniel Ortiz", "So we have two ownership issues: incident coordination and decision timing. Both are process problems we can address without adding meetings."),
            ("Noah Williams", "For incidents, a rotating coordinator would help. That person does not need to fix the issue; they keep the timeline, updates, and handoffs clear."),
            ("Ethan Kim", "I can add a compact dashboard link to the incident template. It would give the coordinator a shared source for error rate and recovery status."),
            ("Priya Shah", "For design, I would like a fifteen-minute checkpoint before implementation starts on anything that changes a customer-facing workflow."),
            ("Daniel Ortiz", "That is reasonable. We can use the existing planning session and add a checklist instead of scheduling another recurring review."),
            ("Noah Williams", "The other issue is reliability work slipping behind features. Small cleanup tasks keep getting deferred because they are hard to connect to a launch."),
            ("Ethan Kim", "We can make that visible by tracking error-budget risk and support volume. A weekly block would be easier to defend with those signals."),
            ("Priya Shah", "I support that as long as design can see the reliability priorities too. It helps us avoid introducing complexity into already fragile areas."),
            ("Daniel Ortiz", "Let's reserve Friday afternoon for reliability improvements, starting with the alert noise and the checkout retry runbook."),
            ("Noah Williams", "I will draft the incident coordinator rotation and run a short practice during next week's on-call handoff."),
            ("Daniel Ortiz", "Good retrospective. We are leaving with specific changes: clearer coordination, earlier design decisions, and protected reliability time."),
        ],
        "topics": [
            ("Incident coordination", "Introduce a rotating coordinator to manage updates, timelines, and handoffs during incidents."),
            ("Earlier design input", "Add a short workflow checkpoint before implementation begins on customer-facing changes."),
            ("Reliability capacity", "Reserve weekly time for alert quality, runbooks, and risk-reduction work."),
        ],
        "actions": [
            ("Draft the rotating incident coordinator guide and schedule.", "Noah Williams", False),
            ("Add dashboard links and ownership prompts to the incident template.", "Ethan Kim", True),
            ("Add a design checkpoint checklist to sprint planning.", "Priya Shah", False),
        ],
    },
]


def make_transcript_segments(
    meeting: Meeting, duration_seconds: int, segment_specs: list[tuple[str, str]]
) -> list[TranscriptSegment]:
    """Spread fixed transcript dialogue across a meeting's duration in chronological order."""
    last_start = duration_seconds - 120
    interval = last_start / (len(segment_specs) - 1)

    return [
        TranscriptSegment(
            meeting=meeting,
            speaker=speaker,
            start_time=round(index * interval, 1),
            end_time=round(index * interval + 72, 1),
            text=text,
        )
        for index, (speaker, text) in enumerate(segment_specs)
    ]


def clear_existing_data(session: Session) -> None:
    """Remove current development data in dependency order before rebuilding it."""
    session.execute(delete(ActionItem))
    session.execute(delete(SummaryTopic))
    session.execute(delete(Summary))
    session.execute(delete(TranscriptSegment))
    session.execute(delete(meeting_participants))
    session.execute(delete(Meeting))
    session.execute(delete(Participant))


def seed_database() -> dict[str, int]:
    """Rebuild the deterministic local seed dataset and return table counts."""
    init_db()

    with SessionLocal.begin() as session:
        clear_existing_data(session)

        participant_names = sorted(
            {name for meeting_seed in MEETING_SEEDS for name in meeting_seed["participants"]}
        )
        participants_by_name = {
            name: Participant(name=name) for name in participant_names
        }
        session.add_all(participants_by_name.values())

        for meeting_seed in MEETING_SEEDS:
            meeting = Meeting(
                title=meeting_seed["title"],
                meeting_date=meeting_seed["meeting_date"],
                duration_seconds=meeting_seed["duration_seconds"],
            )
            meeting.participants = [
                participants_by_name[name] for name in meeting_seed["participants"]
            ]
            session.add(meeting)
            session.add_all(
                make_transcript_segments(
                    meeting, meeting_seed["duration_seconds"], meeting_seed["segments"]
                )
            )
            session.add(Summary(meeting=meeting, summary_text=meeting_seed["summary"]))
            session.add_all(
                SummaryTopic(meeting=meeting, title=title, description=description, position=position)
                for position, (title, description) in enumerate(meeting_seed["topics"])
            )
            session.add_all(
                ActionItem(meeting=meeting, task=task, assignee=assignee, completed=completed)
                for task, assignee, completed in meeting_seed["actions"]
            )

    return verify_seed_data()


def verify_seed_data() -> dict[str, int]:
    """Validate required related data and return stable counts for the seed dataset."""
    with SessionLocal() as session:
        meetings = session.scalars(select(Meeting).order_by(Meeting.id)).all()
        if len(meetings) != len(MEETING_SEEDS):
            raise RuntimeError("Seed verification failed: unexpected meeting count.")

        for meeting in meetings:
            speakers = {segment.speaker for segment in meeting.transcript_segments}
            participant_names = {participant.name for participant in meeting.participants}
            ordered_segments = sorted(meeting.transcript_segments, key=lambda segment: segment.start_time)

            if not meeting.participants or not meeting.summary or not meeting.summary_topics or not meeting.action_items:
                raise RuntimeError(f"Seed verification failed: missing related data for '{meeting.title}'.")
            if len(meeting.transcript_segments) < 15:
                raise RuntimeError(f"Seed verification failed: transcript is too short for '{meeting.title}'.")
            if not speakers.issubset(participant_names):
                raise RuntimeError(f"Seed verification failed: unknown speaker in '{meeting.title}'.")
            if ordered_segments[0].start_time > 1:
                raise RuntimeError(f"Seed verification failed: transcript does not start near zero for '{meeting.title}'.")
            if any(
                segment.start_time < 0
                or segment.end_time <= segment.start_time
                or segment.end_time > meeting.duration_seconds
                for segment in ordered_segments
            ):
                raise RuntimeError(f"Seed verification failed: invalid timestamps for '{meeting.title}'.")
            if any(
                later.start_time < earlier.end_time
                for earlier, later in zip(ordered_segments, ordered_segments[1:])
            ):
                raise RuntimeError(f"Seed verification failed: overlapping transcript timestamps for '{meeting.title}'.")

        orphan_counts = {
            "transcript_segments": session.scalar(
                select(func.count()).select_from(TranscriptSegment).where(
                    ~TranscriptSegment.meeting.has()
                )
            ),
            "summaries": session.scalar(
                select(func.count()).select_from(Summary).where(~Summary.meeting.has())
            ),
            "summary_topics": session.scalar(
                select(func.count()).select_from(SummaryTopic).where(~SummaryTopic.meeting.has())
            ),
            "action_items": session.scalar(
                select(func.count()).select_from(ActionItem).where(~ActionItem.meeting.has())
            ),
            "meeting_participants": session.scalar(
                select(func.count())
                .select_from(meeting_participants)
                .where(
                    (~meeting_participants.c.meeting_id.in_(select(Meeting.id)))
                    | (~meeting_participants.c.participant_id.in_(select(Participant.id)))
                )
            ),
        }
        if any(orphan_counts.values()):
            raise RuntimeError(f"Seed verification failed: orphaned records found: {orphan_counts}")

        return {
            "meetings": len(meetings),
            "participants": session.scalar(select(func.count()).select_from(Participant)) or 0,
            "meeting_participants": session.scalar(select(func.count()).select_from(meeting_participants)) or 0,
            "transcript_segments": session.scalar(select(func.count()).select_from(TranscriptSegment)) or 0,
            "summaries": session.scalar(select(func.count()).select_from(Summary)) or 0,
            "summary_topics": session.scalar(select(func.count()).select_from(SummaryTopic)) or 0,
            "action_items": session.scalar(select(func.count()).select_from(ActionItem)) or 0,
        }


if __name__ == "__main__":
    counts = seed_database()
    print("Seed data created successfully.")
    for table_name, count in counts.items():
        print(f"{table_name}: {count}")
