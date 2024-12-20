import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Video.css'; // Import CSS file

function Video() {
    const [video, setVideo] = useState(null);
    const [videos, setVideos] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const fileInputRef = useRef(null); // Ref for the file input

    // Handle file selection
    const handleFileChange = (e) => {
        setVideo(e.target.files[0]);
    };

    const uploadVideo = async () => {
        if (!video) {
            alert("Please select a video to upload");
            return;
        }
    
        const fileNamePattern = /^\d{14}-\d{14}\.mp4$/;
        if (!fileNamePattern.test(video.name)) {
            alert("File name must match the pattern: DDMMYYYYHHMMSS-DDMMYYYYHHMMSS.mp4");
            return;
        }
    
        const formData = new FormData();
        formData.append("video", video);
    
        try {
            const response = await axios.post("http://localhost:5000/api/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            alert(response.data.message);

            // Clear the file input and reset the video state
            setVideo(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            fetchVideos();
        } catch (error) {
            console.error("Error uploading video:", error.response?.data || error.message);
            alert(`Upload failed: ${error.response?.data?.message || error.message}`);
        }
    };
    
    const fetchVideos = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/videos");
            setVideos(response.data.videos);
        } catch (error) {
            console.error(error);
        }
    };
    
    const filterVideos = () => {
        if (!startDate || !endDate) {
            alert("Please select both start and end dates");
            return;
        }

        const filtered = videos.filter(video => {
            const [start, end] = video.name.split("-").map(segment => new Date(
                segment.slice(4, 8), // Year
                segment.slice(2, 4) - 1, // Month
                segment.slice(0, 2), // Day
                segment.slice(8, 10), // Hours
                segment.slice(10, 12) // Minutes
            ));
            return start >= new Date(startDate) && end <= new Date(endDate);
        });

        setVideos(filtered);
    };

    return (
        <div className="video-container">
            <h1 className="title">Video Upload and Streaming</h1>
            
            {/* Upload Section */}
            <div className="upload-section">
                <h2>Upload Video</h2>
                <input
                    ref={fileInputRef} // Attach ref to the input
                    className="file-input"
                    type="file"
                    accept="video/mp4"
                    onChange={handleFileChange}
                />
                <button className="btn upload-btn" onClick={uploadVideo}>Upload</button>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <h2>Filter Videos</h2>
                <input
                    className="datetime-input"
                    type="datetime-local"
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                    className="datetime-input"
                    type="datetime-local"
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <button className="btn filter-btn" onClick={filterVideos}>Filter</button>
            </div>

            {/* Video List */}
            <div className="video-list">
                <h2>Available Videos</h2>
                {videos.map((video, index) => (
                    <div className="video-item" key={index}>
                        <h3>{video.name}</h3>
                        <video className="video-player" controls src={video.url} width="600"></video>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Video;
