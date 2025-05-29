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
import type { TableProps, TableColumnsType } from "antd";
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
  PieChartOutlined,
} from "@ant-design/icons";
// Import CSS class names
import * as classNames from "../utils/classNames";

import { BullMQJobListProps, JobTableDataType, ExtendedJobType } from "../types/index";
import { getStatusColor, formatTimestamp } from "../utils/formatters";
import { ALL_QUEUES, ALL_STATES } from "../constants";
import JobDetailModal from "./JobDetailModal";
import AddJobModal from "./AddJobModal";
import QueueManagementModal from "./QueueManagementModal";
import InsightsModal from "./InsightsModal";
import ThemeProvider from "./ThemeProvider";

const { Text } = Typography;
const { Option } = Select;

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
  onQueueJobClear,
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
  const [isInsightsModalVisible, setIsInsightsModalVisible] = useState(false);

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

        stateSet.add("waiting");
        stateSet.add("active");
        stateSet.add("completed");
        stateSet.add("failed");
        stateSet.add("delayed");
        stateSet.add("paused");
        stateSet.add("waiting-children");

        for (const job of initialJobs) {
          if (job.id) {
            const extendedJob = job as ExtendedJobType;
            if (extendedJob.status) {
              newJobStates[job.id] = extendedJob.status;
              stateSet.add(extendedJob.status);
            }
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
      // Try to get queue name from multiple possible properties
      let queueName: string | undefined;
      
      if ((job as ExtendedJobType).queueName) {
        queueName = (job as ExtendedJobType).queueName;
      } else if ((job as any).queueQualifiedName) {
        queueName = (job as any).queueQualifiedName as string;
      }
      
      if (queueName) {
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
      // Try to get queue name from multiple possible properties
      let queueName: string = "unknown";
      if ((job as ExtendedJobType).queueName) {
        queueName = (job as ExtendedJobType).queueName as string;
      } else if ((job as any).queueQualifiedName) {
        // Support for example-app format
        queueName = (job as any).queueQualifiedName as string;
      }

      const jobName = job.name || "";
      const timestamp = job.timestamp || Date.now();

      const processedOn = job.processedOn;
      const finishedOn = job.finishedOn;
      
      // Determine job status with better fallbacks
      let currentStatus = "waiting"; // Default to waiting instead of unknown
      
      // Check for explicit status first
      if (jobStates[job.id!]) {
        currentStatus = jobStates[job.id!];
      } else if ((job as ExtendedJobType).status) {
        currentStatus = (job as ExtendedJobType).status;
      } 
      // Check for failure indicators - this takes precedence over finishedOn
      else if (job.failedReason || (job as any).failedReason || job.stacktrace?.length) {
        currentStatus = "failed";
      }
      // Then check for completion indicators
      else if (finishedOn) {
        currentStatus = "completed";
      }
      // Check for active job indicators
      else if (processedOn) {
        currentStatus = "active";
      }
      // Check for delayed job indicators
      else if (job.delay && job.delay > 0) {
        currentStatus = "delayed";
      }
      // If no condition is met, it stays as "waiting"
      
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
        currentStatus: currentStatus,
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

  // Job statülerine göre sayım yapma
  const jobStatusCounts = React.useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    
    // Her job için
    processedAndFormattedJobs.forEach(job => {
      const queueName = job.queueName;
      const status = job.currentStatus;
      
      // Queue için kayıt yoksa oluştur
      if (!counts[queueName]) {
        counts[queueName] = {};
      }
      
      // Status için sayaç yoksa oluştur, varsa artır
      counts[queueName][status] = (counts[queueName][status] || 0) + 1;
    });
    
    return counts;
  }, [processedAndFormattedJobs]);

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

  // Action buttons with CSS classes
  const renderActionButtons = (record: JobTableDataType) => {
    return (
      <Space size="small">
        {onFetchJobLogs && (
          <Button
            size="small"
            className={classNames.DETAILS_BUTTON_CLASS}
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
          >
            Details
          </Button>
        )}

        {onJobRetry && (
          <Button
            size="small"
            className={classNames.RETRY_BUTTON_CLASS}
            icon={<ReloadOutlined />}
            onClick={() => onJobRetry(record.originalJob)}
            disabled={record.currentStatus !== "failed"}
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
            <Button
              size="small"
              className={classNames.DELETE_BUTTON_CLASS}
              icon={<DeleteOutlined />}
              danger
            >
              Del
            </Button>
          </Popconfirm>
        )}
      </Space>
    );
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
      render: (status: string) => (
        <Tag className={classNames.STATUS_TAG_CLASS} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
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
            render: (_: unknown, record: JobTableDataType) => renderActionButtons(record),
          },
        ]
      : []),
  ];

  const renderTable = (data: JobTableDataType[]) => (
    <Table<JobTableDataType>
      className={classNames.TABLE_CLASS}
      columns={columns}
      dataSource={data}
      loading={isLoading && initialJobs.length > 0}
      rowKey="key"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: data.length,
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
  );

  if (isLoading && initialJobs.length === 0) {
    return (
      <Spin size="large" className={classNames.LOADING_CLASS}>
        <div style={{ marginTop: 16 }}>Loading jobs...</div>
      </Spin>
    );
  }

  if (error) {
    return (
      <Alert
        className={classNames.ERROR_CLASS}
        message="Error loading jobs"
        description={error}
        type="error"
        showIcon
      />
    );
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
      <div className={classNames.CONTAINER_CLASS} data-theme={theme}>
        <Card className={classNames.FILTER_CARD_CLASS} style={{ marginBottom: 20 }}>
          <div
            className={classNames.FILTERS_CONTAINER_CLASS}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Filters Section */}
            <Row gutter={[16, 16]} className={classNames.FILTER_ROW_CLASS}>
              {/* Search input */}
              <Col xs={24} sm={8} md={8} lg={7} xl={6} className={classNames.SEARCH_COL_CLASS}>
                <Input
                  className={classNames.SEARCH_INPUT_CLASS}
                  placeholder="Search by Job ID or Name"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>

              {/* Queue filter */}
              <Col
                xs={24}
                sm={8}
                md={8}
                lg={7}
                xl={6}
                className={classNames.QUEUE_FILTER_COL_CLASS}
              >
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
              <Col
                xs={24}
                sm={8}
                md={8}
                lg={10}
                xl={12}
                className={classNames.STATUS_FILTER_COL_CLASS}
              >
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

                  <Button
                    icon={<PieChartOutlined />}
                    onClick={() => setIsInsightsModalVisible(true)}
                  >
                    Insights
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

        {renderTable(sortedData)}

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
          onQueueJobClear={typeof onQueueJobClear === 'function' ? async (queueName, status) => {
            try {
              // Kuyruk temizleme işlemini başlat
              await onQueueJobClear(queueName, status);
              
              // Listeyi yenile
              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              console.error("Failed to clear jobs:", error);
            }
          } : undefined}
          jobStatusCounts={jobStatusCounts}
        />

        <InsightsModal
          isVisible={isInsightsModalVisible}
          onCancel={() => setIsInsightsModalVisible(false)}
          jobStatusData={availableJobStates.map(status => {
            const count = processedAndFormattedJobs.filter(job => job.currentStatus === status).length;
            return { status, count };
          })}
          totalJobs={processedAndFormattedJobs.length}
        />
      </div>
    </ThemeProvider>
  );
};

export default BullMQJobList;
