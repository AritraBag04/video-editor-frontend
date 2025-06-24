"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, Play, Pause, Trash2, GripVertical, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {router} from "next/client";
import {Router} from "next/router";
import {useRouter} from "next/navigation";
interface VideoFile {
  id: string
  name: string
  url: string
  duration: number
}

interface Segment {
  id: string
  videoId: string
  videoName: string
  startTime: number
  endTime: number
  name: string
}

interface VideoTimeline {
  videoTrack: number,
  start: number,
  end: number
}

interface AudioTimeline {
  audioTrack: number,
  start: number,
  end: number
}

interface RequestBody {
  input: {
    videoTracks: number,
    audioTracks: number,
  },
  filterTimeLineRequest: {
    videoTimeline: VideoTimeline[],
    audioTimeline: AudioTimeline[]
  }
}

export default function VideoSegmentEditor() {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playlistIndex, setPlaylistIndex] = useState(0)
  const [isPlaylistMode, setIsPlaylistMode] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [startTimeInput, setStartTimeInput] = useState("")
  const [endTimeInput, setEndTimeInput] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const playlistVideoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type === "video/mp4") {
        const url = URL.createObjectURL(file)
        const video = document.createElement("video")

        video.onloadedmetadata = () => {
          const newVideo: VideoFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            url,
            duration: video.duration,
          }
          setVideos((prev) => [...prev, newVideo])
        }

        video.src = url
      }
    })
  }, [])

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFileUpload(e.dataTransfer.files)
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Create segment
  const createSegment = (start: number, end: number) => {
    if (!selectedVideo) return

    const startTime = start
    const endTime = Math.min(end, selectedVideo.duration) // Default 10 second segment

    if (endTime <= startTime) return

    const newSegment: Segment = {
      id: Math.random().toString(36).substr(2, 9),
      videoId: selectedVideo.id,
      videoName: selectedVideo.name,
      startTime,
      endTime,
      name: `Segment ${segments.length + 1}`,
    }

    setSegments((prev) => [...prev, newSegment])
  }

  // Delete segment
  const deleteSegment = (segmentId: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== segmentId))
  }

  // Drag and drop for segments
  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDragOverSegment = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    const newSegments = [...segments]
    const draggedSegment = newSegments[draggedItem]
    newSegments.splice(draggedItem, 1)
    newSegments.splice(index, 0, draggedSegment)

    setSegments(newSegments)
    setDraggedItem(index)
  }

  // Playlist functionality
  const playPlaylist = () => {
    if (segments.length === 0) return
    setIsPlaylistMode(true)
    setPlaylistIndex(0)
    playSegment(0)
  }

  const playSegment = (index: number) => {
    if (index >= segments.length) {
      setIsPlaylistMode(false)
      return
    }

    const segment = segments[index]
    const video = videos.find((v) => v.id === segment.videoId)

    if (video && playlistVideoRef.current) {
      playlistVideoRef.current.src = video.url
      playlistVideoRef.current.currentTime = segment.startTime
      playlistVideoRef.current.play()

      // Set up end time listener
      const checkEndTime = () => {
        if (playlistVideoRef.current && playlistVideoRef.current.currentTime >= segment.endTime) {
          playlistVideoRef.current.pause()
          playlistVideoRef.current.removeEventListener("timeupdate", checkEndTime)

          // Auto-play next segment after 1 second
          setTimeout(() => {
            setPlaylistIndex(index + 1)
            playSegment(index + 1)
          }, 1000)
        }
      }

      playlistVideoRef.current.addEventListener("timeupdate", checkEndTime)
    }
  }

  const stopPlaylist = () => {
    setIsPlaylistMode(false)
    if (playlistVideoRef.current) {
      playlistVideoRef.current.pause()
    }
  }

  const uploadToPresignedUrl = async (presignedUrl: string, file: File) => {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'video/mp4'
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  };

  const fileUploads = async (videoURL: string, presignedURL: string, videoName: string) => {
    const response = await fetch(videoURL);
    const blob = await response.blob();
    const file = new File([blob], videoName, { type: 'video/mp4' });
    return uploadToPresignedUrl(presignedURL, file);
  }

  const createBody = (indexMap: Map<string, number>, videoTracks: number, audioTracks: number, segments: Segment[]) => {
    let body: RequestBody = {
      input : {
        videoTracks,
        audioTracks
      },
      filterTimeLineRequest : {
        videoTimeline: [],
        audioTimeline: []
      }
    }
    for(let i: number = 0; i < segments.length; i++) {
      let videoTrack: any = indexMap.get(segments[i].videoId)
      let startTime: number = segments[i].startTime
      let endTime: number = segments[i].endTime
      let segment: VideoTimeline = {
        videoTrack,
        start: startTime,
        end: endTime
      }
      body.filterTimeLineRequest.videoTimeline.push(segment)
    }
    return body;
  }

  const create_video = () => {
    // console.log("Playlist created");
    // console.log(segments);
    let videoTracks: number = videos.length;
    fetch(`http://localhost:8088/api/v1/presigned-urls?userEmail=aritra&videoTracks=${videoTracks}&audioTracks=0`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5YWQ5YWRjMi01MmM2LTQzZTUtOGU0YS0yNGNjYzIzMDI2OTkiLCJpYXQiOjE3NTA2OTMxMzEsImV4cCI6MTc1MDc3OTUzMX0.EqD4i5Cwlu-BqK5zD6WbfW7wi6ZUy-WP3uLocF1hg_Y'
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          const projectId = data.projectId;
          const presignedUrls = data.preSignedURLs;
          const indexMap: Map<string, number> = new Map();
          for(let i: number = 0; i < videoTracks; i++) {
            const video: VideoFile = videos[i];
            const url: string = presignedUrls[i];
            const videoName: string = "video"+i.toString()+".mp4";
            indexMap.set(video.id, i);
            fileUploads(video.url, url, videoName);
          }
          console.log(createBody(indexMap, videoTracks, 0, segments));
          fetch('http//localhost:8088/api/v1/process',
              {
                method: 'Post',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5YWQ5YWRjMi01MmM2LTQzZTUtOGU0YS0yNGNjYzIzMDI2OTkiLCJpYXQiOjE3NTA2OTMxMzEsImV4cCI6MTc1MDc3OTUzMX0.EqD4i5Cwlu-BqK5zD6WbfW7wi6ZUy-WP3uLocF1hg_Y'
                }
              }).then(response => response.json())
        })
  }

  // @ts-ignore
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-end gap-1 mb-4">
        <Button onClick={()=>router.push("auth/signup")} variant={"outline"}>Sign Up</Button>
        <Button onClick={() => router.push("/auth/login")}>Login</Button>
      </div>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Video Editor</h1>
          <p className="text-gray-600 mt-2">Upload MP4 videos, create segments, and build custom playlists</p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Drop MP4 files here or click to browse</p>
              <p className="text-sm text-gray-500 mt-2">Only MP4 format is supported</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {videos.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Uploaded Videos:</h3>
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedVideo?.id === video.id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50",
                    )}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div>
                      <p className="font-medium">{video.name}</p>
                      <p className="text-sm text-gray-500">Duration: {formatTime(video.duration)}</p>
                    </div>
                    {selectedVideo?.id === video.id && <div className="text-blue-600 font-medium">Selected</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Editor Section */}
        {selectedVideo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3>Video: {selectedVideo.name}</h3>
                <Separator />
                <div className="space-y-3">
                  <h3>Create Segment</h3>
                  <div className="flex items-center gap-2">
                    <div>Start:
                      <Input
                          type="number"
                          value={startTimeInput}
                          onChange={(e) => setStartTimeInput(e.target.value)}
                          min={0}
                          max={selectedVideo?.duration}
                          className="w-sm"
                      />
                    </div>
                    <div>End:
                      <Input
                      type="number"
                       value={endTimeInput}
                       onChange={(e) => setEndTimeInput(e.target.value)}
                       min={0}
                       max={selectedVideo?.duration}
                      className="w-sm"/>
                    </div>
                    <Button onClick={() => createSegment(Number(startTimeInput), Number(endTimeInput))} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Segment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Segments ({segments.length})
                  {segments.length > 0 && (
                    <Button onClick={playPlaylist} size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Play All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No segments created yet</p>
                ) : (
                  <div className="space-y-2">
                    {segments.map((segment, index) => (
                      <div
                        key={segment.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverSegment(e, index)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border bg-white cursor-move transition-colors",
                          draggedItem === index ? "opacity-50" : "hover:bg-gray-50",
                        )}
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-sm text-gray-500">
                            {segment.videoName} • {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                          </p>
                        </div>
                        <Button onClick={() => deleteSegment(segment.id)} size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <Button className="w-full" onClick={create_video}>Export</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Playlist Player */}
        {isPlaylistMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Playlist Player
                <Button onClick={stopPlaylist} variant="outline" size="sm">
                  Stop Playlist
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <video ref={playlistVideoRef} className="w-full max-w-2xl mx-auto rounded-lg" />
                <div className="text-center">
                  <p className="text-lg font-medium">Playing: {segments[playlistIndex]?.name}</p>
                  <p className="text-sm text-gray-600">
                    Segment {playlistIndex + 1} of {segments.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
