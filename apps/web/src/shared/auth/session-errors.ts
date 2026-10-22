export type SessionFailure = "credentials" | "disabled" | "throttled" | "server" | "network" | "invalid-response" | "storage";

const failureMessages: Record<SessionFailure, string> = {
  storage: "Could not read or keep your sign-in securely on this desktop. Try again before closing Oryx.",
  credentials: "The email or password is incorrect.",
  disabled: "This account is disabled. Contact your administrator.",
  throttled: "Too many sign-in attempts. Wait a minute and try again.",
  server: "The customer server could not complete the request. Try again shortly.",
  network: "Cannot reach the customer server. Check the connection and try again.",
  "invalid-response": "The customer server returned an invalid session.",
};

export class SessionRequestError extends Error {
  constructor(
    readonly reason: SessionFailure,
    readonly status: number,
  ) {
    super(failureMessages[reason]);
    this.name = "SessionRequestError";
  }
}
