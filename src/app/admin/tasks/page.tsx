"use client";

import { FormEvent, useEffect, useState } from "react";
import EmployeeTaskViewer from "@/app/admin/tasks/employee-task-viewer";

type Option = { id: string; name: string };

export default function AdminTasksPage() {
  const [employees, setEmployees] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assignedToId: "", departmentId: "", priority: "MEDIUM", dueDate: "" });

  useEffect(() => {
    Promise.all([fetch("/api/employees").then((res) => res.json()), fetch("/api/departments").then((res) => res.json())]).then(([employeeData, departmentData]) => {
      setEmployees(employeeData.employees ?? []);
      setDepartments(departmentData.departments ?? []);
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setMessage(response.ok ? "Task assigned and employee notified." : data.error);
    if (response.ok) setForm({ title: "", description: "", assignedToId: "", departmentId: "", priority: "MEDIUM", dueDate: "" });
  }

  return <main className="form-page">
    <a className="back-link" href="/admin/dashboard">← Admin overview</a>
    <div className="admin-task-columns">
      <section className="admin-task-column">
        <div className="form-header"><p className="eyebrow">TASK CONTROL</p><h1>Assign a task</h1><p>Create work, route it to the right person, and notify them instantly.</p></div>
        <form className="control-form" onSubmit={submit}>
          <label>Task title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Update website homepage" required /></label>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to be delivered?" rows={5} /></label>
          <div className="form-row">
            <label>Assign to<select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} required><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
            <label>Department<select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          </div>
          <div className="form-row">
            <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
            <label>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          </div>
          {message && <p className={message.startsWith("Task") ? "success-message" : "form-error"}>{message}</p>}
          <button className="primary-button" disabled={!employees.length}>Assign task <span>↗</span></button>
        </form>
      </section>
      <EmployeeTaskViewer />
    </div>
  </main>;
}
