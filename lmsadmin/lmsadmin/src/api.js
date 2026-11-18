import axios from "axios";

const API = axios.create({
  baseURL: "https://learnsphere-lms-vkzs.onrender.com/api",
});

export default API;