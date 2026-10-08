"use client";

import { useEffect, useState } from "react";
import { formatTimestamp } from "../lib/meetingFormatters";
import styles from "./MediaPlayer.module.css";

type MediaPlayerProps = {
  durationSeconds: number;
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

export function MediaPlayer({ durationSeconds }: MediaPlayerProps) {
  const duration = Math.max(0, Math.floor(durationSeconds));
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const progress = duration === 0 ? 0 : (currentTime / duration) * 100;

  useEffect(() => {
    if (!isPlaying || duration === 0) return;

    const timer = window.setInterval(() => {
      setCurrentTime((time) => {
        if (time >= duration - 1) {
          setIsPlaying(false);
          return duration;
        }

        return time + 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [duration, isPlaying]);

  const handleSeek = (value: string) => {
    const nextTime = Number(value);
    if (Number.isFinite(nextTime)) setCurrentTime(Math.min(Math.max(nextTime, 0), duration));
  };

  const togglePlayback = () => {
    if (duration === 0) return;
    if (currentTime >= duration) setCurrentTime(0);
    setIsPlaying((playing) => !playing || currentTime >= duration);
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
            step="1"
            style={{ background: `linear-gradient(to right, #6047d9 0%, #6047d9 ${progress}%, #e7e4ef ${progress}%, #e7e4ef 100%)` }}
            type="range"
            value={currentTime}
          />
          <div className={styles.timeLabels} aria-live="off">
            <time dateTime={`PT${currentTime}S`}>{formatTimestamp(currentTime)}</time>
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
