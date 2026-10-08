"use client";

import { useCallback, useState } from "react";
import { MediaPlayer } from "./MediaPlayer";
import { Transcript } from "./Transcript";

type MeetingPlaybackProps = {
  durationSeconds: number;
  meetingId: number;
};

export function MeetingPlayback({ durationSeconds, meetingId }: MeetingPlaybackProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTimeChange = useCallback((nextTime: number) => {
    setCurrentTime(nextTime);
  }, []);

  return (
    <>
      <MediaPlayer
        currentTime={currentTime}
        durationSeconds={durationSeconds}
        isPlaying={isPlaying}
        onPlayingChange={setIsPlaying}
        onTimeChange={handleTimeChange}
      />
      <Transcript
        currentTime={currentTime}
        meetingId={meetingId}
        onSegmentSelect={handleTimeChange}
      />
    </>
  );
}
