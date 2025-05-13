import React, { useState } from "react";
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  InputNumber, 
  Switch,
  Collapse,
  Divider,
  Radio,
  DatePicker,
  Tooltip 
} from "antd";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { JobOptions } from "../types";

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Group: RadioGroup } = Radio;

interface AddJobModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onAdd: (queueName: string, jobName: string, jobData: any, jobOptions?: JobOptions) => Promise<void>;
  availableQueueNames?: string[];
  isLoading: boolean;
}

const AddJobModal: React.FC<AddJobModalProps> = ({
  isVisible,
  onCancel,
  onAdd,
  availableQueueNames = [],
  isLoading,
}) => {
  const [form] = Form.useForm();
  const [advancedOptions, setAdvancedOptions] = useState(false);
  const [backoffType, setBackoffType] = useState<"fixed" | "exponential">("fixed");
  const [removeOnCompleteType, setRemoveOnCompleteType] = useState<"boolean" | "count" | "object">("boolean");
  const [removeOnFailType, setRemoveOnFailType] = useState<"boolean" | "count" | "object">("boolean");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState<"every" | "cron">("every");

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Parse job data from JSON string
      let jobData;
      try {
        jobData = JSON.parse(values.jobData);
      } catch (error) {
        jobData = values.jobData; // If not valid JSON, use the text as is
      }

      // Collect job options
      const jobOptions: JobOptions = {};

      if (advancedOptions) {
        // Basic options
        if (values.delay) jobOptions.delay = values.delay;
        if (values.attempts) jobOptions.attempts = values.attempts;
        if (values.jobId) jobOptions.jobId = values.jobId;
        if (values.lifo !== undefined) jobOptions.lifo = values.lifo;
        if (values.timeout) jobOptions.timeout = values.timeout;
        if (values.priority) jobOptions.priority = values.priority;
        if (values.stackTraceLimit) jobOptions.stackTraceLimit = values.stackTraceLimit;

        // Backoff option
        if (values.backoffEnabled) {
          if (backoffType === "fixed") {
            jobOptions.backoff = values.backoffDelay || 1000;
          } else {
            jobOptions.backoff = { 
              type: "exponential", 
              delay: values.backoffDelay || 1000 
            };
          }
        }

        // Remove on complete
        if (removeOnCompleteType === "boolean") {
          jobOptions.removeOnComplete = values.removeOnComplete || false;
        } else if (removeOnCompleteType === "count") {
          jobOptions.removeOnComplete = values.removeOnCompleteCount || 1000;
        } else if (removeOnCompleteType === "object") {
          jobOptions.removeOnComplete = {
            count: values.removeOnCompleteObjectCount || 1000,
            age: values.removeOnCompleteObjectAge || 3600
          };
        }

        // Remove on fail
        if (removeOnFailType === "boolean") {
          jobOptions.removeOnFail = values.removeOnFail || false;
        } else if (removeOnFailType === "count") {
          jobOptions.removeOnFail = values.removeOnFailCount || 1000;
        } else if (removeOnFailType === "object") {
          jobOptions.removeOnFail = {
            count: values.removeOnFailObjectCount || 1000,
            age: values.removeOnFailObjectAge || 3600
          };
        }

        // Repeat options
        if (repeatEnabled) {
          jobOptions.repeat = {};
          if (repeatType === "every" && values.repeatEvery) {
            jobOptions.repeat.every = values.repeatEvery;
          } else if (repeatType === "cron" && values.repeatCron) {
            jobOptions.repeat.cron = values.repeatCron;
          }

          if (values.repeatLimit) {
            jobOptions.repeat.limit = values.repeatLimit;
          }

          if (values.repeatTz) {
            jobOptions.repeat.tz = values.repeatTz;
          }

          if (values.repeatEndDate) {
            jobOptions.repeat.endDate = values.repeatEndDate.valueOf(); // Convert moment to timestamp
          }
        }
      }

      await onAdd(values.queueName, values.jobName, jobData, jobOptions);
      form.resetFields();
      onCancel();
    } catch (error) {
      // Form validation error or job add error
      console.error("Failed to add job:", error);
    }
  };

  return (
    <Modal 
      title="Add New Job" 
      open={isVisible} 
      onCancel={onCancel} 
      footer={null} 
      destroyOnClose
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="queueName"
          label="Queue"
          rules={[{ required: true, message: "Please select a queue" }]}
        >
          {availableQueueNames.length > 0 ? (
            <Select placeholder="Select a queue">
              {availableQueueNames.map((queueName) => (
                <Option key={queueName} value={queueName}>
                  {queueName}
                </Option>
              ))}
            </Select>
          ) : (
            <Input placeholder="Enter queue name" />
          )}
        </Form.Item>

        <Form.Item
          name="jobName"
          label="Job Name"
          rules={[{ required: true, message: "Please enter a job name" }]}
        >
          <Input placeholder="Enter job name" />
        </Form.Item>

        <Form.Item
          name="jobData"
          label="Job Data (JSON or text)"
          rules={[{ required: true, message: "Please enter job data" }]}
        >
          <TextArea
            rows={4}
            placeholder='Enter job data as JSON (e.g., {"key": "value"}) or text'
          />
        </Form.Item>

        <Divider>
          <Space>
            Advanced Options
            <Switch
              checked={advancedOptions}
              onChange={setAdvancedOptions}
              checkedChildren="Hide"
              unCheckedChildren="Show"
            />
          </Space>
        </Divider>

        {advancedOptions && (
          <Collapse defaultActiveKey={["basic"]} ghost>
            <Panel header="Basic Options" key="basic">
              <Form.Item name="jobId" label="Job ID">
                <Input placeholder="Optional custom job ID" />
              </Form.Item>

              <Form.Item name="delay" label="Delay (ms)">
                <InputNumber
                  min={0}
                  placeholder="Delay in milliseconds"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item name="attempts" label="Attempts">
                <InputNumber
                  min={1}
                  placeholder="Number of attempts"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item name="timeout" label="Timeout (ms)">
                <InputNumber
                  min={0}
                  placeholder="Timeout in milliseconds"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item name="priority" label="Priority">
                <InputNumber
                  placeholder="Job priority (higher = higher priority)"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item name="stackTraceLimit" label="Stack Trace Limit">
                <InputNumber
                  min={0}
                  placeholder="Stack trace limit"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item name="lifo" label="LIFO" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Panel>

            <Panel header="Backoff Strategy" key="backoff">
              <Form.Item name="backoffEnabled" label="Enable Backoff" valuePropName="checked">
                <Switch onChange={(checked) => form.setFieldsValue({ backoffEnabled: checked })} />
              </Form.Item>
              
              <Form.Item name="backoffType" label="Backoff Type" initialValue="fixed">
                <RadioGroup onChange={(e) => setBackoffType(e.target.value)} value={backoffType}>
                  <Radio value="fixed">Fixed</Radio>
                  <Radio value="exponential">Exponential</Radio>
                </RadioGroup>
              </Form.Item>

              <Form.Item name="backoffDelay" label="Backoff Delay (ms)">
                <InputNumber
                  min={0}
                  placeholder="Delay in milliseconds"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Panel>

            <Panel header="Cleanup Options" key="cleanup">
              <Divider orientation="left">Remove on Complete</Divider>
              
              <Form.Item name="removeOnCompleteType" label="Type" initialValue="boolean">
                <RadioGroup onChange={(e) => setRemoveOnCompleteType(e.target.value)} value={removeOnCompleteType}>
                  <Radio value="boolean">Boolean</Radio>
                  <Radio value="count">Count</Radio>
                  <Radio value="object">Advanced</Radio>
                </RadioGroup>
              </Form.Item>
              
              {removeOnCompleteType === "boolean" && (
                <Form.Item name="removeOnComplete" label="Remove on Complete" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}
              
              {removeOnCompleteType === "count" && (
                <Form.Item name="removeOnCompleteCount" label="Max Jobs to Keep">
                  <InputNumber
                    min={0}
                    placeholder="Number of jobs to keep"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
              
              {removeOnCompleteType === "object" && (
                <>
                  <Form.Item name="removeOnCompleteObjectCount" label="Max Jobs to Keep">
                    <InputNumber
                      min={0}
                      placeholder="Number of jobs to keep"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  
                  <Form.Item name="removeOnCompleteObjectAge" label="Max Age (seconds)">
                    <InputNumber
                      min={0}
                      placeholder="Max age in seconds"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </>
              )}

              <Divider orientation="left">Remove on Fail</Divider>
              
              <Form.Item name="removeOnFailType" label="Type" initialValue="boolean">
                <RadioGroup onChange={(e) => setRemoveOnFailType(e.target.value)} value={removeOnFailType}>
                  <Radio value="boolean">Boolean</Radio>
                  <Radio value="count">Count</Radio>
                  <Radio value="object">Advanced</Radio>
                </RadioGroup>
              </Form.Item>
              
              {removeOnFailType === "boolean" && (
                <Form.Item name="removeOnFail" label="Remove on Fail" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}
              
              {removeOnFailType === "count" && (
                <Form.Item name="removeOnFailCount" label="Max Failed Jobs to Keep">
                  <InputNumber
                    min={0}
                    placeholder="Number of jobs to keep"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
              
              {removeOnFailType === "object" && (
                <>
                  <Form.Item name="removeOnFailObjectCount" label="Max Failed Jobs to Keep">
                    <InputNumber
                      min={0}
                      placeholder="Number of jobs to keep"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  
                  <Form.Item name="removeOnFailObjectAge" label="Max Age (seconds)">
                    <InputNumber
                      min={0}
                      placeholder="Max age in seconds"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </>
              )}
            </Panel>

            <Panel header="Repeat Options" key="repeat">
              <Form.Item name="repeatEnabled" valuePropName="checked" label="Enable Repeating Job">
                <Switch onChange={(checked) => setRepeatEnabled(checked)} />
              </Form.Item>
              
              {repeatEnabled && (
                <>
                  <Form.Item name="repeatType" label="Repeat Type" initialValue="every">
                    <RadioGroup onChange={(e) => setRepeatType(e.target.value)} value={repeatType}>
                      <Radio value="every">Every (ms)</Radio>
                      <Radio value="cron">Cron Expression</Radio>
                    </RadioGroup>
                  </Form.Item>
                  
                  {repeatType === "every" && (
                    <Form.Item name="repeatEvery" label="Repeat Every (ms)">
                      <InputNumber
                        min={0}
                        placeholder="Repeat interval in milliseconds"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  )}
                  
                  {repeatType === "cron" && (
                    <Form.Item 
                      name="repeatCron" 
                      label={
                        <Space>
                          Cron Expression
                          <Tooltip title="Example: * * * * * (runs every minute)">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                    >
                      <Input placeholder="Cron expression (e.g. * * * * *)" />
                    </Form.Item>
                  )}
                  
                  <Form.Item name="repeatLimit" label="Repeat Limit">
                    <InputNumber
                      min={0}
                      placeholder="Maximum number of repetitions"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  
                  <Form.Item name="repeatTz" label="Timezone">
                    <Input placeholder="Timezone (e.g. Europe/London)" />
                  </Form.Item>
                  
                  <Form.Item name="repeatEndDate" label="End Date">
                    <DatePicker showTime style={{ width: "100%" }} />
                  </Form.Item>
                </>
              )}
            </Panel>
          </Collapse>
        )}

        <Divider />
        
        <Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleSubmit}
              loading={isLoading}
            >
              Add Job
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddJobModal;
