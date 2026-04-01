/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { EventType, type MatrixEvent, type Relations, RelationType } from "matrix-js-sdk/src/matrix";

import { useMatrixClientContext } from "../../../contexts/MatrixClientContext";
import dis from "../../../dispatcher/dispatcher";

interface SuggestedReaction {
    emoji: string;
    label?: string;
}

interface Props {
    mxEvent: MatrixEvent;
    reactions?: Relations | null;
}

/** Parse a single entry: either a plain string or {emoji, label?}. */
function parseSuggestion(raw: unknown): SuggestedReaction | null {
    if (typeof raw === "string") return { emoji: raw };
    if (
        typeof raw === "object" &&
        raw !== null &&
        "emoji" in raw &&
        typeof (raw as Record<string, unknown>).emoji === "string"
    ) {
        const obj = raw as Record<string, unknown>;
        return { emoji: obj.emoji as string, label: typeof obj.label === "string" ? obj.label : undefined };
    }
    return null;
}

/**
 * Renders clickable reaction chips for bot-suggested reactions.
 * Reads `com.myorg.suggested_reactions` from event content; renders nothing if absent or invalid.
 * Each entry is either a plain emoji string or `{emoji, label?}`.
 * Hidden once the current user has sent any of the suggested reactions.
 */
export function SuggestedReactions({ mxEvent, reactions }: Readonly<Props>): React.JSX.Element | null {
    const client = useMatrixClientContext();

    const raw: unknown = mxEvent.getContent()["com.myorg.suggested_reactions"];
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const suggestions = raw.map(parseSuggestion).filter((s): s is SuggestedReaction => s !== null);
    if (suggestions.length === 0) return null;

    const emojiKeys = suggestions.map((s) => s.emoji);

    // Hide if user already sent any suggested reaction
    if (reactions) {
        const myUserId = client.getUserId();
        const events = reactions.getRelations();
        const userReacted = events.some((ev) => {
            const key = ev.getRelation()?.key;
            return ev.getSender() === myUserId && key != null && emojiKeys.includes(key);
        });
        if (userReacted) return null;
    }

    const handleClick = (emoji: string): void => {
        const roomId = mxEvent.getRoomId();
        const eventId = mxEvent.getId();
        if (!roomId || !eventId) return;

        client.sendEvent(roomId, EventType.Reaction, {
            "m.relates_to": {
                rel_type: RelationType.Annotation,
                event_id: eventId,
                key: emoji,
            },
        });
        dis.dispatch({ action: "message_sent" });
    };

    return (
        <div className="mx_SuggestedReactions">
            {suggestions.map((s) => (
                <button
                    key={s.emoji}
                    className="mx_SuggestedReactions_button"
                    onClick={() => handleClick(s.emoji)}
                    aria-label={s.label ?? s.emoji}
                >
                    <span className="mx_SuggestedReactions_emoji">{s.emoji}</span>
                    {s.label && <span className="mx_SuggestedReactions_label">{s.label}</span>}
                </button>
            ))}
        </div>
    );
}
