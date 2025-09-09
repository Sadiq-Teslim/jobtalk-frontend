"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar';
import { FaMicrophone } from 'react-icons/fa';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  source: string;
}

export default function SearchPage() {
  const { status } = useSession({ required: true });
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    fetch('/jobs.json').then(res => res.json()).then(data => {
      setAllJobs(data);
      setFilteredJobs(data);
    });
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredJobs(allJobs);
      return;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const results = allJobs.filter(job => 
      job.title.toLowerCase().includes(lowercasedTerm) ||
      job.company.toLowerCase().includes(lowercasedTerm) ||
      job.location.toLowerCase().includes(lowercasedTerm)
    );
    setFilteredJobs(results);
  }, [searchTerm, allJobs]);

  const handleMicClick = () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.start();
        audioChunks.current = [];
        setIsRecording(true);

        mediaRecorder.current.addEventListener("dataavailable", event => {
          audioChunks.current.push(event.data);
        });

        mediaRecorder.current.addEventListener("stop", async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          setSearchTerm("Listening...");
          setIsRecording(false);
          
          try {
            const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
              setSearchTerm(data.text); // This automatically triggers the search!
            } else {
              throw new Error(data.error);
            }
          } catch (error) {
            console.error(error);
            setSearchTerm(""); // Clear on error
            alert("Sorry, couldn't understand that.");
          }
        });
      });
    }
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Search for Jobs</h1>
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Type or click the mic to search..."
            className="w-full p-3 pl-4 pr-12 border rounded-lg shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleMicClick} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600'}`}>
             <FaMicrophone />
          </button>
        </div>
        <div className="space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h2 className="text-xl font-bold">{job.title}</h2>
                <p className="text-gray-700 font-semibold">{job.company} - {job.location}</p>
                <p className="text-sm text-gray-500 mt-1">Source: {job.source}</p>
                <p className="mt-4 text-gray-800">{job.description}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No jobs found.</p>
          )}
        </div>
      </main>
    </div>
  );
}