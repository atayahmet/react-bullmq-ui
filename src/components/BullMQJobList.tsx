import React, { useState, useEffect, useMemo } from "react";
import { Job } from "bullmq";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Spin,
  Alert,
  Input,
  Select,
  Radio,
  Row,
  Col,
  Card,
  Switch,
  Popconfirm,
} from "antd";
import type { TableProps, TableColumnsType } from "antd";
import {
  ReloadOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  AppstoreOutlined,
  SyncOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { BullMQJobListProps, JobTableDataType, ExtendedJobType } from "../types";
import { getStatusColor, formatTimestamp } from "../utils/formatters";
import { ALL_QUEUES, ALL_STATES } from "../constants";
import JobDetailModal from "./JobDetailModal";
import AddJobModal from "./AddJobModal";

const { Title, Text } = Typography;
const { Option } = Select;

const BullMQJobList: React.FC<BullMQJobListProps> = ({
  jobs: initialJobs,
  isLoading = false,
  error = null,
  onJobRetry,
  onJobDelete,
  onFetchJobLogs,
  defaultPageSize = 10,
  availableQueueNames: providedQueueNames,
  refreshInterval = 5000,
  onRefresh,
  onJobAdd,
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

  // Job state'leri otomatik olarak algılama
  const [jobStates, setJobStates] = useState<Record<string, string>>({});

  // Mevcut job durumlarını takip etmek için
  const [availableJobStates, setAvailableJobStates] = useState<string[]>([
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
    "waiting-children",
  ]);

  // Job state'lerini job'lardan algıla
  useEffect(() => {
    const detectJobStates = async () => {
      if (initialJobs.length > 0) {
        const newJobStates: Record<string, string> = {};
        const stateSet = new Set<string>();

        // Varsayılan durumları ekle
        stateSet.add("waiting");
        stateSet.add("active");
        stateSet.add("completed");
        stateSet.add("failed");
        stateSet.add("delayed");
        stateSet.add("paused");
        stateSet.add("waiting-children");

        for (const job of initialJobs) {
          if (job.id) {
            // ExtendedJobType türünde mi kontrol ediyoruz
            const extendedJob = job as ExtendedJobType;
            if (extendedJob.status) {
              newJobStates[job.id] = extendedJob.status;
              stateSet.add(extendedJob.status); // Yeni durumu ekle
            }
          }
        }

        setJobStates(newJobStates);
        setAvailableJobStates(Array.from(stateSet)); // Mevcut tüm durumları güncelle
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

    // Job status'ünü direkt olarak kullan
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
        onRefresh(); // Refresh the job list after adding a job
      }
    } catch (error) {
      console.error("Failed to add job:", error);
    } finally {
      setIsAddingJob(false);
    }
  };

  const allQueueNamesForFilter = useMemo(() => {
    if (providedQueueNames && providedQueueNames.length > 0) {
      return providedQueueNames;
    }
    // Queue isimlerini job'lardan topla
    const queueNames = new Set<string>();
    initialJobs.forEach((job) => {
      const queueName = (job as ExtendedJobType).queueName;
      if (queueName) {
        queueNames.add(queueName);
      }
    });
    return Array.from(queueNames);
  }, [initialJobs, providedQueueNames]);

  const processedAndFormattedJobs = useMemo(() => {
    let tableData: JobTableDataType[] = initialJobs.map((job) => {
      // Queue bilgisini doğrudan job nesnesinden al
      const queueName = (job as ExtendedJobType).queueName || "unknown";

      // Ham job nesnesi veya BullMQ Job nesnesi kontrolü
      const jobName = job.name || "";
      const timestamp = job.timestamp || Date.now();

      // Özel alanların kontrolü
      const processedOn = job.processedOn;
      const finishedOn = job.finishedOn;
      const currentStatus = jobStates[job.id!] || (job as ExtendedJobType).status || "unknown";
      const data = job.data;
      const opts = job.opts;
      const failedReason = job.failedReason;
      const stacktrace = job.stacktrace;
      const attemptsMade = job.attemptsMade || 0;
      const delay = job.delay;

      // Farklı veri formatları için uyumluluk
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

  const columns: TableColumnsType<JobTableDataType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: true,
      width: 100,
      ellipsis: true,
      render: (id) => (
        <Text
          copyable={{ text: String(id) }}
          style={{
            maxWidth: 80,
            display: "inline-block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {String(id)}
        </Text>
      ),
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
    {
      title: "Actions",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, record: JobTableDataType) => (
        <Space size="small">
          {onFetchJobLogs && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => showDetailModal(record)}>
              Details
            </Button>
          )}

          {onJobRetry && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => onJobRetry(record.originalJob)}
              disabled={record.currentStatus === "completed" || record.currentStatus === "active"}
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
  ];

  if (isLoading && initialJobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large">
          <div style={{ marginTop: 16 }}>Loading jobs...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading jobs"
        description={error}
        type="error"
        showIcon
        style={{ margin: "20px" }}
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
    <div style={{ padding: "20px" }}>
      <Title level={3} style={{ marginBottom: "20px" }}>
        BullMQ Job Dashboard
      </Title>
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={6} lg={5}>
            <Input
              placeholder="Search by Job ID or Name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={5}>
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
          <Col xs={24} sm={12} md={6} lg={6}>
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
          <Col xs={24} sm={24} md={6} lg={8} style={{ textAlign: "right" }}>
            <Space>
              {onJobAdd && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddJobModalVisible(true)}
                  color="green"
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
                  <span>Auto refresh:</span>
                  <Switch
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    checked={autoRefreshEnabled}
                    onChange={setAutoRefreshEnabled}
                    disabled={!onRefresh}
                  />
                </>
              )}
            </Space>
          </Col>
        </Row>
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
          availableQueueNames={providedQueueNames || allQueueNamesForFilter}
          isLoading={isAddingJob}
        />
      )}
    </div>
  );
};

export default BullMQJobList;
