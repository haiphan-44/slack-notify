"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackMessageColor = void 0;
/**
 * Enum for Slack message attachment colors
 * These colors are used to visually distinguish different PR states in Slack messages
 */
var SlackMessageColor;
(function (SlackMessageColor) {
    /** Yellow/Gold color for open PRs */
    SlackMessageColor["OPEN"] = "#ffe066";
    /** Purple color for merged PRs */
    SlackMessageColor["MERGED"] = "#6f42c1";
    /** Red color for closed PRs */
    SlackMessageColor["CLOSED"] = "#FF0000";
    /** Light green color for approved PRs */
    SlackMessageColor["APPROVED"] = "#99FF99";
})(SlackMessageColor || (exports.SlackMessageColor = SlackMessageColor = {}));
