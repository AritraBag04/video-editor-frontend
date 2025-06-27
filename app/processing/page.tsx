"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/utils/auth';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface ProcessingStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    current: boolean;
}

export default function ProcessingPage() {
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [steps, setSteps] = useState<ProcessingStep[]>([
        {
            id: 'upload',
            title: 'Files Uploaded',
            description: 'Your video files have been uploaded successfully',
            completed: true,
            current: false
        },
        {
            id: 'processing',
            title: 'Processing Video',
            description: 'Applying segments and creating your final video',
            completed: false,
            current: true
        },
        {
            id: 'encoding',
            title: 'Encoding & Optimization',
            description: 'Optimizing video quality and compression',
            completed: false,
            current: false
        },
        {
            id: 'finalizing',
            title: 'Finalizing',
            description: 'Preparing your video for download',
            completed: false,
            current: false
        }
    ]);

    const pollForProjectStatus = async (requestId: string) => {
        let time = 0;
        const maxTime = 20; // 20 iterations * 15 seconds = 5 minutes

        while (time <= maxTime) {
            try {
                const response = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_IP}/api/v1/project?requestId=${requestId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + Auth.getToken(),
                    }
                });

                if (response.status === 404) {
                    // Project is still processing, continue polling
                    time++;

                    // Update progress and steps based on time elapsed
                    updateProgressAndSteps(time, maxTime);

                    await new Promise(resolve => setTimeout(resolve, 15000));
                    continue;
                }

                if (!response.ok) {
                    throw new Error('Project status check failed');
                }

                // Success - video is ready
                setIsComplete(true);
                setProgress(100);
                completeAllSteps();

                // Wait a moment to show completion, then redirect
                setTimeout(() => {
                    router.push('/download');
                }, 2000);

                return;

            } catch (error) {
                console.error('Error polling for project status:', error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
                return;
            }
        }

        throw new Error('Video processing timed out after 5 minutes');
    };

    const updateProgressAndSteps = (currentTime: number, maxTime: number) => {
        const progressPercentage = Math.min((currentTime / maxTime) * 90, 90); // Cap at 90% until complete
        setProgress(progressPercentage);

        // Update steps based on progress
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];

            if (progressPercentage >= 25) {
                newSteps[1].completed = true;
                newSteps[1].current = false;
                newSteps[2].current = true;
            }

            if (progressPercentage >= 60) {
                newSteps[2].completed = true;
                newSteps[2].current = false;
                newSteps[3].current = true;
            }

            return newSteps;
        });
    };

    const completeAllSteps = () => {
        setSteps(prevSteps =>
            prevSteps.map(step => ({ ...step, completed: true, current: false }))
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getEstimatedTimeRemaining = () => {
        const totalEstimatedTime = 300; // 5 minutes in seconds
        const elapsed = timeElapsed;
        const remaining = Math.max(0, totalEstimatedTime - elapsed);
        return formatTime(remaining);
    };

    useEffect(() => {
        const requestId = Auth.getRequestId();

        if (!requestId) {
            router.replace('/');
            return;
        }

        // Start the timer
        const timerInterval = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        // Start polling
        pollForProjectStatus(requestId).catch(err => {
            setError(err.message);
        });

        return () => {
            clearInterval(timerInterval);
        };
    }, [router]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <h1 className="text-2xl font-bold text-red-700">Processing Failed</h1>
                        <p className="text-red-600">{error}</p>
                        <Button onClick={() => router.push('/')} className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Editor
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-2xl border-0">
                <CardContent className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative">
                            <Video className={`w-16 h-16 mx-auto mb-4 transition-all duration-1000 ${isComplete ? 'text-green-500 scale-110' : 'text-blue-500 animate-pulse'}`} />
                            {isComplete && (
                                <CheckCircle className="w-6 h-6 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {isComplete ? 'Video Ready!' : 'Creating Your Video'}
                        </h1>
                        <p className="text-gray-600">
                            {isComplete
                                ? 'Your video has been successfully created and is ready for download.'
                                : 'Please wait while we process your video segments and create the final output.'
                            }
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                    </div>

                    {/* Time Information */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-600">Time Elapsed</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{formatTime(timeElapsed)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-gray-600">Est. Remaining</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {isComplete ? '0:00' : getEstimatedTimeRemaining()}
                            </p>
                        </div>
                    </div>

                    {/* Processing Steps */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Processing Steps</h2>
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-start gap-4">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    step.completed
                                        ? 'bg-green-500'
                                        : step.current
                                            ? 'bg-blue-500 animate-pulse'
                                            : 'bg-gray-200'
                                }`}>
                                    {step.completed ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                        <span className={`text-sm font-bold ${step.current ? 'text-white' : 'text-gray-500'}`}>
                      {index + 1}
                    </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-medium transition-colors duration-300 ${
                                        step.completed
                                            ? 'text-green-700'
                                            : step.current
                                                ? 'text-blue-700'
                                                : 'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Message */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 text-center">
                            {isComplete
                                ? 'Redirecting to download page...'
                                : 'You can safely close this tab. We\'ll email you when your video is ready!'
                            }
                        </p>
                    </div>

                    {/* Back Button (only show if not complete) */}
                    {!isComplete && (
                        <div className="mt-6 text-center">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Editor
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}