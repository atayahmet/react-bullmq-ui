import { Job } from "bullmq";

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: number | { type: string; delay: number };
  lifo?: boolean;
  timeout?: number;
  priority?: number;
  removeOnComplete?: boolean | number | { count: number; age: number };
  removeOnFail?: boolean | number | { count: number; age: number };
  stackTraceLimit?: number;
  repeat?: {
    pattern?: string;
    count?: number;
    tz?: string;
    endDate?: Date | string | number;
    limit?: number;
    every?: number;
    cron?: string;
  };
  jobId?: string;
}

// Ham job verileri için genişletilmiş tip
export interface ExtendedJobType extends Partial<Job> {
  id?: string;
  name?: string;
  timestamp?: number;
  status?: string;
  queueName?: string;
  returnValue?: any;
  [key: string]: any; // Ekstra özelliklerin olmasına izin ver
}

// Data type for table rows
export interface JobTableDataType {
  key: string; // Job ID
  id?: string;
  name: string;
  timestamp: number;
  processedOn?: number | null;
  finishedOn?: number | null;
  currentStatus: string;
  queueName: string;
  data?: any;
  opts?: any; // BullMQ.JobOptions
  failedReason?: string;
  stacktrace?: string[];
  attemptsMade: number;
  delay?: number;
  progress?: number | object | string | boolean;
  returnvalue?: any;
  originalJob: Job; // Original Job object
}

// Props for the main component
export interface BullMQJobListProps {
  jobs: (Job | ExtendedJobType)[]; // Job veya ham job verileri olabilir
  isLoading?: boolean;
  error?: string | null;
  onJobRetry?: (job: Job) => void;
  onJobDelete?: (job: Job) => void;
  onFetchJobLogs?: (jobId: string) => Promise<string[]>;
  defaultPageSize?: number;
  // Renamed from availableQueueNames to availableQueues and supports two formats
  availableQueues?: string[] | Array<{name: string, isPaused: boolean}>;
  refreshInterval?: number; // Refresh interval (ms)
  onRefresh?: () => void; // Callback for manual & automatic refresh
  onJobAdd?: (
    queueName: string, 
    jobName: string, 
    jobData: any, 
    jobOptions?: JobOptions
  ) => Promise<void>; // New callback for adding jobs
  onQueuePauseToggle?: (queueName: string, isPaused: boolean) => void; // Callback for queue pause/resume
  theme?: 'light' | 'dark' | 'auto'; // Theme mode for UI components
}
