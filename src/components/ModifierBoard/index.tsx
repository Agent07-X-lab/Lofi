import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store/store";

import "./styles.scss";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import { changeMoodStatus } from "../../store/slice/moodSlice";

import ReactAudioPlayer from "react-audio-player";
import { changeRainStatus } from "../../store/slice/rainSlice";
import { changeVolume } from "../../store/slice/changeVolumeSlice";
import CountDownTimer from "../CountDownTimer";
import TodoList from "../TodoList";
import SongUploader from "../SongUploader";
import { UploadedSong } from "../SongUploader";
import {
  IModifierBoardProps,
  MoodMode,
  IBackgroundNoise,
  IAudioSetting,
} from "../../types/interface";
import { RootState } from "../../store/store";

const ModifierBoard = ({
  seconds,
  minutes,
  hours,
  isRunning,
  pause,
  resume,
  restart,
  setTimerHandler,
  setTimerStart,
  timerStart,
  songs,
  setSongs,
}: IModifierBoardProps) => {
  const dispatch = useAppDispatch();
  const moodData = useAppSelector((state: RootState) => state.mood);
  const rainData = useAppSelector((state: RootState) => state.rain);
  const volumeData = useAppSelector((state: RootState) => state.volume);

  const { rainValue } = rainData;
  const { moodMode } = moodData;
  const { volumeValue } = volumeData;

  const camelToSnakeCase = (str: string) =>
    str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  const [openMood, setOpenMood] = useState<boolean>(false);
  const [openFocus, setOpenFocus] = useState<boolean>(false);
  const [openUpload, setOpenUpload] = useState<boolean>(false);
  const [uploadedSongs, setUploadedSongs] = useState<UploadedSong[]>([]);
  const [backgroundNoise, setBackgroundNoise] = useState<IBackgroundNoise>({
    cityTraffic: 0,
    cityRain: 0,
    fireplace: 0,
    snow: 0,
    summerStorm: 0,
    fan: 0,
    forestNight: 0,
    wave: 0,
    wind: 0,
    people: 0,
    river: 0,
    rainForest: 0,
  });

  const toggleMoodHandler = () => {
    setOpenMood(!openMood);
    setOpenFocus(false);
    setOpenUpload(false);
  };

  const toggleFocusHandler = () => {
    setOpenFocus(!openFocus);
    setOpenMood(false);
    setOpenUpload(false);
  };

  const changeMoodHandler = (mode: MoodMode) => {
    dispatch(changeMoodStatus(mode));
  };

  const changeVolumeHandler = (value: number) => {
    dispatch(changeVolume(value));
  };

  const changeNoiseHandler = (type: keyof IBackgroundNoise, value: number) => {
    if (value > 0) {
      dispatch(changeRainStatus({ currentStatus: "clear", value: 0 }));
    } else if (value === 0 && type === "cityRain") {
      dispatch(changeRainStatus({ currentStatus: "rain", value: 0 }));
    }
    setBackgroundNoise((prevNoise: IBackgroundNoise) => ({
      ...prevNoise,
      [type]: value,
    }));
  };

  const toggleUploadHandler = () => {
    setOpenUpload(!openUpload);
    setOpenMood(false);
    setOpenFocus(false);
  };

  const handleSongUploaded = (song: UploadedSong) => {
    // Track in the uploaded songs list for the uploader UI
    setUploadedSongs((prev) => [...prev, song]);
    
    // Add the uploaded song to the main playlist so it actually plays!
    // Generate a unique numeric id for compatibility with the existing song format
    const newSong = {
      id: songs.length,
      name: song.name,
      mood: song.mood,
      src: song.src,
      isUploaded: true,
      uploadId: song.id,
    };
    setSongs((prev: any[]) => [...prev, newSong]);
  };

  const handleRemoveSong = (songId: string) => {
    // Remove from the uploaded songs tracker
    setUploadedSongs((prev) => prev.filter((s) => s.id !== songId));
    
    // Also remove from the main playlist
    setSongs((prev: any[]) => prev.filter((s: any) => s.uploadId !== songId));
  };

  const handlePlaySong = (songId: string) => {
    // Find the song in the main playlist by its uploadId and switch to it
    const index = songs.findIndex((s: any) => s.uploadId === songId);
    if (index !== -1) {
      // We don't have setCurrentSongIndex here, but we can reorder songs
      // to put the target song first, or dispatch an event.
      // Actually, we can do a simple workaround: move the song to current position.
      // For now, let's just ensure the song is in the playlist (it already is).
      // The user can use the player controls to navigate to it.
      
      // Better approach: we'll re-arrange the songs array to put this song at position 0
      // and reset the current song index via setSongs
      const targetSong = songs[index];
      const remaining = songs.filter((_: any, i: number) => i !== index);
      setSongs([targetSong, ...remaining]);
    }
  };

  const audioSettings: IAudioSetting[] = [
    {
      src: "./assets/musics/city_traffic.mp3",
      volume: backgroundNoise.cityTraffic / 100,
    },
    {
      src: "./assets/musics/fireplace.mp3",
      volume: backgroundNoise.fireplace / 100,
    },
    { src: "./assets/musics/rain_city.mp3", volume: rainValue / 100 },
  ];
  return (
    <>
      {/* Background noise audio - always plays for the main 3 sounds */}
      {audioSettings.map(({ src, volume }) => (
          <ReactAudioPlayer
            key={src}
            preload='auto'
            autoPlay
            src={src}
            loop
            volume={volume}
          />
        ))}

      {/* Additional background noise audio - always plays */}
      {Object.entries(backgroundNoise).map(([type, value]) => (
        <ReactAudioPlayer
          key={type}
          preload='auto'
          autoPlay
          src={`./assets/musics/${camelToSnakeCase(type)}.mp3`}
          loop
          volume={value / 100}
        />
      ))}

      <div
        className={`modifier ${openMood ? "mood" : ""} ${
          openFocus ? "focus" : ""
        } ${openUpload ? "upload" : ""}`}
      >
        <div className='modifier__icon'>
          <div
            className={`icon ${openMood ? "active" : ""}`}
            onClick={toggleMoodHandler}
          >
            <i className='fas fa-sliders-h fa-2x'></i>
          </div>
          {openMood && (
            <div className='modifierBox'>
              <h4>Mood</h4>
              <div className='options'>
                {["sleep", "jazzy", "chill"].map((mode) => (
                  <div
                    key={mode}
                    id={mode}
                    onClick={() => changeMoodHandler(mode as MoodMode)}
                    className={`item ${moodMode === mode ? "active" : ""}`}
                  >
                    <i
                      id={mode}
                      className={`fas fa-${
                        mode === "sleep"
                          ? "moon"
                          : mode === "jazzy"
                          ? "guitar"
                          : "coffee"
                      } fa-2x`}
                    ></i>
                    <span id={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
              <div className='volume'>
                <Stack
                  spacing={2}
                  direction='row'
                  sx={{ mb: 1 }}
                  alignItems='center'
                >
                  <i className='fas fa-volume-down fa-lg'></i>
                  <Slider
                    className='volume-slider'
                    value={volumeValue}
                    onChange={(e, value) =>
                      changeVolumeHandler(value as number)
                    }
                  />
                  <i className='fas fa-volume-up fa-lg'></i>
                </Stack>
              </div>
              <h5>Background Noise</h5>
              <div className='backgroundNoise'>
                {Object.entries(backgroundNoise).map(([type, value]) => {
                  const noiseType = type as keyof IBackgroundNoise;
                  return (
                    <div key={type} className='noise-option'>
                      <p>
                        {type
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </p>
                      <ReactAudioPlayer
                        preload='auto'
                        autoPlay
                        src={`./assets/musics/${camelToSnakeCase(type)}.mp3`}
                        loop
                        volume={value / 100}
                      />
                      <Slider
                        className='slider'
                        value={value}
                        onChange={(e, newValue) =>
                          changeNoiseHandler(noiseType, newValue as number)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className='modifier__icon'>
          <div
            className={`icon ${openFocus ? "active" : ""}`}
            onClick={toggleFocusHandler}
          >
            <i className='fas fa-book-reader fa-2x'></i>
          </div>
          {openFocus && (
            <div className='modifierBox'>
              <h4>Focus Mode</h4>
              <CountDownTimer
                seconds={seconds}
                minutes={minutes}
                hours={hours}
                isRunning={isRunning}
                pause={pause}
                resume={resume}
                restart={restart}
                setTimerHandler={setTimerHandler}
                setTimerStart={setTimerStart}
                timerStart={timerStart}
              />
              <h4>To do list</h4>
              <TodoList />
            </div>
          )}
        </div>
        {/* Upload Button */}
        <div className='modifier__icon'>
          <div
            className={`icon ${openUpload ? "active" : ""}`}
            onClick={toggleUploadHandler}
          >
            <i className='fas fa-cloud-upload-alt fa-2x'></i>
          </div>
          {openUpload && (
            <div className='modifierBox upload-box'>
              <h4>
                <i className='fas fa-music' style={{ marginRight: '8px', color: '#bb86fc' }}></i>
                Upload Your Music
              </h4>
              <SongUploader 
                onSongUploaded={handleSongUploaded} 
                uploadedSongs={uploadedSongs}
                onRemoveSong={handleRemoveSong}
                onPlaySong={handlePlaySong}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ModifierBoard;