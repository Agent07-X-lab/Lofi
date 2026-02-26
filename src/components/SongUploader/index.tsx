import { useState } from "react";
import "./styles.scss";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Supported audio formats
const SUPPORTED_FORMATS = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/x-m4a"];

interface UploadedSong {
  id: string;
  name: string;
  src: string;
  duration: number;
  fileSize: number;
}

interface SongUploaderProps {
  onSongUploaded: (song: UploadedSong) => void;
  uploadedSongs?: UploadedSong[];
  onRemoveSong?: (songId: string) => void;
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

const SongUploader = ({ onSongUploaded, uploadedSongs = [], onRemoveSong }: SongUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const isValidType = SUPPORTED_FORMATS.includes(file.type) || 
                        file.name.match(/\.(mp3|wav|ogg|m4a)$/i) !== null;
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Reset status
    setUploadStatus({ type: null, message: "" });
    
    // Validate file type
    if (!validateFileType(file)) {
      setUploadStatus({ 
        type: "error", 
        message: "Invalid file format. Please upload MP3, WAV, OGG, or M4A files." 
      });
      return;
    }
    
    // Validate file size
    if (!validateFileSize(file)) {
      setUploadStatus({ 
        type: "error", 
        message: "File too large. Maximum size is 10MB." 
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
          setUploadProgress(30);
        };
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(30 + (e.loaded / e.total) * 40);
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
        src: songData.src,
        duration: songData.duration,
        fileSize: file.size,
      };

      // Notify parent component
      onSongUploaded(song);
      
      setUploadProgress(100);
      setUploadStatus({ 
        type: "success", 
        message: song.name + " added to playlist!" 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus({ type: null, message: "" });
      }, 3000);

    } catch (error) {
      setUploadStatus({ 
        type: "error", 
        message: "Failed to upload file. Please try again." 
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleRemoveSong = (songId: string) => {
    if (onRemoveSong) {
      onRemoveSong(songId);
    }
  };

  const getProgressWidth = () => {
    return uploadProgress + "%";
  };

  return (
    <div className="song-uploader">
      {/* Upload Section */}
      <div className="upload-section">
        <label htmlFor="song-input" className="upload-label">
          {uploading ? (
            <>
              <div className="upload-progress">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Uploading... {uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: getProgressWidth() }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt"></i>
              <span>Upload Your Song</span>
              <small>MP3, WAV, OGG, M4A (max 10MB)</small>
            </>
          )}
        </label>
        <input
          id="song-input"
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </div>

      {/* Status Messages */}
      {uploadStatus.type && (
        <div className={"upload-status " + uploadStatus.type}>
          <i className={"fas fa-" + (uploadStatus.type === "success" ? "check-circle" : "exclamation-circle")}></i>
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* Uploaded Songs List */}
      {uploadedSongs.length > 0 && (
        <div className="uploaded-songs">
          <h5>Your Uploaded Songs ({uploadedSongs.length})</h5>
          <ul className="song-list">
            {uploadedSongs.map((song) => (
              <li key={song.id} className="song-item">
                <div className="song-info">
                  <i className="fas fa-music"></i>
                  <span className="song-name">{song.name}</span>
                  <span className="song-meta">
                    {formatDuration(song.duration)} • {formatFileSize(song.fileSize)}
                  </span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveSong(song.id)}
                  title="Remove song"
                >
                  <i className="fas fa-times"></i>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SongUploader;
