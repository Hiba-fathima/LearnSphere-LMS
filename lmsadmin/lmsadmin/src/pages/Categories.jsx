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
  };

  // Add category
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

      if (formData.image) {
        data.append("image", formData.image);
      }

      await axios.post(API_URL, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Category added successfully!");

      setFormData({
        name: "",
        description: "",
        image: null,
      });

      setPreview(null);

      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);

      alert(
        error.response?.data?.message ||
        "Failed to add category"
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

      {/* Add Category Form */}
      <div className="category-form-card">

        <h3>Add New Category</h3>

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
              <img src={preview} alt="Category preview" />

              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFormData((prev) => ({
                    ...prev,
                    image: null,
                  }));
                }}
              >
                Remove Image
              </button>
            </div>
          )}

          <button
            type="submit"
            className="category-add-btn"
            disabled={loading}
          >
            {loading ? "Adding..." : "+ Add Category"}
          </button>

        </form>
      </div>

      {/* Category List */}
      <div className="category-list-card">

        <h3>All Categories</h3>

        {fetching ? (
          <p className="category-message">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="category-message">
            No categories found. Add your first category.
          </p>
        ) : (

          <div className="category-grid">

            {categories.map((category) => (

              <div className="category-item" key={category._id}>

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

                  <button
                    className="category-delete-btn"
                    onClick={() => handleDelete(category._id)}
                  >
                    Delete
                  </button>
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