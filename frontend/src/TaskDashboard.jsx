import { useEffect, useState } from "react";
import { api } from "./api";
import "./TaskDashboard.css";

const emptyForm = {
  title: "",
  description: "",
  due_date: "",
};

function TaskDashboard({ token }) {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.getTasks(token)
      .then((data) => {
        if (active) {
          setTasks(Array.isArray(data) ? data : data?.results ?? []);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const taskData = {
      title: form.title.trim(),
      description: form.description,
      due_date: form.due_date || null,
    };

    try {
      if (editingId !== null) {
        const updatedTask = await api.updateTask(
          token,
          editingId,
          taskData
        );

        setTasks((previous) =>
          previous.map((task) =>
            task.id === editingId ? updatedTask : task
          )
        );
      } else {
        const newTask = await api.createTask(token, taskData);

        setTasks((previous) => [newTask, ...previous]);
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(task) {
    setEditingId(task.id);

    setForm({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleStatusChange(taskId, status) {
    setError("");

    try {
      const updatedTask = await api.updateStatus(
        token,
        taskId,
        status
      );

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? { ...task, ...updatedTask }
            : task
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.deleteTask(token, taskId);

      setTasks((previous) =>
        previous.filter((task) => task.id !== taskId)
      );

      if (editingId === taskId) {
        handleCancel();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="task-container">
      {error && <div className="error-message">{error}</div>}

      <div className="task-layout">
        <section className="task-form-card">
          <h2>{editingId !== null ? "Edit Task" : "Create Task"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="task-title">Task Title</label>
              <input
                id="task-title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Task"
                  : "Create Task"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </form>
        </section>

        <section className="task-list-card">
          <div className="task-list-heading">
            <h2>My Tasks</h2>
            <span>{tasks.length} Tasks</span>
          </div>

          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-message">
              No tasks yet. Create your first task!
            </p>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div className="task-item" key={task.id}>
                  <h3>{task.title}</h3>

                  <p>{task.description || "No description"}</p>

                  {task.due_date && (
                    <p className="task-date">
                      Due: {task.due_date}
                    </p>
                  )}

                  <div className="task-bottom">
                    <select
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(
                          task.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">
                        In Progress
                      </option>
                      <option value="done">Done</option>
                    </select>

                    <div className="task-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(task)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default TaskDashboard;