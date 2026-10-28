import { CompanionMood } from "../contract";
export enum Clip { Idle, Blink, LookLeft, LookRight, HeadTilt, Stretch, WalkRight, WalkLeft, Greeting, HappyHop, Notification, Urgent, Focus, Offline, Error }
export interface AnimationClip { frames: readonly number[]; seconds: number; loop: boolean }
/** Painted key poses with procedural in-between movement; no runtime generation or remote assets. */
export const clips: Record<Clip, AnimationClip> = {
  [Clip.Idle]: { frames: [0], seconds: 3.2, loop: true },
  [Clip.Blink]: { frames: [0, 1, 1, 0], seconds: .2, loop: false },
  [Clip.LookLeft]: { frames: [0, 2, 2, 0], seconds: .6, loop: false },
  [Clip.LookRight]: { frames: [0, 3, 3, 0], seconds: .6, loop: false },
  [Clip.HeadTilt]: { frames: [0, 4, 4, 0], seconds: 1, loop: false },
  [Clip.Stretch]: { frames: [0, 6, 6, 0], seconds: 1.4, loop: false },
  [Clip.WalkRight]: { frames: [8, 9], seconds: .8, loop: true },
  [Clip.WalkLeft]: { frames: [10, 11], seconds: .8, loop: true },
  [Clip.Greeting]: { frames: [0, 6, 6, 5], seconds: .7, loop: false },
  [Clip.HappyHop]: { frames: [5, 7, 7, 5], seconds: .8, loop: false },
  [Clip.Notification]: { frames: [0, 12, 12, 0], seconds: .8, loop: false },
  [Clip.Urgent]: { frames: [12, 12, 4, 12], seconds: 1, loop: true },
  [Clip.Focus]: { frames: [13], seconds: 2, loop: true },
  [Clip.Offline]: { frames: [15], seconds: 1, loop: true },
  [Clip.Error]: { frames: [4, 15, 4], seconds: .9, loop: false },
};
export function moodClip(mood: CompanionMood): Clip {
  switch (mood) {
    case CompanionMood.Alert: return Clip.Notification;
    case CompanionMood.Curious: case CompanionMood.Thinking: return Clip.HeadTilt;
    case CompanionMood.Happy: return Clip.HappyHop;
    case CompanionMood.Focused: return Clip.Focus;
    case CompanionMood.Disconnected: return Clip.Offline;
    case CompanionMood.Error: return Clip.Error;
    default: return Clip.Idle;
  }
}
