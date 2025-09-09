/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/transcribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Spitch } from 'spitch';
import ffmpeg from 'fluent-ffmpeg';
// import ffmpegStatic from 'ffmpeg-static'; 
import { Formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
const ffmpegPath = path.join(process.cwd(), 'vendor', 'ffmpeg', 'bin', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPath);

const client = new Spitch(); // Initializes with SPITCH_API_KEY from .env.local

// Helper function to parse the form data
const parseForm = async (req: NextRequest) => {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = new Formidable();
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export async function POST(req: NextRequest) {
  try {
    // 1. Parse the incoming file upload
    const { files, fields } = await parseForm(req);
    const audioFile = files.audio[0];
    const language = fields.language[0] || 'en';
    const originalPath = audioFile.filepath;
    const convertedPath = `${originalPath}.wav`;

    // 2. Convert the audio file to WAV format
    await new Promise<void>((resolve, reject) => {
      ffmpeg(originalPath)
        .toFormat('wav')
        .on('error', (err: any) => reject(err))
        .on('end', () => resolve())
        .save(convertedPath);
    });

    // 3. Transcribe the converted audio file using Spitch
    const transcription_result = await client.speech.transcribe({
      content: fs.createReadStream(convertedPath),
      language: language,
      model: 'mansa_v1',
    });
    const text = transcription_result.text;

    // 4. Clean up the temporary files
    fs.unlinkSync(originalPath);
    fs.unlinkSync(convertedPath);

    // 5. Return the transcribed text
    return NextResponse.json({ text: text });

  } catch (error) {
    console.error('Error in transcribe API:', error);
    return NextResponse.json({ error: 'Failed to process audio.' }, { status: 500 });
  }
}