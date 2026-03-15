import { useState, useRef, useCallback } from "react";
import "./styles.scss";

// Maximum file size: 15MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;
// Supported audio formats
const SUPPORTED_FORMATS = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/x-m4a", "audio/aac"];

export interface UploadedSong {
  id: string;
  name: string;
  mood: string;
  src: string;
  duration: number;
  fileSize: number;
  isUploaded: boolean;
}

interface SongUploaderProps {
  onSongUploaded: (song: UploadedSong) => void;
  uploadedSongs?: UploadedSong[];
  onRemoveSong?: (songId: string) => void;
  onPlaySong?: (songId: string) => void;
}

// Generate unique ID for uploaded songs
const generateUniqueId = (): string => {
  return "uploaded_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
};

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Format duration for display (mm:ss)
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ":" + secs.toString().padStart(2, "0");
};

const MOOD_OPTIONS = [
  { value: "chill", label: "Chill", icon: "fa-coffee", color: "#3498db" },
  { value: "jazzy", label: "Jazzy", icon: "fa-guitar", color: "#f39c12" },
  { value: "sleep", label: "Sleep", icon: "fa-moon", color: "#9b59b6" },
];

const SongUploader = ({ onSongUploaded, uploadedSongs = [], onRemoveSong, onPlaySong }: SongUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string>("chill");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const isValidType = SUPPORTED_FORMATS.includes(file.type) || 
                        file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i) !== null;
    return isValidType;
  };

  // Validate file size
  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  // Get duration of audio file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration || 0);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
      
      audio.src = objectUrl;
    });
  };

  const processFile = async (file: File) => {
    // Reset status
    setUploadStatus({ type: null, message: "" });
    
    // Validate file type
    if (!validateFileType(file)) {
      setUploadStatus({ 
        type: "error", 
        message: "Invalid format. Supported: MP3, WAV, OGG, M4A, AAC" 
      });
      return;
    }
    
    // Validate file size
    if (!validateFileSize(file)) {
      setUploadStatus({ 
        type: "error", 
        message: "File too large. Maximum size is 15MB." 
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(10);

    try {
      // Read the file
      const songData = await new Promise<{ src: string; duration: number }>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadstart = () => {
          setUploadProgress(20);
        };
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(20 + (e.loaded / e.total) * 50);
          }
        };
        
        reader.onload = async () => {
          setUploadProgress(75);
          const src = reader.result as string;
          
          // Get duration
          const duration = await getAudioDuration(file);
          setUploadProgress(90);
          
          resolve({ src, duration });
        };
        
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        
        reader.readAsDataURL(file);
      });

      // Create song object
      const song: UploadedSong = {
        id: generateUniqueId(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        mood: selectedMood,
        src: songData.src,
        duration: songData.duration,
        fileSize: file.size,
        isUploaded: true,
      };

      // Notify parent component
      onSongUploaded(song);
      
      setUploadProgress(100);
      setUploadStatus({ 
        type: "success", 
        message: `"${song.name}" added to ${selectedMood} playlist! 🎵` 
      });
      
      // Clear success message after 4 seconds
      setTimeout(() => {
        setUploadStatus({ type: null, message: "" });
        setUploadProgress(0);
      }, 4000);

    } catch (error) {
      setUploadStatus({ 
        type: "error", 
        message: "Failed to process file. Please try again." 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFile(files[0]);
    // Reset file input
    event.target.value = "";
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood]);

  const handleRemoveSong = (songId: string) => {
    if (onRemoveSong) {
      onRemoveSong(songId);
    }
  };

  const handlePlaySong = (songId: string) => {
    if (onPlaySong) {
      onPlaySong(songId);
    }
  };

  const getMoodColor = (mood: string): string => {
    const found = MOOD_OPTIONS.find(m => m.value === mood);
    return found ? found.color : "#9b59b6";
  };

  return (
    <div className="song-uploader">
      {/* Mood Selector */}
      <div className="mood-selector">
        <span className="mood-label">Add to playlist:</span>
        <div className="mood-chips">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              className={`mood-chip ${selectedMood === mood.value ? "active" : ""}`}
              onClick={() => setSelectedMood(mood.value)}
              style={selectedMood === mood.value ? { 
                background: mood.color + "33", 
                borderColor: mood.color,
                color: mood.color 
              } : {}}
            >
              <i className={`fas ${mood.icon}`}></i>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div 
        className={`upload-dropzone ${isDragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="upload-progress-content">
            <div className="spinner-ring">
              <svg viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="90 150" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" from="0 25 25" to="360 25 25" />
                </circle>
              </svg>
            </div>
            <span className="progress-text">Processing... {Math.round(uploadProgress)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: uploadProgress + "%", background: getMoodColor(selectedMood) }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="upload-idle-content">
            <div className="upload-icon-wrapper">
              <i className="fas fa-cloud-upload-alt"></i>
              <div className="upload-icon-pulse"></div>
            </div>
            <span className="upload-title">Drop your audio file here</span>
            <span className="upload-subtitle">or click to browse</span>
            <span className="upload-formats">MP3, WAV, OGG, M4A, AAC • Max 15MB</span>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        id="song-upload-input"
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: "none" }}
      />

      {/* Status Messages */}
      {uploadStatus.type && (
        <div className={`upload-status ${uploadStatus.type}`}>
          <i className={`fas ${uploadStatus.type === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}`}></i>
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* Uploaded Songs List */}
      {uploadedSongs.length > 0 && (
        <div className="uploaded-songs">
          <div className="uploaded-songs-header">
            <h5>
              <i className="fas fa-headphones"></i>
              Your Uploads 
              <span className="song-count">{uploadedSongs.length}</span>
            </h5>
          </div>
          <ul className="song-list">
            {uploadedSongs.map((song) => (
              <li key={song.id} className="song-item">
                <div className="song-mood-indicator" style={{ background: getMoodColor(song.mood) }}></div>
                <div className="song-info">
                  <span className="song-name">{song.name}</span>
                  <span className="song-meta">
                    <span className="meta-mood">{song.mood}</span>
                    <span className="meta-separator">•</span>
                    <span>{formatDuration(song.duration)}</span>
                    <span className="meta-separator">•</span>
                    <span>{formatFileSize(song.fileSize)}</span>
                  </span>
                </div>
                <div className="song-actions">
                  <button 
                    className="action-btn play-action"
                    onClick={(e) => { e.stopPropagation(); handlePlaySong(song.id); }}
                    title="Play now"
                  >
                    <i className="fas fa-play"></i>
                  </button>
                  <button 
                    className="action-btn remove-action"
                    onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                    title="Remove song"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SongUploader;
