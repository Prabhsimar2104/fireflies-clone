"use client";

import { useEffect } from "react";
import { formatTimestamp } from "../lib/meetingFormatters";
import styles from "./MediaPlayer.module.css";

type MediaPlayerProps = {
  currentTime: number;
  durationSeconds: number;
  isPlaying: boolean;
  onPlayingChange: (isPlaying: boolean) => void;
  onTimeChange: (time: number) => void;
};

function PlayIcon({ isPlaying }: { isPlaying: boolean }) {
  return isPlaying ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14M16 5v14" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 11 7-11 7Z" />
    </svg>
  );
}

export function MediaPlayer({
  currentTime,
  durationSeconds,
  isPlaying,
  onPlayingChange,
  onTimeChange,
}: MediaPlayerProps) {
  const duration = Math.max(0, Math.floor(durationSeconds));
  const displayedTime = Math.min(Math.max(currentTime, 0), duration);
  const progress = duration === 0 ? 0 : (displayedTime / duration) * 100;

  useEffect(() => {
    if (!isPlaying || duration === 0) return;

    const timer = window.setTimeout(() => {
      const nextTime = Math.min(displayedTime + 1, duration);
      onTimeChange(nextTime);
      if (nextTime >= duration) onPlayingChange(false);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [displayedTime, duration, isPlaying, onPlayingChange, onTimeChange]);

  const handleSeek = (value: string) => {
    const nextTime = Number(value);
    if (Number.isFinite(nextTime)) {
      const clampedTime = Math.min(Math.max(nextTime, 0), duration);
      onTimeChange(clampedTime);
    }
  };

  const togglePlayback = () => {
    if (duration === 0) return;
    if (displayedTime >= duration) onTimeChange(0);
    onPlayingChange(!isPlaying || displayedTime >= duration);
  };

  return (
    <section className={styles.player} aria-labelledby="media-player-heading">
      <div className={styles.visual} aria-hidden="true">
        <span className={styles.waveform} />
        <span className={styles.waveform} />
        <span className={styles.waveform} />
        <span className={styles.waveform} />
        <span className={styles.waveform} />
      </div>
      <div className={styles.controls}>
        <div className={styles.heading}>
          <p>Recording</p>
          <h2 id="media-player-heading">Meeting playback</h2>
        </div>
        <div className={styles.timeline}>
          <input
            aria-label="Seek meeting recording"
            className={styles.seekBar}
            max={duration}
            min="0"
            onChange={(event) => handleSeek(event.target.value)}
            step="0.1"
            style={{ background: `linear-gradient(to right, #6047d9 0%, #6047d9 ${progress}%, #e7e4ef ${progress}%, #e7e4ef 100%)` }}
            type="range"
            value={displayedTime}
          />
          <div className={styles.timeLabels} aria-live="off">
            <time dateTime={`PT${displayedTime}S`}>{formatTimestamp(displayedTime)}</time>
            <time dateTime={`PT${duration}S`}>{formatTimestamp(duration)}</time>
          </div>
        </div>
        <button
          aria-label={isPlaying ? "Pause meeting playback" : "Play meeting recording"}
          className={styles.playButton}
          disabled={duration === 0}
          onClick={togglePlayback}
          type="button"
        >
          <PlayIcon isPlaying={isPlaying} />
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </button>
      </div>
    </section>
  );
}
