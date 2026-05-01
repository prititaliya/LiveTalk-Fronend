/**
 * Mock Transcript Data
 * 
 * Provides sample transcript data for UI development.
 * Will be replaced with actual API calls later.
 */

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
  is_final: boolean;
}

export interface Transcript {
  meeting_id: string;
  meeting_name: string;
  start_time: string;
  end_time?: string;
  transcripts: TranscriptEntry[];
  total_entries: number;
  created_at: string;
}

/**
 * Get mock transcripts for the current user
 */
export function getMockTranscripts(): Transcript[] {
  return [
    {
      meeting_id: "recording-1766345500943_20251221_133241",
      meeting_name: "recording-1766345500943",
      start_time: "2025-12-21T13:32:41.441887",
      end_time: "2025-12-21T13:32:41.445623",
      total_entries: 2,
      created_at: "2025-12-21T13:32:41.445623",
      transcripts: [
        {
          speaker: "Speaker 1",
          text: "Thing that you want. Or though sometimes you might be kind of like stuck. So the example that comes to my mind is if you're in line somewhere or you're at the airport and you have somewhere that you are, but you can't go and do something, so you just have time to kill. So if you're in the airport and you're waiting for the airplane, you might say, I have time to kill. I'll read this book or I've got an hour to kill. So I'll call my mom. For example. So this is time that you don't have something specific to do. You just have to wait. Or you have a gap between some kind of scheduled event. You might say, I have time to kill.",
          timestamp: "2025-12-21T13:32:41.441266",
          is_final: true,
        },
        {
          speaker: "Speaker 2",
          text: "Yeah, I like that distinction that you're kind of forced to have free time because you're waiting for something, but it's not happening now. So I have an hour to kill until this event. I can't go off and do something else. I have to just be a little bit.",
          timestamp: "2025-12-21T13:32:41.445516",
          is_final: true,
        },
      ],
    },
    {
      meeting_id: "recording-1766344865576_20251221_132123",
      meeting_name: "Team Standup Meeting",
      start_time: "2025-12-21T13:21:23.123456",
      end_time: "2025-12-21T13:25:45.789012",
      total_entries: 15,
      created_at: "2025-12-21T13:25:45.789012",
      transcripts: [
        {
          speaker: "Speaker 1",
          text: "Welcome everyone to today's meeting. Let's start by reviewing the agenda.",
          timestamp: "2025-12-21T13:21:23.123456",
          is_final: true,
        },
        {
          speaker: "Speaker 2",
          text: "Thanks for organizing this. I have a few points I'd like to discuss.",
          timestamp: "2025-12-21T13:21:45.234567",
          is_final: true,
        },
        {
          speaker: "Speaker 1",
          text: "Great, let's hear them. What's on your mind?",
          timestamp: "2025-12-21T13:22:10.345678",
          is_final: true,
        },
        {
          speaker: "Speaker 2",
          text: "I think we need to prioritize the new feature request from the client.",
          timestamp: "2025-12-21T13:22:30.456789",
          is_final: true,
        },
        {
          speaker: "Speaker 1",
          text: "That makes sense. Let's add it to the sprint backlog.",
          timestamp: "2025-12-21T13:22:50.567890",
          is_final: true,
        },
      ],
    },
    {
      meeting_id: "recording-1766344406394_20251221_131356",
      meeting_name: "Project Planning Session",
      start_time: "2025-12-21T13:13:56.123456",
      end_time: "2025-12-21T13:18:30.456789",
      total_entries: 8,
      created_at: "2025-12-21T13:18:30.456789",
      transcripts: [
        {
          speaker: "Speaker 1",
          text: "Let's discuss the project timeline and deliverables.",
          timestamp: "2025-12-21T13:13:56.123456",
          is_final: true,
        },
        {
          speaker: "Speaker 2",
          text: "I think we need to adjust the deadline based on the new requirements.",
          timestamp: "2025-12-21T13:14:20.234567",
          is_final: true,
        },
        {
          speaker: "Speaker 1",
          text: "What's your proposed timeline?",
          timestamp: "2025-12-21T13:14:45.345678",
          is_final: true,
        },
        {
          speaker: "Speaker 2",
          text: "I suggest we extend it by two weeks to accommodate the changes.",
          timestamp: "2025-12-21T13:15:10.456789",
          is_final: true,
        },
      ],
    },
    {
      meeting_id: "recording-1766344281977_20251221_131133",
      meeting_name: "Sprint Status Check",
      start_time: "2025-12-21T13:11:33.123456",
      end_time: "2025-12-21T13:12:45.789012",
      total_entries: 5,
      created_at: "2025-12-21T13:12:45.789012",
      transcripts: [
        {
          speaker: "Speaker 1",
          text: "Quick check-in on the status of the current sprint.",
          timestamp: "2025-12-21T13:11:33.123456",
          is_final: true,
        },
        {
          speaker: "Speaker 2",
          text: "Everything is on track. We should be able to deliver by Friday.",
          timestamp: "2025-12-21T13:11:50.234567",
          is_final: true,
        },
        {
          speaker: "Speaker 1",
          text: "Excellent! Keep up the good work.",
          timestamp: "2025-12-21T13:12:10.345678",
          is_final: true,
        },
      ],
    },
  ];
}

/**
 * Get a single transcript by ID
 */
export function getMockTranscriptById(meetingId: string): Transcript | null {
  const transcripts = getMockTranscripts();
  return transcripts.find((t) => t.meeting_id === meetingId) || null;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate duration between start and end time
 */
export function calculateDuration(startTime: string, endTime?: string): string {
  if (!endTime) return "Ongoing";
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMins > 0) {
    return `${diffMins}m ${diffSecs}s`;
  }
  return `${diffSecs}s`;
}

