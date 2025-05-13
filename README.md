# React BullMQ UI

**React BullMQ UI** is a React component designed to list, filter, sort, paginate, and perform basic management operations on your [BullMQ](https://bullmq.io/) jobs within your web interface. This component is built using [Ant Design](https://ant.design/).

## Features

- Lists jobs in a modern view using Ant Design `Table`
- Search by Job ID or Job Name
- Filter by job statuses and **queue names**
- Sort by various fields (creation time, processing time, name, etc.)
- Client-side pagination
- View job details (data, failed reason, timestamps, options, return value, logs, etc.) in a modal
- Add new jobs through a user-friendly interface
- Callback support for job actions (Retry, Delete)
- Automatic job status detection
- Support for both BullMQ Job objects and custom job formats
- Developed with TypeScript and includes type definitions

## Installation

You can add the package to your project using npm or yarn:

```bash
npm install react-bullmq-ui
# or
yarn add react-bullmq-ui
```

## Ant Design CSS

Since this component uses Ant Design, you need to import Ant Design CSS in your project's main entry file (usually `App.tsx`, `index.tsx`, or `main.tsx`):

```jsx
// For example in App.tsx or your project's main entry file
import "antd/dist/reset.css"; // Recommended reset styles for Ant Design v5+
// or if you are using an older version:
// import 'antd/dist/antd.css';
```

## Basic Usage

Below is a basic example of how to use the `BullMQJobList` component:

```jsx
import React, { useState, useEffect } from 'react';
import BullMQJobList from 'react-bullmq-ui'; // Import the linked package
// You will need to set up your Queue instance and Redis connection
// import { Queue } from 'bullmq';
// const myQueue = new Queue('myQueueName', { connection: { host: 'localhost', port: 6379 } });

// Don't forget to import Ant Design CSS in your project's main file
// import 'antd/dist/reset.css';

const App = () => {
  const [jobs, setJobs] = useState([]); // Array of Job objects or custom job data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This function should fetch jobs and related information from your BullMQ Queues.
  // Replace this with your actual implementation.
  const fetchJobs = async () => {
    console.log('Fetching jobs...');
    // TODO: Implement actual job fetching logic here
    // This function should fetch jobs from your BullMQ Queues with queue info
    // Example: 
    // const queues = ['videoQueue', 'emailQueue', 'reportQueue'];
    // const allJobs = [];
    // for (const queueName of queues) {
    //   const queue = new Queue(queueName, redisOptions);
    //   const jobs = await queue.getJobs(['active', 'waiting', 'completed', 'failed', 'delayed']);
    //   // Add queueName to each job
    //   allJobs.push(...jobs.map(job => ({ ...job, queueName })));
    // }
    // return allJobs;

    // Returning empty data for now as a placeholder
    return [];
  };

  const fetchJobsAndDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the simplified fetchJobs function
      const fetchedJobs = await fetchJobs();
      setJobs(fetchedJobs);
    } catch (err) {
      setError(err.message || 'Failed to fetch job details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndDetails();
  }, []);

  const handleJobAction = async (action, job) => {
    console.log(`${action} job: ${job.id} from queue ${job.queueName}`);
    // Actual actions should be implemented here (e.g., job.retry(), job.remove())
  };

  const handleFetchLogs = async (jobId) => {
    console.log(`Fetching logs for job: ${jobId}`);
    // Actual log fetching implementation should be here
    return [`Log line 1 for ${jobId}`, `Log line 2 for ${jobId}`];
  };

  const handleRefresh = () => {
    console.log('Refreshing job list...');
    fetchJobsAndDetails();
  };

  const handleAddJob = async (queueName, jobName, jobData, jobOptions) => {
    console.log(`Adding job to queue: ${queueName}`);
    // Actual job addition implementation should be here
    // Example: const queue = new Queue(queueName, { connection: redisOptions }); 
    // await queue.add(jobName, jobData, jobOptions);
    fetchJobsAndDetails(); // Refresh the list after adding a job
  };

  return (
    <div style={{ padding: 20 }}>
      <BullMQJobList
        jobs={jobs}
        isLoading={loading}
        error={error}
        onJobRetry={(job) => handleJobAction('Retrying', job)}
        onJobDelete={(job) => handleJobAction('Deleting', job)}
        onFetchJobLogs={handleFetchLogs}
        onRefresh={handleRefresh}
        onJobAdd={handleAddJob}
        availableQueueNames={['videoQueue', 'emailQueue', 'reportQueue']} // Optional: Manually provide queues for filter
        defaultPageSize={10}
      />
    </div>
  );
};

export default App;
```

## `BullMQJobList` Props

Below is a detailed list of props accepted by the `BullMQJobList` component:

| Prop                  | Type                                   | Required? | Default Value | Description                                                                                                                                                                                       |
| --------------------- | -------------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jobs`                | `Job[] | CustomJob[]`                  | Yes       | -             | Array of BullMQ `Job` objects or custom job objects to display. Job states are automatically detected using the `status` field and queue names are taken from the `queueName` field in each job.   |
| `isLoading`           | `boolean`                              | No        | `false`       | Indicates if the job list is loading. Used for a general loading indicator when the entire list is empty or being updated.                                                                        |
| `error`               | `string \| null`                       | No        | `null`        | Displays an error message if an error occurs while loading jobs.                                                                                                                                  |
| `onJobRetry`          | `(job: Job) => void`                   | No        | `undefined`   | Callback invoked when a job is retried (via the "Retry" button).                                                                                                                                  |
| `onJobDelete`         | `(job: Job) => void`                   | No        | `undefined`   | Callback invoked when a job is deleted (via the "Delete" button). The `jobs` list is expected to be updated after this call.                                                                      |
| `onFetchJobLogs`      | `(jobId: string) => Promise<string[]>` | No        | `undefined`   | Asynchronous callback invoked to fetch job logs when the "Logs" tab is opened in the job detail modal. Takes `jobId` and should return a `Promise` resolving to an array of log strings.          |
| `defaultPageSize`     | `number`                               | No        | `10`          | Default number of jobs per page.                                                                                                                                                                  |
| `availableQueueNames` | `string[]`                             | No        | `undefined`   | List of queue names to display in the queue filter dropdown. If not provided, it's dynamically derived from the `queueName` field in each job.                                                     |
| `refreshInterval`     | `number`                               | No        | `5000`        | Interval in milliseconds for auto refresh. This is used when auto refresh is enabled via the UI toggle.                                                                                           |
| `onRefresh`           | `() => void`                           | No        | `undefined`   | Callback invoked when the "Refresh" button is clicked or auto refresh occurs. When provided, a Refresh button and auto refresh toggle appear in the UI.                                           |
| `onJobAdd`            | `(queueName: string, jobName: string, jobData: any, jobOptions?: JobOptions) => Promise<void>` | No | `undefined` | Callback invoked when a new job is added via the "Add Job" button. When provided, a green Add Job button appears in the UI. |

### `JobOptions` Interface for `onJobAdd`

When using the `onJobAdd` prop, you can provide job options using the `JobOptions` interface:

```typescript
interface JobOptions {
  delay?: number;              // Delay before processing the job (in ms)
  attempts?: number;           // Number of attempts if job fails
  backoff?: number | {         // Backoff strategy for failed jobs
    type: string;              // Backoff type ("fixed" or "exponential")
    delay: number;             // Initial delay between retries (in ms)
  };
  lifo?: boolean;              // Add job to the right end of the queue (Last In, First Out)
  timeout?: number;            // Job timeout (in ms)
  priority?: number;           // Job priority (higher numbers = higher priority)
  removeOnComplete?: boolean | number | { 
    count: number;             // Maximum number of completed jobs to keep
    age: number;               // Maximum age in seconds of completed jobs to keep
  };
  removeOnFail?: boolean | number | { 
    count: number;             // Maximum number of failed jobs to keep
    age: number;               // Maximum age in seconds of failed jobs to keep
  };
  stackTraceLimit?: number;    // Limit stack trace size for errors
  repeat?: {
    pattern?: string;          // Cron pattern for recurring jobs
    count?: number;            // Number of times the job should repeat
    tz?: string;               // Timezone
    endDate?: Date | string | number; // End date for recurring jobs
    limit?: number;            // Maximum number of jobs to create
    every?: number;            // Repeat every n milliseconds
    cron?: string;             // Cron expression
  };
  jobId?: string;              // Custom job ID
}
```

Example of using `onJobAdd` with job options:

```javascript
const handleAddJob = async (queueName, jobName, jobData, jobOptions) => {
  // Example job options
  const options = {
    delay: 5000,           // 5 second delay
    attempts: 3,           // Retry 3 times if failed
    removeOnComplete: true, // Remove job after completion
    priority: 2            // Higher priority
  };
  
  const queue = new Queue(queueName, { connection: redisOptions });
  await queue.add(jobName, jobData, jobOptions || options);
  
  // Refresh job list
  fetchJobs();
};

// ...

<BullMQJobList
  // ...other props
  onJobAdd={handleAddJob}
  availableQueueNames={['videoQueue', 'emailQueue', 'reportQueue']}
/>
```

## Expected Properties for Job Objects

The `BullMQJobList` component is designed to work with both BullMQ `Job` objects and custom job formats. At minimum, job objects should include:

### Required Properties
- `id: string | number`: Unique ID of the job
- `name: string`: Name of the job
- `timestamp: number`: Timestamp (milliseconds) of when the job was created
- `status: string`: Current status of the job (e.g., "waiting", "active", "completed", "failed", etc.)
- `queueName: string`: Name of the queue the job belongs to

### Optional Properties
- `data?: any`: Data payload of the job
- `opts?: object`: Options used when the job was created
- `processedOn?: number`: Timestamp of when the job started processing
- `finishedOn?: number`: Timestamp of when the job was completed or failed
- `failedReason?: string`: Error message if the job failed
- `stacktrace?: string[]`: Stack trace if the job failed
- `attemptsMade?: number`: Number of times the job has been attempted
- `delay?: number`: Duration (milliseconds) for which the job is delayed
- `progress?: number | object | string | boolean`: Progress of the job
- `returnValue?: any` or `returnvalue?: any`: Return value if the job completed successfully

## Action and Log Callbacks

- **Action Callbacks (`onJobRetry`, `onJobDelete`):**
  These functions are called when the respective button is clicked and receive the `Job` object as a parameter. Within these functions, you should call the appropriate methods on your BullMQ `Queue` instance (or directly on the `Job` instance, e.g., `job.retry()`, `job.remove()`, or `queue.retryJobs([job.id])`, etc.).
  After the action is complete, it's recommended to update the `jobs` props (e.g., by re-fetching via your `fetchJobsAndDetails()` function) to refresh the UI.

- **`onFetchJobLogs((jobId: string) => Promise<string[]>)`:**
  This function is called when the "Logs" tab is opened in a job's detail modal. It receives the `jobId` as a parameter and expects a `Promise` that resolves to an array of strings (log lines) for that job.
  Example implementation:
  ```javascript
  const fetchLogsForJob = async (jobId) => {
    // const queue = new Queue('myQueueName'); // Get the relevant queue
    // const { logs } = await queue.getJobLogs(jobId, 0, 200); // Get first 200 log lines
    // return logs;
    return [`Log 1 for ${jobId}`, `Log 2 for ${jobId}`]; // Example
  };
  ```

- **`onJobAdd((queueName: string, jobName: string, jobData: any, jobOptions?: any) => Promise<void>)`:**
  This function is called when a new job is added via the "Add Job" button. It receives the queue name, job name, job data, and optional job options as parameters and should add the job to the specified queue.
  Example implementation:
  ```javascript
  const handleAddJob = async (queueName, jobName, jobData, jobOptions) => {
    const queue = new Queue(queueName, { connection: redisOptions });
    await queue.add(jobName, jobData, jobOptions);
    // Then refresh your job list
    fetchJobs();
  };
  ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgements

This package was developed with the assistance of GitHub Copilot and Claude 3.7 Sonnet AI. We appreciate the AI tools that help improve developer productivity while respecting human creativity and expertise.

## License

ISC
