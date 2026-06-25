import { useState } from 'react';
import { Link } from 'react-router-dom';
import { exportTasksApi, exportTaskTypeLabels, type ExportTaskType } from '../api/exportTasks';

type ExportTaskButtonProps = {
  type: ExportTaskType;
  filters?: Record<string, string | number | boolean | undefined>;
  label?: string;
};

export function ExportTaskButton({ type, filters, label = '导出' }: ExportTaskButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleExport() {
    setSubmitting(true);
    setMessage('');
    try {
      await exportTasksApi.createTask({ type, filters });
      setMessage(`${exportTaskTypeLabels[type]}导出任务已创建，可前往导出中心查看进度。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导出任务创建失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <span className="export-action">
      <button type="button" className="secondary-button" onClick={handleExport} disabled={submitting}>{submitting ? '创建中...' : label}</button>
      {message && <span className="export-message">{message} <Link to="/export/tasks">导出中心</Link></span>}
    </span>
  );
}
