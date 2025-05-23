import React, { useState, useEffect, useMemo } from "react";
import { Job } from "bullmq";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Input,
  Select,
  Row,
  Col,
  Card,
  Switch,
  Popconfirm,
  Progress,
  Tooltip,
} from "antd";
import type { ColumnsType as TableColumnsType } from "antd/es/table";
import {
  ReloadOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  AppstoreOutlined,
  PlusOutlined,
  SettingOutlined,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";

import { BullMQJobListProps, JobTableDataType, ExtendedJobType } from "../types/index";
import { getStatusColor, formatTimestamp } from "../utils/formatters";
import { ALL_QUEUES, ALL_STATES } from "../constants";
import JobDetailModal from "./JobDetailModal";
import AddJobModal from "./AddJobModal";
import QueueManagementModal from "./QueueManagementModal";
import ThemeProvider from "./ThemeProvider";

// Utility function to determine job status from BullMQ job data
const determineJobStatus = (job: Job | ExtendedJobType): string => {
  // If job object already has a status string, use it (backwards compatibility)
  if ((job as ExtendedJobType).status) {
    return (job as ExtendedJobType).status!;
  }

  // Otherwise determine status from BullMQ properties:
  // - finishedOn + failedReason = failed
  // - finishedOn without failedReason = completed
  // - processedOn without finishedOn = active
  // - delay in the future = delayed
  // - otherwise = waiting

  if (job.finishedOn) {
    return job.failedReason ? "failed" : "completed";
  }

  if (job.processedOn) {
    return "active";
  }

  if (job.delay && job.timestamp) {
    const delayUntil = job.timestamp + job.delay;
    if (delayUntil > Date.now()) {
      return "delayed";
    }
  }

  if ((job as any).isPaused) {
    return "paused";
  }

  if (job.parent) {
    return "waiting-children";
  }

  return "waiting";
};

const { Text } = Typography;
const { Option } = Select;

// Utility function to extract queue name from queueQualifiedName
const extractQueueName = (queueQualifiedName: string | undefined): string => {
  if (!queueQualifiedName) return "unknown";
  if (queueQualifiedName === "") return "";

  // Check if it follows the pattern bull:{queueName}
  // This extracts the actual queue name from the BullMQ qualified name format
  const match = queueQualifiedName.match(/^bull:(.*)$/);
  
  // If we extract an empty string after the prefix, still return "unknown"
  if (match && match[1] && match[1].trim().length > 0) {
    return match[1];
  } else if (match) {
    return "unknown";
  }
  
  return queueQualifiedName;
};

const BullMQJobList: React.FC<BullMQJobListProps> = ({
  jobs: initialJobs,
  isLoading = false,
  error = null,
  onJobRetry,
  onJobDelete,
  onFetchJobLogs,
  defaultPageSize = 10,
  availableQueues: providedQueues,
  refreshInterval = 5000,
  onRefresh,
  onJobAdd,
  onQueuePauseToggle,
  theme = "light",
}) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([ALL_STATES]);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<string>(ALL_QUEUES);

  const [tableSortInfo, setTableSortInfo] = useState<{
    columnKey?: string;
    order?: "ascend" | "descend" | null;
  }>({
    columnKey: "timestamp",
    order: "descend",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobTableDataType | null>(null);
  const [jobLogs, setJobLogs] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalJobStatus, setModalJobStatus] = useState<string>("loading");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const [isAddJobModalVisible, setIsAddJobModalVisible] = useState(false);
  const [isAddingJob, setIsAddingJob] = useState(false);

  const [isQueueManagementModalVisible, setIsQueueManagementModalVisible] = useState(false);

  const [jobStates, setJobStates] = useState<Record<string, string>>({});

  const [availableJobStates, setAvailableJobStates] = useState<string[]>([
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
    "waiting-children",
  ]);

  useEffect(() => {
    const detectJobStates = async () => {
      if (initialJobs.length > 0) {
        const newJobStates: Record<string, string> = {};
        const stateSet = new Set<string>();

        // Add all possible states
        stateSet.add("waiting");
        stateSet.add("active");
        stateSet.add("completed");
        stateSet.add("failed");
        stateSet.add("delayed");
        stateSet.add("paused");
        stateSet.add("waiting-children");

        for (const job of initialJobs) {
          if (job.id) {
            // Use determineJobStatus to get the status from job properties
            const status = determineJobStatus(job);
            newJobStates[job.id] = status;
            stateSet.add(status);
          }
        }

        setJobStates(newJobStates);
        setAvailableJobStates(Array.from(stateSet));
      }
    };

    detectJobStates();
  }, [initialJobs]);

  useEffect(() => {
    if (!autoRefreshEnabled || !onRefresh) return;

    const intervalId = setInterval(() => {
      onRefresh();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, refreshInterval, onRefresh]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const showDetailModal = async (jobRecord: JobTableDataType) => {
    setSelectedJobForModal(jobRecord);
    setIsDetailModalVisible(true);
    setModalError(null);
    setJobLogs([]);

    const status = jobRecord.currentStatus || "unknown";
    setModalJobStatus(status);

    setIsLoadingLogs(true);
    try {
      if (onFetchJobLogs && jobRecord.id) {
        const logs = await onFetchJobLogs(jobRecord.id);
        setJobLogs(logs);
      }
    } catch (err: any) {
      console.error(`Failed to get details for job ${jobRecord.id}`, err);
      setModalError(err.message || "Failed to fetch job details.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedJobForModal(null);
  };

  const handleAddJob = async (
    queueName: string,
    jobName: string,
    jobData: any,
    jobOptions?: any
  ) => {
    if (!onJobAdd) return;

    setIsAddingJob(true);
    try {
      await onJobAdd(queueName, jobName, jobData, jobOptions);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to add job:", error);
    } finally {
      setIsAddingJob(false);
    }
  };

  const allQueueNamesForFilter = useMemo(() => {
    if (providedQueues && providedQueues.length > 0) {
      // Handle both variants: string[] and {name, isPaused}[]
      if (typeof providedQueues[0] === "string") {
        // Variant 1: ["queue-1", "queue-2"]
        return providedQueues as string[];
      } else {
        // Variant 2: [{name: "queue-1", isPaused: true}, ...]
        return (providedQueues as { name: string; isPaused: boolean }[]).map((q) => q.name);
      }
    }

    // Extract queue names from jobs if no queues were provided
    const queueNames = new Set<string>();
    initialJobs.forEach((job) => {
      const queueQualifiedName = (job as ExtendedJobType).queueQualifiedName;
      if (queueQualifiedName) {
        const queueName = extractQueueName(queueQualifiedName);
        queueNames.add(queueName);
      }
    });
    return Array.from(queueNames);
  }, [initialJobs, providedQueues]);

  // Extract queue pause states for use in queue management
  const queuePauseStates = useMemo(() => {
    if (providedQueues && providedQueues.length > 0 && typeof providedQueues[0] !== "string") {
      // Create a map of queue name to pause state
      const pauseStateMap: Record<string, boolean> = {};
      (providedQueues as { name: string; isPaused: boolean }[]).forEach((queue) => {
        pauseStateMap[queue.name] = queue.isPaused;
      });
      return pauseStateMap;
    }
    return {} as Record<string, boolean>;
  }, [providedQueues]);

  const processedAndFormattedJobs = useMemo(() => {
    let tableData: JobTableDataType[] = initialJobs.map((job) => {
      // Extract queue name from queueQualifiedName using the utility function
      const extendedJob = job as ExtendedJobType;
      const queueQualifiedName = extendedJob.queueQualifiedName;
      
      // Try multiple potential sources for queue name
      let queueName: string;
      if (queueQualifiedName) {
        queueName = extractQueueName(queueQualifiedName);
      } else if (job.data && (job.data as any).queueName) {
        // Some implementations store queue name in job data
        queueName = (job.data as any).queueName;
      } else if ((job as any).queue) {
        // Some implementations have a queue property
        const queue = (job as any).queue;
        queueName = typeof queue === 'string' ? queue : 
                  (queue.name ? queue.name : 'unknown');
      } else {
        queueName = "unknown";
      }

      const jobName = job.name || "";
      const timestamp = job.timestamp || Date.now();

      const processedOn = job.processedOn;
      const finishedOn = job.finishedOn;

      // Determine job status from BullMQ properties instead of relying on a status property
      const jobStatus = determineJobStatus(job);

      // For debugging
      console.debug(
        `Job ID: ${job.id}, queueQualifiedName: ${queueQualifiedName}, extracted: ${queueName}, status: ${jobStatus}`
      );

      const data = job.data;
      const opts = job.opts;
      const failedReason = job.failedReason;
      const stacktrace = job.stacktrace;
      const attemptsMade = job.attemptsMade || 0;
      const delay = job.delay;

      const progress = job.progress as any;
      const returnvalue = job.returnvalue || (job as ExtendedJobType).returnValue;

      return {
        key: job.id!,
        id: job.id,
        name: jobName,
        timestamp: timestamp,
        processedOn: processedOn,
        finishedOn: finishedOn,
        currentStatus: jobStatus,
        queueName: queueName,
        data: data,
        opts: opts,
        failedReason: failedReason,
        stacktrace: stacktrace,
        attemptsMade: attemptsMade,
        delay: delay,
        progress: progress,
        returnvalue: returnvalue,
        originalJob: job as Job,
      };
    });

    if (selectedQueueFilter !== ALL_QUEUES) {
      tableData = tableData.filter((job) => job.queueName === selectedQueueFilter);
    }

    if (searchText) {
      tableData = tableData.filter(
        (job) =>
          (job.id && String(job.id).toLowerCase().includes(searchText.toLowerCase())) ||
          (job.name && job.name.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    if (statusFilters.length > 0 && !statusFilters.includes(ALL_STATES)) {
      tableData = tableData.filter((job) => statusFilters.includes(job.currentStatus));
    }
    return tableData;
  }, [initialJobs, searchText, statusFilters, jobStates, selectedQueueFilter]);

  // Using a state map to track copied IDs
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});

  // Handler for ID copy operation
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(String(id));

    // Mark this ID as copied
    setCopiedIds((prev) => ({ ...prev, [id]: true }));

    // Remove the mark after 1 second
    setTimeout(() => {
      setCopiedIds((prev) => ({ ...prev, [id]: false }));
    }, 1000);
  };

  const columns: TableColumnsType<JobTableDataType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: true,
      width: 160,
      render: (id) => {
        const isCopied = copiedIds[String(id)] || false;

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              size="small"
              icon={isCopied ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
              style={{ padding: "0 4px", marginRight: 4, minWidth: 30 }}
              onClick={() => handleCopyId(String(id))}
            />
            <div
              style={{
                maxWidth: "calc(100% - 34px)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {String(id).length > 12 ? String(id).substring(0, 12) + "..." : String(id)}
            </div>
          </div>
        );
      },
      sortOrder: tableSortInfo.columnKey === "id" ? tableSortInfo.order : undefined,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      ellipsis: true,
      sortOrder: tableSortInfo.columnKey === "name" ? tableSortInfo.order : undefined,
    },
    {
      title: "Queue",
      dataIndex: "queueName",
      key: "queueName",
      sorter: true,
      width: 120,
      ellipsis: true,
      sortOrder: tableSortInfo.columnKey === "queueName" ? tableSortInfo.order : undefined,
    },
    {
      title: "Status",
      dataIndex: "currentStatus",
      key: "currentStatus",
      sorter: true,
      width: 110,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
      sortOrder: tableSortInfo.columnKey === "currentStatus" ? tableSortInfo.order : undefined,
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (progress: number | object | string | boolean | undefined) => {
        if (progress === undefined || progress === null) {
          return "-";
        }

        if (typeof progress === "number") {
          return <Progress percent={progress} size="small" />;
        }

        if (typeof progress === "boolean") {
          return progress ? (
            <Progress percent={100} size="small" />
          ) : (
            <Progress percent={0} size="small" />
          );
        }

        if (typeof progress === "string") {
          const percentMatch = progress.match(/(\d+)%/);
          if (percentMatch) {
            const percent = parseInt(percentMatch[1], 10);
            return <Progress percent={percent} size="small" />;
          }
          return <Tooltip title={progress}>{progress}</Tooltip>;
        }

        if (typeof progress === "object") {
          if ("percentage" in progress && typeof progress.percentage === "number") {
            return <Progress percent={progress.percentage} size="small" />;
          } else if ("percent" in progress && typeof progress.percent === "number") {
            return <Progress percent={progress.percent} size="small" />;
          } else {
            return (
              <Tooltip title={JSON.stringify(progress)}>
                <span>Object</span>
              </Tooltip>
            );
          }
        }

        return "-";
      },
    },
    {
      title: "Created At",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: true,
      render: (ts) => formatTimestamp(ts),
      width: 170,
      sortOrder: tableSortInfo.columnKey === "timestamp" ? tableSortInfo.order : undefined,
    },
    {
      title: "Processed At",
      dataIndex: "processedOn",
      key: "processedOn",
      sorter: true,
      render: (ts) => formatTimestamp(ts),
      width: 170,
      responsive: ["md"],
      sortOrder: tableSortInfo.columnKey === "processedOn" ? tableSortInfo.order : undefined,
    },
    {
      title: "Finished At",
      dataIndex: "finishedOn",
      key: "finishedOn",
      sorter: true,
      render: (ts) => formatTimestamp(ts),
      width: 170,
      responsive: ["lg"],
      sortOrder: tableSortInfo.columnKey === "finishedOn" ? tableSortInfo.order : undefined,
    },
    ...(onFetchJobLogs || onJobRetry || onJobDelete
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 250,
            fixed: "right" as const,
            render: (_: unknown, record: JobTableDataType) => (
              <Space size="small">
                {onFetchJobLogs && (
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => showDetailModal(record)}
                  >
                    Details
                  </Button>
                )}

                {onJobRetry && (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => onJobRetry(record.originalJob)}
                    disabled={
                      record.currentStatus === "completed" || record.currentStatus === "active"
                    }
                  >
                    Retry
                  </Button>
                )}

                {onJobDelete && (
                  <Popconfirm
                    title="Are you sure you want to delete?"
                    description="This action cannot be undone!"
                    onConfirm={() => onJobDelete(record.originalJob)}
                    okText="Yes"
                    cancelText="No"
                    placement="left"
                  >
                    <Button size="small" icon={<DeleteOutlined />} danger>
                      Del
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  if (isLoading && initialJobs.length === 0) {
    return (
      <Spin size="large">
        <div style={{ marginTop: 16 }}>Loading jobs...</div>
      </Spin>
    );
  }

  if (error) {
    return <Alert message="Error loading jobs" description={error} type="error" showIcon />;
  }

  let sortedData = [...processedAndFormattedJobs];
  if (tableSortInfo.columnKey && tableSortInfo.order) {
    const { columnKey, order } = tableSortInfo;
    sortedData.sort((a, b) => {
      let valA: any = (a as any)[columnKey!];
      let valB: any = (b as any)[columnKey!];

      valA =
        valA === undefined || valA === null ? (order === "ascend" ? Infinity : -Infinity) : valA;
      valB =
        valB === undefined || valB === null ? (order === "ascend" ? Infinity : -Infinity) : valB;

      if (valA === Infinity || valB === Infinity || valA === -Infinity || valB === -Infinity) {
        if (valA === valB) return 0;
        return valA < valB ? -1 : 1;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return order === "ascend" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return order === "ascend" ? valA - valB : valB - valA;
    });
  }

  return (
    <ThemeProvider defaultTheme={theme}>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filters Section */}
          <Row gutter={[16, 16]}>
            {/* Search input */}
            <Col xs={24} sm={8} md={8} lg={7} xl={6}>
              <Input
                placeholder="Search by Job ID or Name"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            {/* Queue filter */}
            <Col xs={24} sm={8} md={8} lg={7} xl={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="Filter by Queue"
                value={selectedQueueFilter}
                onChange={setSelectedQueueFilter}
                allowClear={selectedQueueFilter !== ALL_QUEUES}
              >
                <Option key={ALL_QUEUES} value={ALL_QUEUES}>
                  <AppstoreOutlined style={{ marginRight: 4 }} />
                  ALL QUEUES
                </Option>
                {allQueueNamesForFilter.map((qName) => (
                  <Option key={qName} value={qName}>
                    {qName}
                  </Option>
                ))}
              </Select>
            </Col>

            {/* Status filter */}
            <Col xs={24} sm={8} md={8} lg={10} xl={12}>
              <Select
                mode="multiple"
                allowClear
                style={{ width: "100%" }}
                placeholder="Filter by status"
                value={statusFilters}
                onChange={setStatusFilters}
                maxTagCount="responsive"
              >
                <Option key={ALL_STATES} value={ALL_STATES}>
                  <Tag>ALL STATUSES</Tag>
                </Option>
                {availableJobStates.map((state) => (
                  <Option key={state} value={state}>
                    <Tag color={getStatusColor(state)}>{state.toUpperCase()}</Tag>
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          {/* Job Count Row */}
          <Row>
            <Col span={24}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <Text type="secondary">
                  Total Jobs: <strong>{processedAndFormattedJobs.length}</strong>
                  {selectedQueueFilter !== ALL_QUEUES && (
                    <>
                      {" "}
                      in queue <Tag>{selectedQueueFilter}</Tag>
                    </>
                  )}
                  {statusFilters.length > 0 && !statusFilters.includes(ALL_STATES) && (
                    <>
                      {" "}
                      with status{" "}
                      {statusFilters.map((s) => (
                        <Tag color={getStatusColor(s)} key={s}>
                          {s.toUpperCase()}
                        </Tag>
                      ))}
                    </>
                  )}
                </Text>
              </div>
            </Col>
          </Row>

          {/* Actions Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={24} lg={24}>
              <Space wrap size="middle" style={{ width: "100%", justifyContent: "flex-start" }}>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setIsQueueManagementModalVisible(true)}
                >
                  Queue Management
                </Button>

                {onJobAdd && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddJobModalVisible(true)}
                  >
                    Add Job
                  </Button>
                )}

                {onRefresh && (
                  <>
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      loading={isLoading}
                    >
                      Refresh
                    </Button>

                    <Space size="small" style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ whiteSpace: "nowrap" }}>Auto refresh:</span>
                      <Switch
                        checkedChildren="ON"
                        unCheckedChildren="OFF"
                        checked={autoRefreshEnabled}
                        onChange={setAutoRefreshEnabled}
                        disabled={!onRefresh}
                      />
                    </Space>
                  </>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      <Table<JobTableDataType>
        columns={columns}
        dataSource={sortedData}
        loading={isLoading && initialJobs.length > 0}
        rowKey="key"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: sortedData.length,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [String(defaultPageSize), "20", "50", "100"],
          onChange: (page, newPageSize) => {
            setCurrentPage(page);
            if (newPageSize) setPageSize(newPageSize);
          },
        }}
        scroll={{ x: "max-content" }}
        size="small"
        onChange={(_pagination, _filters, sorter: any, extra) => {
          if (extra.action === "sort") {
            setTableSortInfo({
              columnKey: sorter.field as string,
              order: sorter.order as "ascend" | "descend" | undefined,
            });
          }
        }}
      />

      <JobDetailModal
        jobData={selectedJobForModal}
        jobStatus={modalJobStatus}
        isVisible={isDetailModalVisible}
        onClose={handleDetailModalClose}
        logs={jobLogs}
        isLoadingLogs={isLoadingLogs}
        modalError={modalError}
      />

      {onJobAdd && (
        <AddJobModal
          isVisible={isAddJobModalVisible}
          onCancel={() => setIsAddJobModalVisible(false)}
          onAdd={handleAddJob}
          availableQueueNames={allQueueNamesForFilter}
          isLoading={isAddingJob}
        />
      )}

      <QueueManagementModal
        isVisible={isQueueManagementModalVisible}
        onCancel={() => setIsQueueManagementModalVisible(false)}
        queueNames={allQueueNamesForFilter}
        pauseStates={queuePauseStates}
        onQueuePauseToggle={onQueuePauseToggle}
      />
    </ThemeProvider>
  );
};

export default BullMQJobList;
