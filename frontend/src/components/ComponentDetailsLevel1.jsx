// src/components/ComponentDetails.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ComponentDetails = () => {
  const [components, setComponents] = useState([]);
  const [newComponent, setNewComponent] = useState({
    code: "",
    componentName: "",
    componentDescription: ""
  });

  const [editingComponent, setEditingComponent] = useState(null);
  const [editData, setEditData] = useState({ ...newComponent });
  const [loading, setLoading] = useState(false);

  // Load all components on mount
  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("https://projectnuckels.onrender.com/api/project/components", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComponents(res.data);
    } catch (err) {
      console.error("Failed to load components:", err.message);
      toast.error("Failed to load component records");
    }
  };

  // Handle form input change
  const handleChange = (e) =>
    setNewComponent({ ...newComponent, [e.target.name]: e.target.value });

  // Submit new component
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { code, componentName } = newComponent;
    if (!code || !componentName) {
      toast.error("Component Code and Name are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "https://projectnuckels.onrender.com/api/project/components",
        newComponent,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setComponents([res.data, ...components]);
      setNewComponent({ code: "", componentName: "", componentDescription: "" });
      toast.success("Component added successfully!");
    } catch (err) {
      console.error("Add failed:", err.response?.data || err.message);
      toast.error("Failed to add component");
    }
  };

  // Open edit modal
  const openEditModal = (component) => {
    setEditingComponent(component._id);
    setEditData({
      code: component.code,
      componentName: component.componentName,
      componentDescription: component.componentDescription || ""
    });
  };

  // Handle edit input change
  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  // Save updated component
  const handleUpdate = async (e) => {
    e.preventDefault();

    const { code, componentName } = editData;
    if (!code || !componentName) {
      toast.error("Component Code and Name are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://projectnuckels.onrender.com/api/project/components/${editingComponent}`,
        editData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setComponents(
        components.map((c) => (c._id === editingComponent ? res.data : c))
      );
      setEditingComponent(null);
      toast.success("Component updated!");
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      toast.error("Failed to update component");
    }
  };

  // Delete a component
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this component?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://projectnuckels.onrender.com/api/project/components/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComponents(components.filter((c) => c._id !== id));
      toast.success("Component deleted");
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
      toast.error("Failed to delete component");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold text-primary border-bottom pb-2">
        Level 1 - Component Details
      </h2>

      {/* Add Component Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border rounded shadow-sm mb-5">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Component Code</label>
            <input
              type="text"
              name="code"
              value={newComponent.code}
              onChange={handleChange}
              placeholder="e.g., CMP-001"
              className="form-control"
              required
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold">Component Name</label>
            <input
              type="text"
              name="componentName"
              value={newComponent.componentName}
              onChange={handleChange}
              placeholder="e.g., Foundation Slab"
              className="form-control"
              required
            />
          </div>
          <div className="col-12 mt-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              name="componentDescription"
              value={newComponent.componentDescription}
              onChange={handleChange}
              rows="2"
              placeholder="Brief description of the component..."
              className="form-control"
            />
          </div>
          <div className="col-12 mt-3">
            <button type="submit" className="btn btn-primary w-100 py-2 fs-5">
              + Add Component
            </button>
          </div>
        </div>
      </form>

      {/* Edit Modal */}
      {editingComponent && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content rounded shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Edit Component</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingComponent(null)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Component Code</label>
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
                    <label className="form-label fw-semibold">Component Name</label>
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
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      name="componentDescription"
                      value={editData.componentDescription}
                      onChange={handleEditChange}
                      rows="2"
                      className="form-control"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary w-100">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(editingComponent)}
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

      {/* Components Table */}
      <div className="mt-4">
        <h4 className="mb-3 text-secondary">🧩 Component Registry</h4>
        <div className="table-responsive shadow-sm rounded border">
          <table className="table table-bordered table-striped align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Code</th>
                <th>Component Name</th>
                <th>Description</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {components.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No components defined yet
                  </td>
                </tr>
              ) : (
                components.map((comp) => (
                  <tr key={comp._id}>
                    <td>
                      <code>{comp.code}</code>
                    </td>
                    <td>{comp.componentName}</td>
                    <td>{comp.componentDescription || "—"} </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => openEditModal(comp)}
                        title="Edit Component"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(comp._id)}
                        title="Delete Component"
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

export default ComponentDetails;