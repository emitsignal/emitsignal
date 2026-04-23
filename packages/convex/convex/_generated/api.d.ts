/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_pushNotifications from "../actions/pushNotifications.js";
import type * as mutations_messages from "../mutations/messages.js";
import type * as mutations_subscriptions from "../mutations/subscriptions.js";
import type * as mutations_topics from "../mutations/topics.js";
import type * as queries_messages from "../queries/messages.js";
import type * as queries_subscriptions from "../queries/subscriptions.js";
import type * as queries_topics from "../queries/topics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/pushNotifications": typeof actions_pushNotifications;
  "mutations/messages": typeof mutations_messages;
  "mutations/subscriptions": typeof mutations_subscriptions;
  "mutations/topics": typeof mutations_topics;
  "queries/messages": typeof queries_messages;
  "queries/subscriptions": typeof queries_subscriptions;
  "queries/topics": typeof queries_topics;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
