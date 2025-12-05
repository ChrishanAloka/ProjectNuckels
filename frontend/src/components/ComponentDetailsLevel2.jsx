// src/components/Level2ComponentDetails.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Level2ComponentDetails = () => {
  const [subComponents, setSubComponents] = useState([]);
  const [parentComponents, setParentComponents] = useState([]);
  const [newSub, setNewSub] = useState({
    code: "",
    componentName: "",
    componentDescription: "",
    parentComponent: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ ...newSub });

  // Load data
  useEffect(() => {
    fetchSubComponents();
    fetchParentComponents();
  }, []);

  const fetchSubComponents = async () => {
    try {
      const res = await axios.get("https://projectnuckels.onrender.com/api/project/level2");
      setSubComponents(res.data);
    } catch (err) {
      toast.error("Failed to load Level 2 components");
    }
  };

  const fetchParentComponents = async () => {
    try {
      const res = await axios.get("https://projectnuckels.onrender.com/api/project/level2/parents");
      setParentComponents(res.data);
    } catch (err) {
      toast.error("Failed to load Level 1 components");
    }
  };

  const handleChange = (e) =>
    setNewSub({ ...newSub, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { code, componentName, parentComponent } = newSub;
    if (!code || !componentName || !parentComponent) {
      toast.error("All fields except description are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "https://projectnuckels.onrender.com/api/project/level2",
        newSub,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubComponents([res.data, ...subComponents]);
      setNewSub({ code: "", componentName: "", componentDescription: "", parentComponent: "" });
      toast.success("Level 2 component added!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add component");
    }
  };

  const openEdit = (sub) => {
    setEditingId(sub._id);
    setEditData({
      code: sub.code,
      componentName: sub.componentName,
      componentDescription: sub.componentDescription || "",
      parentComponent: sub.parentComponent._id
    });
  };

  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { code, componentName, parentComponent } = editData;
    if (!code || !componentName || !parentComponent) {
      toast.error("All fields except description are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://projectnuckels.onrender.com/api/project/level2/${editingId}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubComponents(subComponents.map(s => s._id === editingId ? res.data : s));
      setEditingId(null);
      toast.success("Updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Level 2 component?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://projectnuckels.onrender.com/api/project/level2/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubComponents(subComponents.filter(s => s._id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Format parent display
  const getParentLabel = (parent) => {
    if (!parent) return "—";
    return `${parent.code} - ${parent.componentName}`;
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold text-info border-bottom pb-2">
        Level 2 - Component Details
      </h2>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border rounded shadow-sm mb-5">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Component Code</label>
            <input
              type="text"
              name="code"
              value={newSub.code}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold">Component Name</label>
            <input
              type="text"
              name="componentName"
              value={newSub.componentName}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Parent Component (Level 1)</label>
            <select
              name="parentComponent"
              value={newSub.parentComponent}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">-- Select Level 1 Component --</option>
              {parentComponents.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.code} - {p.componentName}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 mt-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              name="componentDescription"
              value={newSub.componentDescription}
              onChange={handleChange}
              rows="2"
              className="form-control"
            />
          </div>
          <div className="col-12 mt-3">
            <button type="submit" className="btn btn-info w-100 py-2 fs-5">
              + Add Level 2 Component
            </button>
          </div>
        </div>
      </form>

      {/* Edit Modal */}
      {editingId && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5>Edit Level 2 Component</h5>
                <button className="btn-close btn-close-white" onClick={() => setEditingId(null)} />
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <input
                      type="text"
                      name="code"
                      value={editData.code}
                      onChange={handleEditChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      name="componentName"
                      value={editData.componentName}
                      onChange={handleEditChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <select
                      name="parentComponent"
                      value={editData.parentComponent}
                      onChange={handleEditChange}
                      className="form-select"
                      required
                    >
                      <option value="">-- Select --</option>
                      {parentComponents.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.code} - {p.componentName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <textarea
                      name="componentDescription"
                      value={editData.componentDescription}
                      onChange={handleEditChange}
                      rows="2"
                      className="form-control"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-info flex-grow-1">Save</button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(editingId)}
                    >
                      Delete
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-4">
        <h4 className="mb-3 text-secondary">🧩 Level 2 Components</h4>
        <div className="table-responsive shadow-sm rounded border">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Parent (Level 1)</th>
                <th>Description</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subComponents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No Level 2 components yet
                  </td>
                </tr>
              ) : (
                subComponents.map((sub) => (
                  <tr key={sub._id}>
                    <td><code>{sub.code}</code></td>
                    <td>{sub.componentName}</td>
                    <td>{getParentLabel(sub.parentComponent)}</td>
                    <td>{sub.componentDescription || "—"}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-info me-2"
                        onClick={() => openEdit(sub)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(sub._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Level2ComponentDetails;