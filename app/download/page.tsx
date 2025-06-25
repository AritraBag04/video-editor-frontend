"use client"

import { Github } from "lucide-react";
import Link from "next/link";
import {Auth} from "@/utils/auth";

export default function DownloadPage() {
    async function downloadFromPresignedUrl(presignedUrl: any   , filename: string)
    {
        try {
            // Fetch the file from the presigned URL
            const response = await fetch(presignedUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the blob from the response
            const blob = await response.blob();

            // Create a URL for the blob
            const downloadUrl = window.URL.createObjectURL(blob);

            // Create a temporary anchor element
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename; // Set the download filename

            // Append to the document temporarily
            document.body.appendChild(link);

            // Trigger the download
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            {/* Main Download Button */}
            <button
                className="mb-8 px-12 py-6 bg-black text-white text-xl font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                onClick={() => {
                    // Add your download logic here
                    fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_IP}:8088/api/v1/project?requestId=${Auth.getRequestId()}`,
                        {
                            headers: {
                            'Authorization': 'Bearer ' + Auth.getToken(),
                        }})
                        .then(response => {
                            const preSignedUrl = response.text();
                            // Download object from presignedURL
                            preSignedUrl.then(preSignedUrl =>{
                                downloadFromPresignedUrl(preSignedUrl, "output.mkv")
                                .then()
                            })

                        }).catch(err => {
                            console.log("Some error occured while downloading the file:");
                        })
                }}
            >
                Download Video
            </button>

            {/* Thank You Message */}
            <p className="text-2xl font-bold text-gray-800 mb-6">
                Thank you for using our product!
            </p>

            {/* Creator Info */}
            <p className="text-xl font-semibold text-gray-700 mb-8">
                Made by Aritra Bag
            </p>

            {/* GitHub Contribution Section */}
            <div className="flex flex-col items-center gap-2">
                <p className="text-lg text-gray-700">Want to contribute to the project?</p>
                <Link
                    href="https://github.com/AritraBag04/video-editor-backend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    <Github size={24} />
                    <span className="font-medium">Visit GitHub Repository</span>
                </Link>
            </div>
        </div>
    );
}