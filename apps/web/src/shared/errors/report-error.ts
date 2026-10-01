export type ErrorReporter = (error: Error, area: string) => void;

let reporter: ErrorReporter = (error, area) => { console.error(`Oryx ${area} error`, error); };

export function setErrorReporter(next: ErrorReporter): void { reporter = next; }
export function reportApplicationError(error: Error, area: string): void { reporter(error, area); }
