/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { EventType, type MatrixEvent, type Relations, RelationType } from "matrix-js-sdk/src/matrix";

import { useMatrixClientContext } from "../../../contexts/MatrixClientContext";
import dis from "../../../dispatcher/dispatcher";

interface Props {
    mxEvent: MatrixEvent;
    reactions?: Relations | null;
}

/**
 * Renders clickable reaction chips for bot-suggested reactions.
 * Reads `com.myorg.suggested_reactions` from event content; renders nothing if absent or invalid.
 * Hidden once the current user has sent any of the suggested reactions.
 */
export function SuggestedReactions({ mxEvent, reactions }: Readonly<Props>): React.JSX.Element | null {
    const client = useMatrixClientContext();

    const suggestions: unknown = mxEvent.getContent()["com.myorg.suggested_reactions"];

    if (
        !Array.isArray(suggestions) ||
        suggestions.length === 0 ||
        !suggestions.every((s): s is string => typeof s === "string")
    ) {
        return null;
    }

    // Hide if user already sent any suggested reaction
    if (reactions) {
        const myUserId = client.getUserId();
        const events = reactions.getRelations();
        const userReacted = events.some((ev) => {
            const key = ev.getRelation()?.key;
            return ev.getSender() === myUserId && key != null && suggestions.includes(key);
        });
        if (userReacted) return null;
    }

    const handleClick = (key: string): void => {
        const roomId = mxEvent.getRoomId();
        const eventId = mxEvent.getId();
        if (!roomId || !eventId) return;

        client.sendEvent(roomId, EventType.Reaction, {
            "m.relates_to": {
                rel_type: RelationType.Annotation,
                event_id: eventId,
                key,
            },
        });
        dis.dispatch({ action: "message_sent" });
    };

    return (
        <div className="mx_SuggestedReactions">
            {suggestions.map((key) => (
                <button
                    key={key}
                    className="mx_SuggestedReactions_button"
                    onClick={() => handleClick(key)}
                    aria-label={key}
                >
                    {key}
                </button>
            ))}
        </div>
    );
}
