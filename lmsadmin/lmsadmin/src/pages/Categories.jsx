import { useEffect, useState } from "react";
import axios from "axios";
import "../css/Categories.css";

const API_URL = "https://learnsphere-lms-vkzs.onrender.com/api/categories";
const SERVER_URL = "https://learnsphere-lms-vkzs.onrender.com";

function Categories() {
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const token = localStorage.getItem("token");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setFetching(true);

      const response = await axios.get(
        API_URL,
        getAuthConfig()
      );

      setCategories(response.data.categories || []);

    } catch (error) {
      console.error("Error fetching categories:", error);

      alert(
        error.response?.data?.message ||
        "Unable to load categories"
      );

    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5 MB.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));

    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: null,
    });

    setPreview(null);
    setEditingId(null);
    setRemoveImage(false);
  };

  // Edit category
  const handleEdit = (category) => {
    setEditingId(category._id);

    setFormData({
      name: category.name,
      description: category.description || "",
      image: null,
    });

    setPreview(
      category.image
        ? `${SERVER_URL}${category.image}`
        : null
    );

    setRemoveImage(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Add or Update category
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter category name.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("name", formData.name.trim());
      data.append("description", formData.description);
      data.append("removeImage", String(removeImage));

      if (formData.image) {
        data.append("image", formData.image);
      }

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          data,
          getAuthConfig()
        );

        alert("Category updated successfully!");

      } else {
        await axios.post(
          API_URL,
          data,
          getAuthConfig()
        );

        alert("Category added successfully!");
      }

      resetForm();
      fetchCategories();

    } catch (error) {
      console.error("Category save error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to save category"
      );

    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      alert("Category deleted successfully!");

      fetchCategories();

    } catch (error) {
      console.error("Error deleting category:", error);

      alert(
        error.response?.data?.message ||
        "Failed to delete category"
      );
    }
  };

  return (
    <div className="categories-page">

      <div className="categories-header">
        <div>
          <h2>Categories</h2>
          <p>Manage your course categories</p>
        </div>

        <div className="category-count">
          Total Categories: {categories.length}
        </div>
      </div>

      {/* Add / Edit Category Form */}
      <div className="category-form-card">

        <h3>
          {editingId ? "Edit Category" : "Add New Category"}
        </h3>

        <form onSubmit={handleSubmit}>

          <div className="category-form-grid">

            <div className="category-input-group">
              <label>Category Name *</label>

              <input
                type="text"
                name="name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="category-input-group">
              <label>Description</label>

              <input
                type="text"
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="category-input-group">
              <label>Category Image (Optional)</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

          </div>

          {preview && (
            <div className="category-preview">

              <img
                src={preview}
                alt="Category preview"
              />

              <button
                type="button"
                onClick={() => {
                  setPreview(null);

                  setFormData((prev) => ({
                    ...prev,
                    image: null,
                  }));

                  setRemoveImage(true);
                }}
              >
                Remove Image
              </button>

            </div>
          )}

          <div className="category-form-actions">

            <button
              type="submit"
              className="category-add-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "+ Add Category"}
            </button>

            {editingId && (
              <button
                type="button"
                className="category-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}

          </div>

        </form>
      </div>

      {/* Category List */}
      <div className="category-list-card">

        <h3>All Categories</h3>

        {fetching ? (
          <p className="category-message">
            Loading categories...
          </p>
        ) : categories.length === 0 ? (
          <p className="category-message">
            No categories found. Add your first category.
          </p>
        ) : (

          <div className="category-grid">

            {categories.map((category) => (

              <div
                className="category-item"
                key={category._id}
              >

                {category.image ? (
                  <img
                    src={`${SERVER_URL}${category.image}`}
                    alt={category.name}
                    className="category-image"
                  />
                ) : (
                  <div className="category-no-image">
                    No Image
                  </div>
                )}

                <div className="category-details">

                  <h4>{category.name}</h4>

                  <p>
                    {category.description || "No description"}
                  </p>

                  <div className="category-actions">

                    <button
                      className="category-edit-btn"
                      onClick={() => handleEdit(category)}
                    >
                      Edit
                    </button>

                    <button
                      className="category-delete-btn"
                      onClick={() => handleDelete(category._id)}
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default Categories;