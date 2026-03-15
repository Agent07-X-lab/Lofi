import { useState, useEffect } from "react";
import "./styles.scss";
import { IModifierBoardProps } from '../../types/interface';

const CountDownTimer = ({
  seconds,
  minutes,
  hours,
  isRunning,
  pause,
  resume,
  setTimerHandler,
  setTimerStart,
  timerStart,
}: IModifierBoardProps) => {
  const [hour, setHour] = useState<number | string>("");
  const [minute, setMinute] = useState<number | string>("");
  const [second, setSecond] = useState<number | string>("");
  const [initialTotalSeconds, setInitialTotalSeconds] = useState<number>(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleSetTimer = (hValue?: number | string, mValue?: number | string, sValue?: number | string) => {
    // Treat empty as 0
    const h = Number(hValue !== undefined ? hValue : hour) || 0;
    const m = Number(mValue !== undefined ? mValue : minute) || 0;
    const s = Number(sValue !== undefined ? sValue : second) || 0;
    
    if (h === 0 && m === 0 && s === 0) return; // Prevent 0 time

    setInitialTotalSeconds(h * 3600 + m * 60 + s);
    setTimerHandler(h, m, s);
    setTimerStart(true);
    
    // Reset inputs
    setHour("");
    setMinute("");
    setSecond("");
  };

  const handlePreset = (minutesPreset: number) => {
    handleSetTimer(0, minutesPreset, 0);
  };

  const handleCancelTimer = () => {
    setTimerHandler(0, 0, 0);
    setTimerStart(false);
    setInitialTotalSeconds(0);
  };

  // Calculate actual progress based on the initial time set vs time remaining
  const currentTotalSeconds = hours * 3600 + minutes * 60 + seconds;
  const progressPercentage = initialTotalSeconds > 0 
    ? (currentTotalSeconds / initialTotalSeconds) * 100 
    : 0;
  
  // Circumference of circle with r=45 is 2 * Math.PI * 45 ≈ 283
  const strokeDashoffset = 283 - (283 * progressPercentage) / 100;

  // Format time properly HH:MM:SS or MM:SS
  const formatTime = () => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className='timer-container'>
      {timerStart ? (
        <div className='timer-active'>
          <div 
            className='timer-display-wrapper'
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className={`timer-ring ${isRunning ? "running" : "paused"}`}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="ring-track"></circle>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  className="ring-progress"
                  style={{ strokeDashoffset: `${strokeDashoffset}` }}
                ></circle>
              </svg>
            </div>
            
            {/* The time display inside the ring */}
            <div className='timer-time-content'>
              <div className="time-large">{formatTime()}</div>
              <span className="timer-status-text">
                {isRunning ? "Focusing" : "Paused"}
              </span>
            </div>

            {/* Overlay controls when hovering over time */}
            <div className={`timer-overlay-controls ${isHovering ? 'visible' : ''}`}>
              {isRunning ? (
                <button className='overlay-btn pause' onClick={pause} title="Pause">
                  <i className="fas fa-pause"></i>
                </button>
              ) : (
                <button className='overlay-btn resume' onClick={resume} title="Resume">
                  <i className="fas fa-play"></i>
                </button>
              )}
              <button className='overlay-btn cancel' onClick={handleCancelTimer} title="Cancel">
                <i className="fas fa-stop"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className='timer-setup'>
          <div className="setup-header">
            <i className="fas fa-stopwatch"></i> Focus Timer
          </div>

          <div className="timer-presets">
            <button className="preset-chip" onClick={() => handlePreset(25)}>
              <i className="fas fa-brain"></i>
              25m Pomodoro
            </button>
            <div className="preset-row">
              <button className="preset-chip break" onClick={() => handlePreset(5)}>
                <i className="fas fa-coffee"></i> 5m
              </button>
              <button className="preset-chip break" onClick={() => handlePreset(15)}>
                <i className="fas fa-couch"></i> 15m
              </button>
            </div>
          </div>

          <div className="timer-divider">
            <span>or custom time</span>
          </div>

          <div className='time-inputs'>
            <div className="input-block">
              <input
                type='number'
                value={hour}
                onChange={(e) => setHour(e.target.value ? Math.max(0, parseInt(e.target.value)) : "")}
                placeholder="00"
                max={24}
              />
              <label>H</label>
            </div>
            <span className="colon">:</span>
            <div className="input-block">
              <input
                type='number'
                value={minute}
                onChange={(e) => setMinute(e.target.value ? Math.min(59, Math.max(0, parseInt(e.target.value))) : "")}
                placeholder="00"
                max={59}
              />
              <label>M</label>
            </div>
            <span className="colon">:</span>
            <div className="input-block">
              <input
                type='number'
                value={second}
                onChange={(e) => setSecond(e.target.value ? Math.min(59, Math.max(0, parseInt(e.target.value))) : "")}
                placeholder="00"
                max={59}
              />
              <label>S</label>
            </div>
          </div>

          <button 
            className={`start-timer-btn ${(Number(hour) || Number(minute) || Number(second)) ? "ready" : ""}`} 
            onClick={() => handleSetTimer()}
          >
            <i className="fas fa-play"></i> Start Focus
          </button>
        </div>
      )}
    </div>
  );
};

export default CountDownTimer;
