"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar';
import { FaMicrophone } from 'react-icons/fa'; // We'll need to install react-icons

// Run: npm install react-icons

interface UserProfile {
  fullName: string;
  location: string;
  bio: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession({ required: true });
  const [profile, setProfile] = useState<UserProfile>({ fullName: '', location: '', bio: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [targetField, setTargetField] = useState<keyof UserProfile | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    alert('Profile Saved!');
  };

  const startRecording = (field: keyof UserProfile) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.start();
      audioChunks.current = [];
      setIsRecording(true);
      setTargetField(field);

      mediaRecorder.current.addEventListener("dataavailable", event => {
        audioChunks.current.push(event.data);
      });

      mediaRecorder.current.addEventListener("stop", handleStopRecording);
    });
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
  };
  
  const handleStopRecording = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    // Show loading state
    if (targetField) {
      setProfile(prev => ({ ...prev, [targetField]: "Processing..." }));
    }
    
    setIsRecording(false);
    
    try {
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await response.json();

      if (response.ok && targetField) {
        setProfile(prev => ({ ...prev, [targetField]: data.text }));
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      console.error(error);
      alert("Sorry, I couldn't understand that. Please try again.");
      // Revert the "Processing..." text
      const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      if (targetField) {
         setProfile(prev => ({ ...prev, [targetField]: savedProfile[targetField] || '' }));
      }
    }
    setTargetField(null);
  };

  const handleMicClick = (field: keyof UserProfile) => {
    if (isRecording && targetField === field) {
      stopRecording();
    } else {
      startRecording(field);
    }
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        <div className="space-y-4 bg-white p-6 rounded-lg shadow-md">
          {/* Full Name Field */}
          <div>
            <label htmlFor="fullName" className="block font-semibold">Full Name</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="text" id="fullName" className="w-full p-2 border rounded-md" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
              <button onClick={() => handleMicClick('fullName')} className={`p-3 rounded-full ${isRecording && targetField === 'fullName' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
                <FaMicrophone />
              </button>
            </div>
          </div>
          {/* Location Field */}
          <div>
            <label htmlFor="location" className="block font-semibold">Location</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="text" id="location" className="w-full p-2 border rounded-md" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
              <button onClick={() => handleMicClick('location')} className={`p-3 rounded-full ${isRecording && targetField === 'location' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
                <FaMicrophone />
              </button>
            </div>
          </div>
          {/* Bio Field */}
          <div>
            <label htmlFor="bio" className="block font-semibold">Bio / Summary</label>
            <div className="flex items-center gap-2 mt-1">
              <textarea id="bio" rows={5} className="w-full p-2 border rounded-md" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              <button onClick={() => handleMicClick('bio')} className={`p-3 rounded-full ${isRecording && targetField === 'bio' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
                <FaMicrophone />
              </button>
            </div>
          </div>
          <button onClick={handleSave} className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 font-bold">
            Save Profile
          </button>
        </div>
      </main>
    </div>
  );
}