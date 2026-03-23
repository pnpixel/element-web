/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { EventType, type MatrixEvent, RelationType } from "matrix-js-sdk/src/matrix";

import { useMatrixClientContext } from "../../../contexts/MatrixClientContext";
import dis from "../../../dispatcher/dispatcher";

interface Props {
    mxEvent: MatrixEvent;
}

/**
 * Renders clickable reaction chips for bot-suggested reactions.
 * Reads `com.myorg.suggested_reactions` from event content; renders nothing if absent or invalid.
 */
export function SuggestedReactions({ mxEvent }: Readonly<Props>): React.JSX.Element | null {
    const client = useMatrixClientContext();

    const suggestions: unknown = mxEvent.getContent()["com.myorg.suggested_reactions"];

    if (
        !Array.isArray(suggestions) ||
        suggestions.length === 0 ||
        !suggestions.every((s): s is string => typeof s === "string")
    ) {
        return null;
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
