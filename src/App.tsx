import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { restaurantApi } from "@/lib/api";

// Pages
import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PublicMenu from "./pages/PublicMenu";
import NotFound from "./pages/NotFound";

// Dashboard
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import RestaurantSetup from "./pages/dashboard/RestaurantSetup";
import Categories from "./pages/dashboard/Categories";
import MenuItems from "./pages/dashboard/MenuItems";
import Tags from "./pages/dashboard/Tags";import AddOns from './pages/dashboard/AddOns';import QRCodePage from "./pages/dashboard/QRCode";
import Settings from "./pages/dashboard/Settings";
import WhatsAppSettings from "./pages/dashboard/WhatsAppSettings";
import WhatsAppAnalytics from "./pages/dashboard/WhatsAppAnalytics";
import WhatsAppCustomerSheet from "./pages/dashboard/WhatsAppCustomerSheet";
import WhatsAppAutomation from "./pages/dashboard/WhatsAppAutomation";
import WhatsAppQuickReplies from "./pages/dashboard/WhatsAppQuickReplies";
import BroadcastPage from "./pages/dashboard/Broadcast";
import MetaAdsPage from "./pages/dashboard/MetaAds";
import ForgotPassword from "./pages/auth/ForgotPassword";

const queryClient = new QueryClient();

// Wrapper components to inject restaurantId
function WhatsAppSettingsWrapper() {
  const [restaurantId, setRestaurantId] = useState<string>("");
  
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restaurant = await restaurantApi.get();
        setRestaurantId(restaurant._id);
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      }
    };
    fetchRestaurant();
  }, []);

  return restaurantId ? <WhatsAppSettings restaurantId={restaurantId} /> : <div>Loading...</div>;
}

function WhatsAppAnalyticsWrapper() {
  const [restaurantId, setRestaurantId] = useState<string>("");
  
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restaurant = await restaurantApi.get();
        setRestaurantId(restaurant._id);
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      }
    };
    fetchRestaurant();
  }, []);

  return restaurantId ? <WhatsAppAnalytics restaurantId={restaurantId} /> : <div>Loading...</div>;
}

function WhatsAppCustomerSheetWrapper() {
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restaurant = await restaurantApi.get();
        setRestaurantId(restaurant._id);
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      }
    };
    fetchRestaurant();
  }, []);

  return restaurantId ? <WhatsAppCustomerSheet restaurantId={restaurantId} /> : <div>Loading...</div>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/menu/:slug" element={<PublicMenu />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="setup" element={<RestaurantSetup />} />
              <Route path="categories" element={<Categories />} />
              <Route path="tags" element={<Tags />} />
              <Route path="add-ons" element={<AddOns />} />
              <Route path="items" element={<MenuItems />} />
              <Route path="items/new" element={<MenuItems />} />
              <Route path="qr" element={<QRCodePage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="whatsapp" element={<WhatsAppSettingsWrapper />} />
              <Route path="whatsapp-automation" element={<WhatsAppAutomation />} />
              <Route path="whatsapp-quick-replies" element={<WhatsAppQuickReplies />} />
              <Route path="whatsapp-customers" element={<WhatsAppCustomerSheetWrapper />} />
              <Route path="whatsapp-chat" element={<WhatsAppAnalyticsWrapper />} />
              <Route path="broadcast" element={<BroadcastPage />} />
              <Route path="meta-ads" element={<MetaAdsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
