'use client';

import React, { useState } from 'react';
import TranscriptSyncTool from '@/components/ui/tools/TranscriptSyncTool';
import { Button } from '@/components/ui/primitives/Button';
import { ArrowLeft, FileText, Zap, Clock, Download } from 'lucide-react';
import Link from 'next/link';

const rawScript = `Hello, this is Dr. Syed M. Quadri.
Welcome to our demo audiobook experience.
What you're about to hear is only a sample to help you explore how our voice books will sound on this platform.

Imagine you're listening to an engaging chapter on mental wellness —
the voice is calm, clear, and easy to follow.
Each word is carefully chosen to bring the message to life,
making it feel like I'm speaking directly to you.

In our real voice books, we'll dive deep into topics like
how your brain responds to stress,
why small habits can rewire your mindset,
and how you can discover your next great read today.

And here's the exciting part —
very soon, we'll be releasing full episodes for you to enjoy.
They're in the final stages of preparation,
so stay tuned, keep an ear out, and be ready to listen.

Thank you for trying this demo.
Now, sit back, relax, and imagine the possibilities.`;

export default function SyncToolPage() {
  const [syncedData, setSyncedData] = useState<any>(null);

  const handleSyncComplete = (segments: any[]) => {
    setSyncedData({ segments });
  };

  const features = [
    {
      icon: Clock,
      title: "Manual Timing",
      description: "Listen and manually mark start/end times for precise control"
    },
    {
      icon: Zap,
      title: "Auto-Sync",
      description: "Automatic timing distribution based on audio duration"
    },
    {
      icon: FileText,
      title: "Script Processing",
      description: "Automatically breaks down your script into manageable segments"
    },
    {
      icon: Download,
      title: "Export Ready",
      description: "Export perfectly timed JSON for your audio player"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/audio-player-demo" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Audio Player Demo
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Transcript Sync Tool
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automatically sync your audio script with precise timing. Perfect for creating 
              accurate transcripts for your audio player with real-time highlighting.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Sync Tool */}
        <div className="max-w-6xl mx-auto mb-12">
          <TranscriptSyncTool
            audioSrc="/Audio/sampleaudio.mp3"
            rawScript={rawScript}
            onSyncComplete={handleSyncComplete}
          />
        </div>

        {/* Sync Results */}
        {syncedData && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sync Complete! 🎉
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {syncedData.segments?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Segments Synced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncedData.segments?.reduce((acc: number, seg: any) => acc + (seg.endTime - seg.startTime), 0).toFixed(1) || 0}s
                  </div>
                  <div className="text-sm text-gray-600">Total Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {syncedData.segments?.reduce((acc: number, seg: any) => acc + seg.text.length, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {((syncedData.segments?.reduce((acc: number, seg: any) => acc + seg.text.split(' ').length, 0) || 0) / (syncedData.segments?.reduce((acc: number, seg: any) => acc + (seg.endTime - seg.startTime), 0) / 60 || 1)).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Words/Min</div>
                </div>
              </div>
              <p className="text-green-700 text-sm">
                Your transcript has been synced successfully! You can now use this data in your audio player 
                for perfect real-time highlighting.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-purple-800 mb-2">Manual Sync (Recommended):</h4>
                <div className="space-y-1 text-purple-700 text-sm">
                  <p>• Play the audio and listen carefully</p>
                  <p>• Click "Mark Start" when each segment begins</p>
                  <p>• Click "Mark End" when each segment finishes</p>
                  <p>• Tool automatically advances to next segment</p>
                  <p>• Export when all segments are synced</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-purple-800 mb-2">Auto-Sync (Quick Start):</h4>
                <div className="space-y-1 text-purple-700 text-sm">
                  <p>• Click "Auto-Sync" for instant timing</p>
                  <p>• Evenly distributes segments across audio duration</p>
                  <p>• Review and manually adjust if needed</p>
                  <p>• Good starting point for fine-tuning</p>
                  <p>• Export when satisfied with timing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
