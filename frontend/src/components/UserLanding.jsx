import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 

const UserLanding = () => {
  const [menus, setMenus] = useState([]);
  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    orderType: "takeaway",
    tableNo: "",
    deliveryType: "Customer Pickup", // e.g., "Customer Pickup" or "Delivery Service"
    deliveryPlaceId: "", // ✅ NEW: store selected place ID
    deliveryNote: ""
  });
  const [serviceChargeSettings, setServiceChargeSettings] = useState({
    dineInCharge: 0,
    isActive: false
  });
  // const [deliveryChargeSettings, setDeliveryChargeSettings] = useState({
  //   amount: 0,
  //   isActive: false
  // });
  const [deliveryPlaces, setDeliveryPlaces] = useState([]); // ✅ new state
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [menuPopularity, setMenuPopularity] = useState({}); // e.g., { "Pepperoni Pizza": 42, ... }

  const [waiters, setWaiters] = useState([]);

  const [tempStock, setTempStock] = useState({}); // e.g., { "menuId1": 5, "menuId2": 10 }


  // Load menus and service charge
  useEffect(() => {
    fetchMenus();
    fetchServiceCharge();
    // fetchDeliveryCharge();
    fetchDeliveryPlaces();
    fetchOrdersAndComputePopularity();
    fetchWaiters();
  }, []);

  // Auto-fill customer name when phone changes
  useEffect(() => {
    if (!customer.phone) return;

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("https://projectnuckels.onrender.com/api/auth/customer", {
          params: { phone: customer.phone },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data?.name && !customer.name) {
          setCustomer((prev) => ({ ...prev, name: res.data.name }));
        }
      } catch (err) {
        console.error("Auto-fill failed:", err.message);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [customer.phone]);

  useEffect(() => {
    if (customer.phone.length >= 10) {
      // Trigger auto-fill as before
      const timer = setTimeout(async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("https://projectnuckels.onrender.com/api/auth/customer", {
            params: { phone: customer.phone },
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.name && !customer.name) {
            setCustomer((prev) => ({ ...prev, name: res.data.name }));
          }
        } catch (err) {
          console.error("Auto-fill failed:", err.message);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customer.phone]);

  const fetchWaiters = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://projectnuckels.onrender.com/api/auth/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter employees with role "waiter" (adjust field name if needed, e.g., "role" or "position")
      const waiterList = res.data.filter(emp => 
        emp.role?.toLowerCase() === "waiter" || emp.position?.toLowerCase() === "waiter"
      );

      setWaiters(waiterList);
    } catch (err) {
      console.error("Failed to load waiters:", err.message);
      toast.error("Could not load waiters");
    }
  };


  const fetchMenus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://projectnuckels.onrender.com/api/auth/menus", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenus(res.data);
      const uniqueCategories = [...new Set(res.data.map(menu => menu.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // ✅ Initialize tempStock from currentQty
      const initialTempStock = {};
      res.data.forEach(menu => {
        initialTempStock[menu._id] = menu.currentQty;
      });
      setTempStock(initialTempStock);

      setLoadingCategories(false);
    } catch (err) {
      console.error("Failed to load menus:", err.message);
      setLoadingCategories(false); // Ensure loading stops even on error
    }
  };


  const fetchOrdersAndComputePopularity = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://projectnuckels.onrender.com/api/auth/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orders = res.data; // assume this is an array of orders

      // Count occurrences of each menu item name
      const popularityMap = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.name;
            if (name) {
              popularityMap[name] = (popularityMap[name] || 0) + item.quantity;
            }
          });
        }
      });

      setMenuPopularity(popularityMap);
    } catch (err) {
      console.error("Failed to load order history for sorting:", err.message);
      // Optional: toast.warning("Could not sort by popularity");
    }
  };

  const fetchServiceCharge = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://projectnuckels.onrender.com/api/auth/admin/service-charge",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { dineInCharge, isActive } = res.data;

      setServiceChargeSettings({
        dineInCharge,
        isActive: isActive === true || isActive === "true" // ✅ ensures boolean
      });
    } catch (err) {
      console.error("Failed to load service charge:", err.message);
      console.error("Failed to load service charge:", err.response?.data || err.message);

    }
  };

  const fetchDeliveryPlaces = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://projectnuckels.onrender.com/api/auth/delivery-charges", { // ✅ updated endpoint
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveryPlaces(res.data); // ✅ store array of places
    } catch (err) {
      console.error("Failed to load delivery places:", err.message);
      toast.error("Failed to load delivery zones");
    }
  };

  return (
    <div className="container-fluid px-4">
      <h2 className="mb-4 text-primary border-bottom pb-2 fw-bold">User Management</h2>

      
      <ToastContainer />
    </div>
  );
};

export default UserLanding;